import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P009_AUDIO_URL, P009EmbeddedAudioController} from '../src/alg-l12-p009-embedded-audio';
import {frameToP009TimelineSample, P009_AUDIO_SCHEDULE as schedule,
  P009_AUDIO_SOURCE as source} from '../src/alg-l12-p009-audio-schedule';

const ORIGIN = 'http://127.0.0.1:3109';
const URL_PIN = new URL(P009_AUDIO_URL, ORIGIN).href;
const encoded = new Uint8Array(readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p009/audit/source-stream.mp3', import.meta.url)));
const RATE = source.sampleRate;
const END = schedule.terminalTimelineSample;
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return {promise, resolve, reject};
}
async function flush() { await new Promise<void>(resolve => setImmediate(resolve)); }
function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
}
function response(bytes = encoded, overrides: {url?: string; status?: number; type?: string;
  redirected?: boolean; mime?: string; length?: string | null} = {}) {
  const headers = new Headers({'content-type': overrides.mime ?? 'audio/mpeg'});
  if (overrides.length !== null) headers.set('content-length', overrides.length ?? String(bytes.length));
  const result = new Response(bytes.slice(), {status: overrides.status ?? 200, headers});
  Object.defineProperties(result, {
    url: {value: overrides.url ?? URL_PIN}, type: {value: overrides.type ?? 'basic'},
    redirected: {value: overrides.redirected ?? false},
  });
  return result;
}
class FakeGain {
  gain = {value: -1};
  disconnects = 0;
  connect() {}
  disconnect() { this.disconnects++; }
}
class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number]> = [];
  stops = 0;
  disconnects = 0;
  failStart = false;
  connect(target: unknown) { assert(target instanceof FakeGain); }
  start(when: number, offset: number, duration: number) {
    if (this.failStart) throw Error('sensitive source error');
    this.starts.push([when, offset, duration]);
  }
  stop() { this.stops++; }
  disconnect() { this.disconnects++; }
}
const channel = new Float32Array(source.decodedSamples);
function decoded(overrides: Partial<Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'length'>> = {}) {
  return {sampleRate: RATE, numberOfChannels: 1, length: source.decodedSamples,
    getChannelData: () => channel, ...overrides} as unknown as AudioBuffer;
}
class FakeContext extends EventTarget {
  sampleRate: number = RATE;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain();
  sources: FakeSource[] = [];
  resumeCalls = 0;
  closeCalls = 0;
  decodeCalls = 0;
  failStart = false;
  resumeNext: (() => Promise<void>) | undefined;
  decodeNext: ((bytes: ArrayBuffer) => Promise<AudioBuffer>) | undefined;
  setState(state: AudioContextState) { this.state = state; this.dispatchEvent(new Event('statechange')); }
  createGain() { return this.gain; }
  createBufferSource() {
    const node = new FakeSource(); node.failStart = this.failStart; this.sources.push(node); return node;
  }
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.setState('running');
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    this.decodeCalls++;
    assert.deepEqual(new Uint8Array(bytes), encoded);
    return this.decodeNext ? this.decodeNext(bytes) : decoded();
  }
  async close() { this.closeCalls++; this.setState('closed'); }
}
function fixture(fetchOverride?: typeof fetch) {
  const context = new FakeContext();
  let creations = 0;
  const fetchCalls: Array<{url: string; options: RequestInit | undefined}> = [];
  const fakeFetch: typeof fetch = async (input, options) => {
    fetchCalls.push({url: String(input), options}); return response();
  };
  const controller = new P009EmbeddedAudioController({origin: ORIGIN,
    createContext: () => { creations++; return context as unknown as AudioContext; },
    fetch: fetchOverride ?? fakeFetch});
  return {controller, context, fetchCalls, creations: () => creations};
}

test('construction, snapshot, volume, seeking, reset and unused close are lazy', async () => {
  const {controller, context, fetchCalls, creations} = fixture();
  assert.deepEqual(controller.snapshot(), {phase: 'paused', timelineSample: 0, frame: 1, volume: 0, error: null});
  controller.setVolume(0.4); controller.seekFrame(100); controller.reset();
  assert.equal(creations(), 0); assert.equal(fetchCalls.length, 0);
  controller.seekFrame(394); assert.equal(await controller.play(), false);
  const closing = controller.close(); assert.strictEqual(controller.close(), closing); await closing;
  assert.equal(creations(), 0); assert.equal(context.closeCalls, 0);
  assert.equal(controller.snapshot().phase, 'closed');
});

