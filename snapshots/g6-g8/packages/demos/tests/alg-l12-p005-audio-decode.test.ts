import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {decodeP005Audio, P005_AUDIO_SOURCE} from '../src/alg-l12-p005-audio-decode';

const source = readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p005/audio-source-v1/sprite-391-source-stream.mp3',
  import.meta.url,
));
const encoded = Uint8Array.from(source).buffer;
const validMetadata = {
  numberOfChannels: 1,
  sampleRate: P005_AUDIO_SOURCE.sampleRate,
  length: P005_AUDIO_SOURCE.decodedSamples,
} as AudioBuffer;

test('P005 source identity and decode use the real pinned MP3 without detaching the caller buffer', async () => {
  assert.equal(source.byteLength, P005_AUDIO_SOURCE.bytes);
  assert.equal(createHash('sha256').update(source).digest('hex'), P005_AUDIO_SOURCE.sha256);
  let calls = 0;
  const context = {
    sampleRate: P005_AUDIO_SOURCE.sampleRate,
    async decodeAudioData(input: ArrayBuffer) {
      calls += 1;
      assert.notStrictEqual(input, encoded);
      assert.deepEqual(new Uint8Array(input), new Uint8Array(encoded));
      structuredClone(input, {transfer: [input]});
      assert.equal(input.byteLength, 0);
      return validMetadata;
    },
  } as unknown as BaseAudioContext;

  assert.strictEqual(await decodeP005Audio(context, encoded), validMetadata);
  assert.equal(calls, 1);
  assert.equal(encoded.byteLength, P005_AUDIO_SOURCE.bytes);
  assert.equal(Buffer.compare(Buffer.from(encoded), source), 0);
});

test('P005 rejects wrong context rate, byte count, and hash before decoding', async () => {
  let calls = 0;
  const context = {
    sampleRate: P005_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { calls += 1; return validMetadata; },
  } as unknown as BaseAudioContext;
  await assert.rejects(decodeP005Audio({...context, sampleRate: 48000}, encoded), /P005_AUDIO_CONTEXT_RATE/);
  await assert.rejects(decodeP005Audio(context, encoded.slice(1)), /P005_AUDIO_BYTES/);
  const corrupt = encoded.slice(0);
  new Uint8Array(corrupt)[0] ^= 1;
  await assert.rejects(decodeP005Audio(context, corrupt), /P005_AUDIO_HASH/);
  assert.equal(calls, 0);
});

test('P005 rejects malformed decoded metadata', async () => {
  let result: AudioBuffer | null = validMetadata;
  const metadata = (overrides: Partial<Pick<AudioBuffer, 'numberOfChannels' | 'sampleRate' | 'length'>>) =>
    ({...validMetadata, ...overrides}) as AudioBuffer;
  const context = {
    sampleRate: P005_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { return result; },
  } as unknown as BaseAudioContext;
  for (result of [
    metadata({numberOfChannels: 2}),
    metadata({sampleRate: 48000}),
    metadata({length: P005_AUDIO_SOURCE.decodedSamples - 1}),
    metadata({length: Number.NaN}),
    null,
  ]) {
    await assert.rejects(decodeP005Audio(context, encoded), /P005_AUDIO_DECODE/);
  }
});

test('P005 propagates decoder rejection', async () => {
  const failure = Error('decoder failed');
  const context = {
    sampleRate: P005_AUDIO_SOURCE.sampleRate,
    async decodeAudioData() { throw failure; },
  } as unknown as BaseAudioContext;
  await assert.rejects(decodeP005Audio(context, encoded), error => error === failure);
});
