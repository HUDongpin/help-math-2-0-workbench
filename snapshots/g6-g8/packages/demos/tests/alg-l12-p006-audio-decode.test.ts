import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {decodeP006Audio, P006_AUDIO_SOURCE} from '../src/alg-l12-p006-audio-decode';

const source = readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p006/audio-source-v1/sprite-53-source-stream.mp3',
  import.meta.url,
));
const encoded = Uint8Array.from(source).buffer;
const validMetadata = {
  numberOfChannels: 1,
  sampleRate: P006_AUDIO_SOURCE.sampleRate,
  length: P006_AUDIO_SOURCE.decodedSamples,
} as AudioBuffer;

test('P006 verifies the local source and decodes a private copy', async () => {
  assert.equal(source.byteLength, P006_AUDIO_SOURCE.bytes);
  assert.equal(createHash('sha256').update(source).digest('hex'), P006_AUDIO_SOURCE.sha256);
  let calls = 0;
  const context = {
    sampleRate: P006_AUDIO_SOURCE.sampleRate,
    async decodeAudioData(input: ArrayBuffer) {
      calls += 1;
      assert.notStrictEqual(input, encoded);
      assert.deepEqual(new Uint8Array(input), new Uint8Array(encoded));
      structuredClone(input, {transfer: [input]});
      assert.equal(input.byteLength, 0);
      return validMetadata;
    },
  } as unknown as BaseAudioContext;

  assert.strictEqual(await decodeP006Audio(context, encoded), validMetadata);
  assert.equal(calls, 1);
  assert.equal(encoded.byteLength, P006_AUDIO_SOURCE.bytes);
  assert.equal(Buffer.compare(Buffer.from(encoded), source), 0);
});

test('P006 rejects wrong context rate, byte count, and hash before decoding', async () => {
  let calls = 0;
  const context = {
    sampleRate: P006_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { calls += 1; return validMetadata; },
  } as unknown as BaseAudioContext;
  await assert.rejects(decodeP006Audio({...context, sampleRate: 44100}, encoded), /P006_AUDIO_CONTEXT_RATE/);
  await assert.rejects(decodeP006Audio(context, encoded.slice(1)), /P006_AUDIO_BYTES/);
  const corrupt = encoded.slice(0);
  new Uint8Array(corrupt)[0] ^= 1;
  await assert.rejects(decodeP006Audio(context, corrupt), /P006_AUDIO_HASH/);
  assert.equal(calls, 0);
});

test('P006 rejects wrong decoded rate, channel count, and sample length', async () => {
  const metadata = (overrides: Partial<Pick<AudioBuffer, 'numberOfChannels' | 'sampleRate' | 'length'>>) =>
    ({...validMetadata, ...overrides}) as AudioBuffer;
  let result: AudioBuffer | null = validMetadata;
  const context = {
    sampleRate: P006_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { return result; },
  } as unknown as BaseAudioContext;
  for (result of [
    metadata({numberOfChannels: 2}),
    metadata({sampleRate: 44100}),
    metadata({length: P006_AUDIO_SOURCE.decodedSamples - 1}),
    metadata({length: Number.NaN}),
    null,
  ]) {
    await assert.rejects(decodeP006Audio(context, encoded), /P006_AUDIO_DECODE/);
  }
});

test('P006 snapshots bytes before asynchronous hashing and decoder use', async () => {
  const callerInput = encoded.slice(0);
  let calls = 0;
  const context = {
    sampleRate: P006_AUDIO_SOURCE.sampleRate,
    async decodeAudioData(input: ArrayBuffer) {
      calls += 1;
      assert.notStrictEqual(input, callerInput);
      assert.equal(Buffer.compare(Buffer.from(input), source), 0);
      return validMetadata;
    },
  } as unknown as BaseAudioContext;

  const pending = decodeP006Audio(context, callerInput);
  new Uint8Array(callerInput).fill(0);
  assert.strictEqual(await pending, validMetadata);
  assert.equal(calls, 1);
  assert.equal(new Uint8Array(callerInput)[0], 0);
});

test('P006 propagates decoder rejection', async () => {
  const failure = Error('decoder failed');
  const context = {
    sampleRate: P006_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { throw failure; },
  } as unknown as BaseAudioContext;
  await assert.rejects(decodeP006Audio(context, encoded), error => error === failure);
});