test('explicit play synchronously requests resume, verifies source, and schedules one complete span at gain zero', async () => {
  const {controller, context, fetchCalls} = fixture();
  context.currentTime = 10;
  const playing = controller.play();
  assert.equal(context.resumeCalls, 1); assert.equal(controller.snapshot().phase, 'loading');
  assert.strictEqual(controller.play(), playing);
  assert.equal(await playing, true);
  assert.equal(context.decodeCalls, 1); assert.equal(context.gain.gain.value, 0);
  assert.equal(fetchCalls[0]?.url, URL_PIN);
  assert.deepEqual({...fetchCalls[0]!.options, signal: undefined}, {
    signal: undefined, mode: 'same-origin', credentials: 'same-origin', redirect: 'error', cache: 'no-store'});
  assert.deepEqual(context.sources[0]!.starts,
    [[10 + 1_837.5 / RATE, 1_673 / RATE, (721_728 - 1_673) / RATE]]);
  assert.equal(await controller.play(), true); assert.equal(context.sources.length, 1);
  controller.setVolume(0.6); assert.equal(context.gain.gain.value, 0.6);
  await controller.close();
});

test('one context clock crosses frame 3 without a gap, then reaches authored frame 394', async () => {
  const {controller, context} = fixture(); await controller.play();
  for (const [sample, frame] of [[0, 1], [1_837.5, 2], [3_675, 3], [5_512.5, 4],
    [721_892.5, 393], [END - 0.5, 393]] as const) {
    context.currentTime = sample / RATE;
    const snapshot = controller.snapshot(); near(snapshot.timelineSample, sample);
    assert.equal(snapshot.frame, frame); assert.equal(snapshot.phase, 'playing');
  }
  context.currentTime = (END + 1) / RATE;
  assert.deepEqual(controller.snapshot(), {phase: 'ended', timelineSample: END, frame: 394, volume: 0, error: null});
  assert.equal(context.sources[0]!.stops, 1); assert.equal(await controller.play(), false);
  await controller.close();
});

test('source completion retires audio but keeps the 245-sample visual postroll clock', async () => {
  const {controller, context} = fixture(); await controller.play();
  const ended = context.sources[0]!.onended!;
  context.currentTime = schedule.audioEndTimelineSample / RATE; ended();
  assert.equal(controller.snapshot().phase, 'playing');
  assert.equal(context.sources[0]!.disconnects, 1); assert.equal(context.sources[0]!.stops, 0);
  context.currentTime = (schedule.audioEndTimelineSample + 100) / RATE; controller.pause();
  const pausedSample = controller.snapshot().timelineSample;
  context.currentTime = 100; assert.equal(await controller.play(), true);
  assert.equal(context.sources.length, 1, 'postroll resume does not create another source');
  near(controller.snapshot().timelineSample, pausedSample); ended();
  assert.equal(context.sources[0]!.disconnects, 1);
  context.currentTime = 100 + (END - pausedSample + 1) / RATE;
  assert.equal(controller.snapshot().phase, 'ended'); await controller.close();
});

test('pause freezes position and seek/resume uses the continuous source offset; decoded data stays cached', async () => {
  const {controller, context, fetchCalls} = fixture(); await controller.play();
  context.currentTime = 1; controller.pause();
  near(controller.snapshot().timelineSample, RATE); context.currentTime = 50;
  near(controller.snapshot().timelineSample, RATE);
  controller.seekFrame(100); assert.equal(controller.snapshot().frame, 100);
  const sample = frameToP009TimelineSample(100); await controller.play();
  assert.deepEqual(context.sources[1]!.starts, [[50,
    (1_673 + sample - 1_837.5) / RATE, (721_728 - 1_673 - sample + 1_837.5) / RATE]]);
  assert.equal(fetchCalls.length, 1); assert.equal(context.decodeCalls, 1);
  await controller.close();
});

test('replay invalidates old callbacks, resets to frame 1 and creates only one new source', async () => {
  const {controller, context} = fixture(); await controller.play();
  const staleEnded = context.sources[0]!.onended!;
  context.currentTime = 4; assert.equal(await controller.replay(), true); staleEnded();
  assert.equal(controller.snapshot().frame, 1); assert.equal(controller.snapshot().phase, 'playing');
  assert.equal(context.sources.length, 2); assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1); await controller.close();
});

