import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  P008OptionalSpanishAudio, P008_OPTIONAL_SPANISH_AUDIO_BINDING,
  P008_OPTIONAL_SPANISH_AUDIO_URL,
} from '../src/alg-l06-p008-optional-spanish-audio-v1';

const root = new URL('../../../', import.meta.url);
const source = readFileSync(fileURLToPath(new URL(
  'migrations/shared-alg001-l06-p008/audit/audio-v1/separate-sa-source-v1.mp3', root)));
const receipt = JSON.parse(readFileSync(fileURLToPath(new URL(
  'output/playwright/alg-l06-p008-source-v1/browser-decode-v1.json', root)), 'utf8'));
const disposition = JSON.parse(readFileSync(fileURLToPath(new URL(
  'migrations/shared-alg001-l06-p008/audit/sa-host-v1/sa-host-disposition-v1.json', root)), 'utf8'));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return {promise, resolve};
}

test('binding matches the actual separate source, decode receipt, and static host role', () => {
  const binding = P008_OPTIONAL_SPANISH_AUDIO_BINDING;
  const decoded = receipt.files.find((entry: {file: string}) => entry.file === 'separate-sa-source-v1.mp3');
  assert.ok(decoded);
  assert.equal(source.byteLength, binding.sourceBytes);
  assert.equal(createHash('sha256').update(source).digest('hex'), binding.sourceSha256);
  assert.equal(decoded.sha256, binding.sourceSha256);
  assert.equal(decoded.bytes, binding.sourceBytes);
  assert.equal(decoded.decodes.length, 2);
  for (const decode of decoded.decodes) {
    assert.equal(decode.rate, binding.sampleRate);
    assert.equal(decode.channels, binding.channels);
    assert.equal(decode.length, binding.decodedSamples);
    assert.equal(decode.pcmSha256, binding.pcmSha256);
  }
  assert.equal(disposition.inputs.separateSa.sha256, binding.sourceSha256);
  assert.equal(disposition.applicability.sourceRole, 'separate optional Spanish page-audio operation');
  assert.equal(disposition.applicability.actualSpokenLanguage, 'unverified');
  assert.match(P008_OPTIONAL_SPANISH_AUDIO_URL, /shared-alg001-l06-p008\/optional-spanish-audio-v1/);
  assert.match(P008_OPTIONAL_SPANISH_AUDIO_URL, new RegExp(binding.sourceSha256));
});

test('no loader runs until explicit user Start; wrong activation is denied', async () => {
  let loads = 0;
  const controller = new P008OptionalSpanishAudio({onChange: () => {}, onEnded: () => {},
    load: async () => {loads++; return new ArrayBuffer(0);}});
  assert.equal(controller.snapshot().phase, 'idle');
  assert.equal(controller.snapshot().lessonCompleted, false);
  const denied = await controller.start({activation: 'automatic'} as unknown as {activation: 'user'});
  assert.equal(denied.accepted, false);
  assert.equal(denied.reason, 'explicit-user-start-required');
  assert.equal(loads, 0);
  assert.equal(controller.snapshot().phase, 'idle');
  await controller.close();
});

test('Stop aborts a pending load and a stale result cannot start sound', async () => {
  const load = deferred<ArrayBuffer>();
  let signal: AbortSignal | undefined;
  let ended = 0;
  const states: string[] = [];
  const controller = new P008OptionalSpanishAudio({
    onChange: snapshot => states.push(snapshot.phase), onEnded: () => {ended++;},
    load: pendingSignal => {signal = pendingSignal; return load.promise;},
  });
  const start = controller.start({activation: 'user'});
  await Promise.resolve();
  assert.equal(controller.snapshot().phase, 'loading');
  assert.ok(signal);
  await controller.stopAndWait();
  assert.equal(signal.aborted, true);
  load.resolve(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength));
  assert.equal((await start).accepted, false);
  assert.equal(controller.snapshot().phase, 'idle');
  assert.equal(ended, 0);
  assert.deepEqual(states, ['loading', 'idle']);
  await controller.close();
});

test('Close invalidates a pending load and never reports completion', async () => {
  const load = deferred<ArrayBuffer>();
  let signal: AbortSignal | undefined;
  const controller = new P008OptionalSpanishAudio({onChange: () => {}, onEnded: () => {
    assert.fail('stale load ended');
  }, load: pendingSignal => {signal = pendingSignal; return load.promise;}});
  const start = controller.start({activation: 'user'});
  await Promise.resolve();
  await controller.close();
  assert.equal(signal?.aborted, true);
  load.resolve(new ArrayBuffer(0));
  assert.equal((await start).accepted, false);
  assert.equal(controller.snapshot().phase, 'closed');
  assert.equal(controller.stop().accepted, false);
});

test('stopAndWait holds return until an admitted decode context has closed', async () => {
  const closing = deferred<void>();
  let closes = 0;
  const context = {
    state: 'suspended', sampleRate: 48000, currentTime: 0, destination: {},
    addEventListener: () => {}, removeEventListener: () => {},
    createGain: () => ({gain: {setValueAtTime: () => {}}, connect: () => {}, disconnect: () => {}}),
    decodeAudioData: async () => ({sampleRate: 48000, numberOfChannels: 1, length: 463104,
      getChannelData: () => new Float32Array(463104)}),
    close: () => {closes++; return closing.promise;},
  } as unknown as AudioContext;
  const controller = new P008OptionalSpanishAudio({onChange: () => {}, onEnded: () => {},
    load: async () => source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    createContext: () => context});
  const started = await controller.start({activation: 'user'});
  assert.equal(started.accepted, false);
  assert.equal(started.reason, 'decoded-buffer-identity-mismatch');
  assert.equal(controller.snapshot().phase, 'error');
  let retired = false;
  const waiting = controller.stopAndWait().then(() => {retired = true;});
  await Promise.resolve();
  assert.equal(retired, false);
  assert.equal(closes, 1);
  closing.resolve();
  await waiting;
  assert.equal(retired, true);
  assert.equal(controller.snapshot().phase, 'idle');
  await controller.close();
});
