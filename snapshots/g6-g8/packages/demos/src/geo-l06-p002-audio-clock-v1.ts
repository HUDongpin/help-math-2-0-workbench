import SOURCE_IR from './generated/geo001-l06-p002-display-ir-v1.json';

/** Source-derived candidate mapping, not an original-runtime synchronization claim. */
export const GEO_L06_P002_AUDIO_CLOCK = Object.freeze({
  animationId: 'shared-geo001-l06-p002',
  sourceSwfSha256: '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44',
  sourceMp3Sha256: '2109aaa85e801d9a5bddbf2c0f30184e078a9eab75785580f477d51147fe325e',
  sampleRate: 22050,
  samplesPerSourceFrame: 1837,
  initialLatencySamples: 1673,
  decodedSamples: 2200320,
  sourceSynchronizationAccepted: false,
  segments: Object.freeze([
    Object.freeze({id: 'before-first-gap', firstFrame: 8, endFrame: 417,
      firstDecodedSample: 1673, endDecodedSample: 752832}),
    Object.freeze({id: 'between-gaps', firstFrame: 423, endFrame: 463,
      firstDecodedSample: 753084, endDecodedSample: 826560}),
    Object.freeze({id: 'after-second-gap', firstFrame: 469, endFrame: 1217,
      firstDecodedSample: 826642, endDecodedSample: 2200320}),
  ]),
});

export type GeoL06P002AudioSegment = typeof GEO_L06_P002_AUDIO_CLOCK.segments[number];

export function geoL06P002AudioAtFrame(frame: number): Readonly<{
  segment: GeoL06P002AudioSegment;
  decodedSample: number;
}> | null {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 1216) {
    throw Error('GEO_L06_P002_AUDIO_FRAME_OUT_OF_RANGE');
  }
  const segment = GEO_L06_P002_AUDIO_CLOCK.segments.find(item =>
    frame >= item.firstFrame && frame < item.endFrame);
  if (!segment) return null;
  const decodedSample = segment.firstDecodedSample +
    (frame - segment.firstFrame) * GEO_L06_P002_AUDIO_CLOCK.samplesPerSourceFrame;
  if (decodedSample < segment.firstDecodedSample || decodedSample >= segment.endDecodedSample) {
    throw Error('GEO_L06_P002_AUDIO_SAMPLE_OUT_OF_RANGE');
  }
  return Object.freeze({segment, decodedSample});
}

const IR = SOURCE_IR;
if (IR.animationId !== GEO_L06_P002_AUDIO_CLOCK.animationId ||
    IR.sourceSwfSha256 !== GEO_L06_P002_AUDIO_CLOCK.sourceSwfSha256 ||
    IR.embeddedMp3Sha256 !== GEO_L06_P002_AUDIO_CLOCK.sourceMp3Sha256 ||
    IR.fps !== 12 || IR.mainFrameCount !== 1216 || IR.soundBlocks.length !== 1200 ||
    IR.soundBlocks[0]?.frame !== 7 || IR.soundBlocks[0].seekSamples !== 1673 ||
    IR.soundBlocks[0].sampleCount !== 3456) {
  throw Error('GEO_L06_P002_AUDIO_SOURCE_DRIFT');
}
let decodedBefore = 0;
for (const block of IR.soundBlocks) {
  const expected = geoL06P002AudioAtFrame(block.frame);
  if (block.frame === 7) {
    // The first block carries the encoder latency, before the candidate clock starts.
  } else if (block.frame === 8 || block.frame === 417 || block.frame === 463) {
    if (block.sampleCount !== 0 || block.payloadSha256 !==
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') {
      throw Error('GEO_L06_P002_AUDIO_ZERO_BLOCK_DRIFT');
    }
  } else if (!expected || decodedBefore + block.seekSamples !== expected.decodedSample) {
    throw Error(`GEO_L06_P002_AUDIO_SEEK_DRIFT_${block.frame}`);
  }
  decodedBefore += block.sampleCount;
}
if (decodedBefore !== GEO_L06_P002_AUDIO_CLOCK.decodedSamples ||
    IR.soundBlocks.at(-1)?.frame !== 1216) {
  throw Error('GEO_L06_P002_AUDIO_LENGTH_DRIFT');
}