test('external suspension freezes immediately, delayed snapshots reconcile, and running cannot autoplay', async () => {
  const {controller, context} = fixture(); await controller.play();
  context.currentTime = 2; context.setState('suspended');
  const paused = controller.snapshot(); assert.equal(paused.phase, 'paused'); near(paused.timelineSample, RATE * 2);
  context.currentTime = 8; context.setState('running');
  assert.equal(controller.snapshot().phase, 'paused'); near(controller.snapshot().timelineSample, RATE * 2);
  await controller.play(); context.currentTime = 9; context.state = 'suspended';
  assert.equal(controller.snapshot().phase, 'paused'); near(controller.snapshot().timelineSample, RATE * 3);
  context.setState('running'); assert.equal(controller.snapshot().phase, 'paused'); await controller.close();
});

test('pause during pending resume prevents any fetch, decode or source even after resume resolves', async () => {
  const {controller, context, fetchCalls} = fixture(); const resume = deferred<void>();
  context.resumeNext = () => resume.promise;
  const playing = controller.play(); controller.pause(); resume.resolve();
  assert.equal(await playing, false); assert.equal(fetchCalls.length, 0);
  assert.equal(context.decodeCalls, 0); assert.equal(context.sources.length, 0);
  assert.equal(controller.snapshot().phase, 'paused'); await controller.close();
});

test('seek during fetch aborts request; an ignored late fetch completion cannot decode or start', async () => {
  const fetched = deferred<Response>(); const signals: AbortSignal[] = [];
  const {controller, context} = fixture(async (_input, options) => { signals.push(options?.signal as AbortSignal); return fetched.promise; });
  const playing = controller.play(); await flush(); controller.seekFrame(80);
  assert.equal(signals[0]?.aborted, true); fetched.resolve(response());
  assert.equal(await playing, false); assert.equal(context.decodeCalls, 0); assert.equal(context.sources.length, 0);
  assert.equal(controller.snapshot().frame, 80); await controller.close();
});

test('close during uncancellable decode invalidates the result and leaves no live node or listener', async () => {
  const {controller, context} = fixture(); const decoding = deferred<AudioBuffer>();
  context.decodeNext = () => decoding.promise;
  const playing = controller.play();
  while (!context.decodeCalls) await flush();
  assert.equal(getEventListeners(context, 'statechange').length, 1);
  const closing = controller.close(); assert.strictEqual(controller.close(), closing); await closing;
  decoding.resolve(decoded()); assert.equal(await playing, false);
  assert.equal(context.sources.length, 0); assert.equal(context.gain.disconnects, 1);
  assert.equal(context.closeCalls, 1); assert.equal(getEventListeners(context, 'statechange').length, 0);
  assert.equal(controller.snapshot().phase, 'closed'); assert.equal(await controller.replay(), false);
});

test('a stale decode rejection cannot poison a new explicit play after reset', async () => {
  const {controller, context} = fixture(); const decoding = deferred<AudioBuffer>();
  context.decodeNext = () => { context.decodeNext = undefined; return decoding.promise; };
  const oldPlay = controller.play(); while (!context.decodeCalls) await flush();
  controller.reset(); assert.equal(await controller.play(), true);
  decoding.reject(Error('sensitive decode detail')); assert.equal(await oldPlay, false);
  assert.equal(controller.snapshot().phase, 'playing'); assert.equal(controller.snapshot().error, null);
  assert.equal(context.sources.length, 1); await controller.close();
});

test('context interruption during decoding cancels loading and never restarts from late decode', async () => {
  const {controller, context} = fixture(); const decoding = deferred<AudioBuffer>();
  context.decodeNext = () => decoding.promise;
  const playing = controller.play(); while (!context.decodeCalls) await flush();
  context.setState('suspended'); assert.equal(controller.snapshot().phase, 'paused');
  context.setState('running'); decoding.resolve(decoded()); assert.equal(await playing, false);
  assert.equal(context.sources.length, 0); assert.equal(controller.snapshot().phase, 'paused'); await controller.close();
});

