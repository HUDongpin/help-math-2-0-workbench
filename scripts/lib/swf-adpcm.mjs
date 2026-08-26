/**
 * Pure decoder for the ADPCMSOUNDDATA bitstream defined by Adobe's
 * SWF File Format Specification, version 19, pp. 186-188.
 *
 * SWF bit fields are consumed most-significant-bit first. ADPCM packet
 * initial samples, indices, and codes remain in that bitstream; they are not
 * independently byte-aligned. The caller must supply the source-declared
 * samples-per-channel count because a partial final packet is length-bound.
 */

export const SWF_ADPCM_STEP_SIZE_TABLE = Object.freeze([
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
  19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
  50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
  130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
  337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
  876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
  2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
  5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
  15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
]);

export const SWF_ADPCM_INDEX_TABLES = Object.freeze({
  2: Object.freeze([-1, 2]),
  3: Object.freeze([-1, -1, 2, 4]),
  4: Object.freeze([-1, -1, -1, -1, 2, 4, 6, 8]),
  5: Object.freeze([-1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16]),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function asBytes(value) {
  invariant(value instanceof Uint8Array, "SWF ADPCM input must be a Uint8Array");
  return value;
}

class MsbBitReader {
  constructor(bytes) {
    this.bytes = asBytes(bytes);
    this.bitOffset = 0;
  }

  get bitLength() {
    return this.bytes.length * 8;
  }

  get remainingBits() {
    return this.bitLength - this.bitOffset;
  }

  readUnsigned(bitCount, label = "bit field") {
    invariant(Number.isSafeInteger(bitCount) && bitCount >= 0 && bitCount <= 31,
      `${label}: invalid bit count ${bitCount}`);
    invariant(this.remainingBits >= bitCount,
      `${label}: need ${bitCount} bits at offset ${this.bitOffset}, only ${this.remainingBits} remain`);
    let value = 0;
    for (let index = 0; index < bitCount; index += 1) {
      const absoluteBit = this.bitOffset + index;
      const byte = this.bytes[absoluteBit >>> 3];
      const bit = (byte >>> (7 - (absoluteBit & 7))) & 1;
      value = (value * 2) + bit;
    }
    this.bitOffset += bitCount;
    return value;
  }

  readSigned(bitCount, label = "signed bit field") {
    invariant(bitCount > 0, `${label}: signed field must contain at least one bit`);
    const value = this.readUnsigned(bitCount, label);
    const signThreshold = 2 ** (bitCount - 1);
    return value >= signThreshold ? value - (2 ** bitCount) : value;
  }
}

/** Decode one SWF ADPCM code without mutating caller state. */
export function decodeSwfAdpcmCode({predictor, index, code, codeSizeBits}) {
  invariant(Number.isSafeInteger(predictor) && predictor >= -32768 && predictor <= 32767,
    `Invalid SWF ADPCM predictor ${predictor}`);
  invariant(Number.isSafeInteger(index) && index >= 0 && index < SWF_ADPCM_STEP_SIZE_TABLE.length,
    `Invalid SWF ADPCM step index ${index}`);
  const indexTable = SWF_ADPCM_INDEX_TABLES[codeSizeBits];
  invariant(indexTable, `Unsupported SWF ADPCM code size ${codeSizeBits}`);
  invariant(Number.isSafeInteger(code) && code >= 0 && code < (2 ** codeSizeBits),
    `Invalid ${codeSizeBits}-bit SWF ADPCM code ${code}`);

  const signMask = 1 << (codeSizeBits - 1);
  const magnitude = code & (signMask - 1);
  const step = SWF_ADPCM_STEP_SIZE_TABLE[index];
  let difference = step >> (codeSizeBits - 1);
  for (let magnitudeBit = codeSizeBits - 2; magnitudeBit >= 0; magnitudeBit -= 1) {
    if ((magnitude & (1 << magnitudeBit)) !== 0) {
      difference += step >> (codeSizeBits - 2 - magnitudeBit);
    }
  }

  const nextPredictor = clamp(
    (code & signMask) === 0 ? predictor + difference : predictor - difference,
    -32768,
    32767,
  );
  const nextIndex = clamp(index + indexTable[magnitude], 0, SWF_ADPCM_STEP_SIZE_TABLE.length - 1);
  return {predictor: nextPredictor, index: nextIndex, difference, magnitude, negative: (code & signMask) !== 0};
}

/**
 * Decode one ADPCMSOUNDDATA record (one SoundStreamBlock in the current G4 L3
 * source) to interleaved signed 16-bit PCM samples.
 */
export function decodeSwfAdpcmSoundData(bytes, {channels, sampleCountPerChannel}) {
  bytes = asBytes(bytes);
  invariant(channels === 1 || channels === 2, `SWF ADPCM channels must be 1 or 2, received ${channels}`);
  invariant(Number.isSafeInteger(sampleCountPerChannel) && sampleCountPerChannel > 0,
    `SWF ADPCM sampleCountPerChannel must be a positive safe integer`);
  invariant(sampleCountPerChannel * channels <= 0x7fffffff,
    `SWF ADPCM decoded sample allocation is too large`);

  const reader = new MsbBitReader(bytes);
  const codeSizeBits = reader.readUnsigned(2, "AdpcmCodeSize") + 2;
  invariant(SWF_ADPCM_INDEX_TABLES[codeSizeBits], `Unsupported SWF ADPCM code size ${codeSizeBits}`);
  const pcm16 = new Int16Array(sampleCountPerChannel * channels);
  const packets = [];
  let producedPerChannel = 0;

  while (producedPerChannel < sampleCountPerChannel) {
    const packetSampleCount = Math.min(4096, sampleCountPerChannel - producedPerChannel);
    const channelStates = [];
    for (let channel = 0; channel < channels; channel += 1) {
      const predictor = reader.readSigned(16, `packet ${packets.length + 1} channel ${channel + 1} InitialSample`);
      const index = reader.readUnsigned(6, `packet ${packets.length + 1} channel ${channel + 1} InitialIndex`);
      invariant(index < SWF_ADPCM_STEP_SIZE_TABLE.length,
        `packet ${packets.length + 1} channel ${channel + 1}: InitialIndex ${index} exceeds step table`);
      channelStates.push({predictor, index});
      pcm16[(producedPerChannel * channels) + channel] = predictor;
    }
    const packet = {
      packetIndex: packets.length + 1,
      sampleOffsetPerChannel: producedPerChannel,
      sampleCountPerChannel: packetSampleCount,
      initialSamples: channelStates.map((state) => state.predictor),
      initialIndices: channelStates.map((state) => state.index),
    };

    for (let packetSample = 1; packetSample < packetSampleCount; packetSample += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const code = reader.readUnsigned(codeSizeBits,
          `packet ${packet.packetIndex} sample ${packetSample + 1} channel ${channel + 1} code`);
        channelStates[channel] = decodeSwfAdpcmCode({...channelStates[channel], code, codeSizeBits});
        pcm16[((producedPerChannel + packetSample) * channels) + channel] = channelStates[channel].predictor;
      }
    }
    packet.finalSamples = channelStates.map((state) => state.predictor);
    packet.finalIndices = channelStates.map((state) => state.index);
    packets.push(packet);
    producedPerChannel += packetSampleCount;
  }

  invariant(reader.remainingBits <= 7,
    `SWF ADPCM record has ${reader.remainingBits} unconsumed bits; sample count or packet boundaries are inconsistent`);
  const paddingBitCount = reader.remainingBits;
  const paddingValue = reader.readUnsigned(paddingBitCount, "terminal padding");
  invariant(paddingValue === 0, `SWF ADPCM terminal padding must be zero, received ${paddingValue}`);

  return {
    pcm16,
    codeSizeBits,
    channels,
    sampleCountPerChannel,
    interleavedSampleCount: pcm16.length,
    packetCount: packets.length,
    packets,
    sourceByteLength: bytes.length,
    consumedDataBits: (bytes.length * 8) - paddingBitCount,
    paddingBitCount,
    paddingValue,
  };
}

/** Decode independently framed SWF ADPCM records and concatenate their PCM. */
export function decodeSwfAdpcmBlocks(blocks, {channels}) {
  invariant(Array.isArray(blocks) && blocks.length > 0, "SWF ADPCM blocks must be a non-empty array");
  const decodedBlocks = blocks.map((block, index) => {
    invariant(block && typeof block === "object", `SWF ADPCM block ${index + 1} must be an object`);
    return decodeSwfAdpcmSoundData(block.bytes, {
      channels,
      sampleCountPerChannel: block.sampleCountPerChannel,
    });
  });
  const sampleCountPerChannel = decodedBlocks.reduce((sum, block) => sum + block.sampleCountPerChannel, 0);
  const pcm16 = new Int16Array(sampleCountPerChannel * channels);
  let outputOffset = 0;
  for (const block of decodedBlocks) {
    pcm16.set(block.pcm16, outputOffset);
    outputOffset += block.pcm16.length;
  }
  return {
    pcm16,
    channels,
    sampleCountPerChannel,
    interleavedSampleCount: pcm16.length,
    blockCount: decodedBlocks.length,
    decodedBlocks,
  };
}

/** Wrap interleaved signed 16-bit PCM in a canonical 44-byte RIFF/WAVE header. */
export function encodePcm16LeWav(pcm16, {sampleRateHz, channels}) {
  invariant(pcm16 instanceof Int16Array, "PCM WAV input must be an Int16Array");
  invariant(channels === 1 || channels === 2, `PCM WAV channels must be 1 or 2, received ${channels}`);
  invariant(Number.isSafeInteger(sampleRateHz) && sampleRateHz > 0 && sampleRateHz <= 0xffffffff,
    `Invalid PCM WAV sample rate ${sampleRateHz}`);
  invariant(pcm16.length % channels === 0, "PCM WAV interleaved sample count is not divisible by channels");
  const dataByteLength = pcm16.length * 2;
  invariant(dataByteLength <= 0xffffffff - 36, "PCM WAV data exceeds RIFF size limit");
  const bytes = Buffer.alloc(44 + dataByteLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(36 + dataByteLength, 4);
  bytes.write("WAVE", 8, "ascii");
  bytes.write("fmt ", 12, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(sampleRateHz, 24);
  bytes.writeUInt32LE(sampleRateHz * channels * 2, 28);
  bytes.writeUInt16LE(channels * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataByteLength, 40);
  for (let index = 0; index < pcm16.length; index += 1) bytes.writeInt16LE(pcm16[index], 44 + (index * 2));
  return bytes;
}
