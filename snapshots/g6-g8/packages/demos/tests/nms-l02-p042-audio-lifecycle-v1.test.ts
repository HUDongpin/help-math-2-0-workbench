import test from 'node:test';
import assert from 'node:assert/strict';
import { P042SourceAudio } from '../src/nms-l02-p042-audio-v1';

test('pause cancels pending load; a stale read cannot publish audio after Replay', async () => {
  let resolve!: (value: ArrayBuffer) => void;
  let readSignal: AbortSignal | undefined;
  let decodes = 0, closed = 0;
  const context = { currentTime: 0, sampleRate: 22050, destination: {},
    createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }),
    resume: async () => {}, close: async () => { closed++; },
    decodeAudioData: async () => { decodes++; throw Error('stale decode'); },
  } as unknown as AudioContext;
  const audio = new P042SourceAudio({ changed() {}, createContext: () => context, read: signal => { readSignal = signal; return new Promise(r => { resolve = r; }); } });
  const pending = audio.play();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(audio.snapshot().phase, 'loading');
  audio.pause(); assert.equal(readSignal?.aborted, true);
  audio.replay(); resolve(new ArrayBuffer(0)); await pending;
  assert.equal(decodes, 0); assert.equal(audio.snapshot().phase, 'paused');
  assert.equal(audio.snapshot().state.frame, 1);
  await audio.close(); await audio.close(); assert.equal(closed, 1);
});

test('a real read failure is visible and closing prevents subsequent reads', async () => {
  let reads = 0;
  const context = { currentTime: 0, destination: {}, createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }), resume: async () => {}, close: async () => {} } as unknown as AudioContext;
  const audio = new P042SourceAudio({ changed() {}, createContext: () => context, read: async () => { reads++; throw Error('source unavailable'); } });
  await audio.play(); assert.equal(audio.snapshot().phase, 'failed'); assert.equal(audio.snapshot().failure, 'source unavailable');
  await audio.close(); await audio.play(); assert.equal(reads, 1);
});

 test('close normalizes the playback flag even when the transport was playing', async () => {
  const context = {currentTime: 10, close: async () => {}} as unknown as AudioContext;
  const audio = new P042SourceAudio({changed() {}, read: async () => new ArrayBuffer(0)});
  // Isolate close-state bookkeeping without replacing decode/playback coverage.
  Object.assign(audio, {context, phase: 'playing', clock: {elapsed: 1, anchor: 9, state: {frame: 13, playing: true, completed: false, replay: 0}}});
  await audio.close();
  assert.equal(audio.snapshot().state.playing, false);
  assert.equal(audio.snapshot().phase, 'closed');
 });