test('untrusted origins, responses, lengths and byte drift fail closed before decode', async () => {
  for (const origin of ['file:///', 'https://user:secret@example.test', ORIGIN + '/', ORIGIN + '/lesson'])
    assert.throws(() => new P009EmbeddedAudioController({origin}), /P009_AUDIO_ORIGIN/);
  const drift = encoded.slice(); drift[1] ^= 1;
  const cases: Array<[() => Response, string]> = [
    [() => response(encoded, {url: 'https://other.test/source.mp3'}), 'P009_AUDIO_RESPONSE'],
    [() => response(encoded, {redirected: true}), 'P009_AUDIO_RESPONSE'],
    [() => response(encoded, {type: 'opaque'}), 'P009_AUDIO_RESPONSE'],
    [() => response(encoded, {status: 404}), 'P009_AUDIO_RESPONSE'],
    [() => response(encoded, {mime: 'text/html'}), 'P009_AUDIO_RESPONSE'],
    [() => response(encoded, {length: '1'}), 'P009_AUDIO_BYTES'],
    [() => response(encoded.slice(0, -1), {length: null}), 'P009_AUDIO_BYTES'],
    [() => response(new Uint8Array(source.bytes + 1), {length: null}), 'P009_AUDIO_BYTES'],
    [() => response(drift), 'P009_AUDIO_HASH'],
  ];
  for (const [reply, code] of cases) {
    const {controller, context} = fixture(async () => reply());
    assert.equal(await controller.play(), false); assert.equal(controller.snapshot().error, code);
    assert.equal(context.decodeCalls, 0); assert.equal(context.sources.length, 0); await controller.close();
  }
});

test('decode metadata and nonfinite PCM fail closed before source creation', async () => {
  for (const buffer of [decoded({sampleRate: 44_100}), decoded({length: source.decodedSamples - 1}),
    decoded({numberOfChannels: 2}), {...decoded(), getChannelData: () => new Float32Array([NaN])} as AudioBuffer]) {
    const {controller, context} = fixture(); context.decodeNext = async () => buffer;
    assert.equal(await controller.play(), false); assert.equal(controller.snapshot().error, 'P009_AUDIO_DECODE');
    assert.equal(context.sources.length, 0); await controller.close();
  }
});

test('source-start failure disconnects partial node and an explicit retry succeeds without reloading', async () => {
  const {controller, context, fetchCalls} = fixture(); context.failStart = true;
  assert.equal(await controller.play(), false); assert.equal(controller.snapshot().error, 'P009_AUDIO_LOAD');
  assert.equal(context.sources[0]!.disconnects, 1); assert.equal(context.sources[0]!.onended, null);
  context.failStart = false; assert.equal(await controller.play(), true);
  assert.equal(fetchCalls.length, 1); assert.equal(context.decodeCalls, 1); await controller.close();
  assert.equal(context.sources[1]!.disconnects, 1);
});

test('synchronous context failure is retryable; unavailable resume exposes only a fixed local error', async () => {
  const context = new FakeContext(); let attempt = 0;
  const controller = new P009EmbeddedAudioController({origin: ORIGIN, fetch: async () => response(),
    createContext: () => { if (!attempt++) throw Error('private constructor detail'); return context as unknown as AudioContext; }});
  assert.equal(await controller.play(), false); assert.equal(controller.snapshot().error, 'P009_AUDIO_LOAD');
  assert.equal(await controller.play(), true); await controller.close();
  const blocked = fixture(); blocked.context.resumeNext = async () => { throw Error('private resume detail'); };
  assert.equal(await blocked.controller.play(), false); assert.equal(blocked.controller.snapshot().error, 'P009_AUDIO_LOAD');
  assert.equal(blocked.fetchCalls.length, 0); await blocked.controller.close();
});

test('wrong-rate context is closed and does not fetch; invalid volume/frame and closed mutation are rejected', async () => {
  const {controller, context, fetchCalls} = fixture(); context.sampleRate = 48_000;
  assert.equal(await controller.play(), false); assert.equal(controller.snapshot().error, 'P009_AUDIO_CONTEXT_RATE');
  assert.equal(context.closeCalls, 1); assert.equal(fetchCalls.length, 0);
  for (const value of [-1, 2, NaN, Infinity]) assert.throws(() => controller.setVolume(value), /P009_AUDIO_VOLUME/);
  for (const value of [0, 395, 3.5, NaN]) assert.throws(() => controller.seekFrame(value), /P009_AUDIO_FRAME/);
  await controller.close();
  assert.throws(() => controller.setVolume(0), /P009_AUDIO_CLOSED/);
  assert.throws(() => controller.seekFrame(1), /P009_AUDIO_CLOSED/);
});

test('close releases the context even when gain disconnection throws, and remains idempotent', async () => {
  const {controller, context} = fixture(); await controller.play();
  context.gain.disconnect = () => { throw Error('already disconnected'); };
  const closing = controller.close(); assert.strictEqual(controller.close(), closing); await closing;
  assert.equal(context.closeCalls, 1); assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1); assert.equal(context.sources[0]!.onended, null);
  assert.equal(getEventListeners(context, 'statechange').length, 0);
  assert.equal(controller.snapshot().phase, 'closed');
});
