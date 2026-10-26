import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getEventListeners} from 'node:events';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {decodeP010SpanishAudio, P010_SPANISH_AUDIO_SOURCE as SOURCE, P010_SPANISH_AUDIO_URL,
  P010SpanishAudioController, type P010SpanishAudioSnapshot} from '../src/alg-l12-p010-spanish-audio';

const physicalSource = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/SA/L12VB05.mp3';
const sourceBytes = readFileSync(physicalSource);
const encoded = () => Uint8Array.from(sourceBytes).buffer;
const channel = new Float32Array(SOURCE.decodedSamples);
const buffer = (overrides: Partial<Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'length'>> = {}) =>
  ({sampleRate: SOURCE.sampleRate, numberOfChannels: 1, length: SOURCE.decodedSamples,
    getChannelData: () => channel, ...overrides}) as unknown as AudioBuffer;
const ORIGIN = 'http://127.0.0.1:3109';
const URL_PIN = new URL(P010_SPANISH_AUDIO_URL, ORIGIN).href;

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {resolve = done; reject = fail;});
  return {promise, resolve, reject};
}

class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = true;
  onended: (() => void) | null = null;
  starts: Array<[number, number]> = [];
  stops = 0;
  disconnects = 0;
  failStart = false;
  connect(target: unknown) {assert(target instanceof FakeGain);}
  start(when: number, offset: number) {
    if (this.failStart) throw Error('start failed');
    this.starts.push([when, offset]);
  }
  stop() {this.stops++;}
  disconnect() {this.disconnects++;}
}

class FakeGain {
  gain = {value: -1};
  disconnects = 0;
  connect(target: unknown) {assert(target);}
  disconnect() {this.disconnects++;}
}

class FakeContext extends EventTarget {
  sampleRate: number = SOURCE.sampleRate;
  state: AudioContextState = 'suspended';
  currentTime = 5;
  destination = {};
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  resumeCalls = 0;
  decodeCalls = 0;
  closeCalls = 0;
  failStart = false;
  resumeNext: (() => Promise<void>) | undefined;
  decodeNext: ((bytes: ArrayBuffer) => Promise<AudioBuffer>) | undefined;
  setState(state: AudioContextState) {this.state = state; this.dispatchEvent(new Event('statechange'));}
  createGain() {const gain = new FakeGain(); this.gains.push(gain); return gain;}
  createBufferSource() {
    const source = new FakeSource(); source.failStart = this.failStart;
    this.sources.push(source); return source;
  }
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.setState('running');
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    this.decodeCalls++; assert.deepEqual(new Uint8Array(bytes), new Uint8Array(sourceBytes));
    return this.decodeNext?.(bytes) ?? buffer();
  }
  async close() {this.closeCalls++; this.setState('closed');}
}

function fixture(load: (signal: AbortSignal) => Promise<ArrayBuffer> = async () => encoded()) {
  const context = new FakeContext();
  const changes: P010SpanishAudioSnapshot[] = [];
  let contexts = 0, loads = 0, ended = 0;
  const controller = new P010SpanishAudioController({
    createContext: () => {contexts++; return context as unknown as AudioContext;},
    load: signal => {loads++; return load(signal);},
    onChange: state => changes.push(state), onEnded: () => ended++,
  });
  return {context, controller, changes, counts: () => ({contexts, loads, ended})};
}

async function waitFor(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await new Promise<void>(resolve => setImmediate(resolve));
  }
  assert.fail('expected asynchronous stage was not reached');
}

function response(bytes = new Uint8Array(sourceBytes), overrides: {url?: string; mime?: string;
  length?: string | null; redirected?: boolean; type?: string; status?: number} = {}) {
  const headers = new Headers({'content-type': overrides.mime ?? 'audio/mpeg'});
  if (overrides.length !== null) headers.set('content-length', overrides.length ?? String(SOURCE.bytes));
  const result = new Response(bytes.slice(), {status: overrides.status ?? 200, headers});
  Object.defineProperties(result, {url: {value: overrides.url ?? URL_PIN},
    redirected: {value: overrides.redirected ?? false}, type: {value: overrides.type ?? 'basic'}});
  return result;
}

test('P010 declarations match physical SA bytes and the frozen independent native observation', () => {
  assert.equal(sourceBytes.length, SOURCE.bytes);
  assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), SOURCE.sha256);
  const receiptBytes=readFileSync(new URL('../../../output/p010-browser-native-decode-20260927-v1/browser-native-result.json',import.meta.url));
  assert.equal(createHash('sha256').update(receiptBytes).digest('hex'),'f051dc2ba559b8ffb66b99025c2aa222bf32905848d1ac3a0db2ca87f9520ce8');
  const observation=JSON.parse(receiptBytes.toString()).audit.decodes.find((row:{name:string})=>row.name==='sidecar');
  assert.equal(observation.bufferSampleRate,SOURCE.sampleRate);
  assert.equal(observation.numberOfChannels,SOURCE.numberOfChannels);
  assert.equal(observation.length,SOURCE.decodedSamples);
  assert.equal(observation.duration,SOURCE.decodedDurationSeconds);
  assert.equal(SOURCE.decodedSamples,641*1_152);
  assert.equal(SOURCE.url, '/flash-assets/g678-local/shared-alg001-l12-p010/spanish-audio.mp3');
});

test('construction and volume changes are lazy; explicit start requests resume before loading', async () => {
  let state!: ReturnType<typeof fixture>;
  state = fixture(async () => {assert.equal(state.context.resumeCalls, 1); return encoded();});
  const {controller, context, counts} = state;
  assert.deepEqual(controller.snapshot(), {phase: 'idle', volume: 1});
  controller.setVolume(0.4); assert.deepEqual(counts(), {contexts: 0, loads: 0, ended: 0});
  const pending = controller.start(); assert.equal(context.resumeCalls, 1);
  assert.deepEqual(controller.snapshot(), {phase: 'loading', volume: 0.4});
  assert.equal(await pending, true); assert.equal(context.gains[0]!.gain.value, 0.4);
  assert.deepEqual(context.sources[0]!.starts, [[5, 0]]); assert.equal(context.sources[0]!.loop, false);
  assert.equal(await controller.start(), true); assert.equal(context.sources.length, 1);
  await controller.close();
});

test('pause stops SA without natural-end callback; next explicit start restarts at zero with verified cached buffer', async () => {
  const {controller, context, counts} = fixture(); await controller.start();
  const staleEnd = context.sources[0]!.onended!;
  context.currentTime = 10; controller.pause(); staleEnd();
  assert.equal(controller.snapshot().phase, 'paused'); assert.equal(counts().ended, 0);
  assert.equal(context.sources[0]!.stops, 1); assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(await controller.start(), true); assert.deepEqual(context.sources[1]!.starts, [[10, 0]]);
  assert.equal(context.decodeCalls, 1); assert.equal(counts().loads, 1); await controller.close();
});

test('natural completion disconnects once; stop and completion unload the buffer for another explicit operation', async () => {
  const {controller, context, counts} = fixture(); await controller.start();
  const ended = context.sources[0]!.onended!; ended(); ended();
  assert.equal(controller.snapshot().phase, 'ended'); assert.equal(counts().ended, 1);
  assert.equal(context.sources[0]!.disconnects, 1); assert.equal(context.sources[0]!.stops, 0);
  controller.pause(); assert.equal(controller.snapshot().phase, 'ended');
  await controller.start(); const stale = context.sources[1]!.onended!;
  controller.stop(); stale(); assert.equal(controller.snapshot().phase, 'idle'); assert.equal(counts().ended, 1);
  await controller.start(); assert.equal(counts().loads, 3); assert.equal(context.decodeCalls, 3);
  await controller.close();
});

test('pause, stop and close invalidate a late loader ignoring abort without decoding or creating a source', async () => {
  for (const action of ['pause', 'stop', 'close'] as const) {
    const loading = deferred<ArrayBuffer>(); const signals: AbortSignal[] = [];
    const {controller, context, counts} = fixture(signal => {signals.push(signal); return loading.promise;});
    const pending = controller.start(); assert.equal(signals[0]!.aborted, false);
    if (action === 'close') await controller.close(); else controller[action]();
    assert.equal(signals[0]!.aborted, true); loading.resolve(encoded());
    assert.equal(await pending, false); assert.equal(context.decodeCalls, 0); assert.equal(context.sources.length, 0);
    assert.equal(counts().ended, 0);
    assert.equal(controller.snapshot().phase, action === 'pause' ? 'paused' : action === 'stop' ? 'idle' : 'closed');
    await controller.close();
  }
});

test('a stale decode success or rejection cannot overwrite a newer successful start', async () => {
  for (const reject of [false, true]) {
    const decoding = deferred<AudioBuffer>(); const {controller, context} = fixture();
    context.decodeNext = async () => context.decodeCalls === 1 ? decoding.promise : buffer();
    const old = controller.start(); await waitFor(() => context.decodeCalls === 1);
    assert.equal(await controller.start(), true);
    if (reject) decoding.reject(Error('stale decoder')); else decoding.resolve(buffer());
    assert.equal(await old, false); assert.equal(context.sources.length, 1);
    assert.equal(controller.snapshot().phase, 'playing'); await controller.close();
  }
});

test('close during uncancellable decode leaves no source or state listener after late resolution', async () => {
  const decoding = deferred<AudioBuffer>(); const {controller, context, counts} = fixture();
  context.decodeNext = () => decoding.promise;
  const starting = controller.start(); await waitFor(() => context.decodeCalls === 1);
  await controller.close(); decoding.resolve(buffer()); assert.equal(await starting, false);
  assert.equal(controller.snapshot().phase, 'closed'); assert.equal(context.sources.length, 0);
  assert.equal(getEventListeners(context, 'statechange').length, 0); assert.equal(counts().ended, 0);
});

test('late resume success and rejection cannot affect a newer operation after stop', async () => {
  for (const reject of [false, true]) {
    const resuming = deferred<void>(); const {controller, context, counts} = fixture();
    context.resumeNext = () => resuming.promise;
    const old = controller.start(); controller.stop(); context.resumeNext = undefined;
    assert.equal(await controller.start(), true);
    if (reject) resuming.reject(Error('stale resume')); else resuming.resolve();
    assert.equal(await old, false); assert.equal(controller.snapshot().phase, 'playing');
    assert.equal(context.sources.length, 1); assert.equal(counts().ended, 0); await controller.close();
  }
});

test('external suspension during playing or loading cancels without running-event autoplay', async () => {
  const active = fixture(); await active.controller.start();
  active.context.setState('suspended'); assert.equal(active.controller.snapshot().phase, 'paused');
  assert.equal(active.context.sources[0]!.stops, 1); active.context.setState('running');
  assert.equal(active.controller.snapshot().phase, 'paused'); assert.equal(active.context.sources.length, 1);
  await active.controller.close();
  const loading = deferred<ArrayBuffer>(); const signals: AbortSignal[] = [];
  const other = fixture(signal => {signals.push(signal); return loading.promise;});
  const pending = other.controller.start(); await new Promise<void>(resolve => setImmediate(resolve));
  other.context.setState('suspended'); assert.equal(other.controller.snapshot().phase, 'paused');
  assert.equal(signals[0]!.aborted, true); other.context.setState('running'); loading.resolve(encoded());
  assert.equal(await pending, false); assert.equal(other.context.sources.length, 0); await other.controller.close();
});

test('snapshot reconciles delayed interruption; a stale ended event after interruption cannot return the main clock', async () => {
  const {controller, context, counts} = fixture(); await controller.start();
  const ended = context.sources[0]!.onended!; context.state = 'suspended'; ended();
  assert.equal(controller.snapshot().phase, 'paused'); assert.equal(counts().ended, 0);
  assert.equal(context.sources[0]!.disconnects, 1); context.setState('running');
  assert.equal(controller.snapshot().phase, 'paused'); assert.equal(await controller.start(), true);
  assert.deepEqual(context.sources[1]!.starts, [[5, 0]]); await controller.close();
});

test('the default loader scopes URL, response and body, then verifies bytes before decode', async () => {
  const context = new FakeContext(); const calls: Array<{url: string; init: RequestInit | undefined}> = [];
  const controller = new P010SpanishAudioController({origin: ORIGIN,
    createContext: () => context as unknown as AudioContext,
    fetch: async (input, init) => {calls.push({url: String(input), init}); return response();}});
  assert.equal(calls.length, 0); assert.equal(await controller.start(), true);
  assert.equal(calls[0]!.url, URL_PIN);
  assert.deepEqual({...calls[0]!.init, signal: undefined}, {signal: undefined, mode: 'same-origin',
    credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  assert.equal(context.decodeCalls, 1); await controller.close();
});

test('response scope, metadata, short/oversized bodies and hash drift cannot create any source', async () => {
  const drift = new Uint8Array(sourceBytes); drift[0] ^= 1;
  const replies = [
    () => response(undefined, {url: URL_PIN.replace('p010', 'p006')}),
    () => response(undefined, {url: 'https://other.test/audio.mp3'}),
    () => response(undefined, {redirected: true}),
    () => response(undefined, {type: 'opaque'}),
    () => response(undefined, {mime: 'text/html'}),
    () => response(undefined, {status: 404}),
    () => response(undefined, {length: null}),
    () => response(new Uint8Array(SOURCE.bytes - 1)),
    () => response(new Uint8Array(SOURCE.bytes + 1)),
    () => response(drift),
  ];
  for (const reply of replies) {
    const context = new FakeContext();
    const controller = new P010SpanishAudioController({origin: ORIGIN,
      createContext: () => context as unknown as AudioContext, fetch: async () => reply()});
    assert.equal(await controller.start(), false); assert.equal(controller.snapshot().phase, 'error');
    assert.equal(context.decodeCalls, 0); assert.equal(context.sources.length, 0); await controller.close();
  }
});

test('default network loading is aborted on pause; ignored late response cannot decode', async () => {
  const fetched = deferred<Response>(); const signals: AbortSignal[] = []; const context = new FakeContext();
  const controller = new P010SpanishAudioController({origin: ORIGIN,
    createContext: () => context as unknown as AudioContext,
    fetch: async (_input, init) => {signals.push(init!.signal as AbortSignal); return fetched.promise;}});
  const pending = controller.start(); controller.pause(); assert.equal(signals[0]!.aborted, true);
  fetched.resolve(response()); assert.equal(await pending, false); assert.equal(context.decodeCalls, 0);
  assert.equal(controller.snapshot().phase, 'paused'); await controller.close();
});

test('hash verification snapshots caller input; native decoder rejects metadata and nonfinite PCM', async () => {
  const context = new FakeContext(); const original = encoded();
  const decoding = decodeP010SpanishAudio(context as unknown as BaseAudioContext, original);
  new Uint8Array(original)[0] ^= 1; assert.equal((await decoding).length, SOURCE.decodedSamples);
  for (const wrong of [buffer({sampleRate: 22_050}), buffer({numberOfChannels: 2}),
    buffer({length: SOURCE.decodedSamples - 1}), {...buffer(), getChannelData: () => new Float32Array([NaN])} as AudioBuffer]) {
    context.decodeNext = async () => wrong;
    await assert.rejects(() => decodeP010SpanishAudio(context as unknown as BaseAudioContext, encoded()), /P010_SA_DECODE/);
  }
  context.sampleRate = 22_050;
  await assert.rejects(() => decodeP010SpanishAudio(context as unknown as BaseAudioContext, encoded()), /P010_SA_CONTEXT_RATE/);
});

test('synchronous construction/resume and async resume failures are retryable and never emit natural end', async () => {
  let attempts = 0; const context = new FakeContext();
  const controller = new P010SpanishAudioController({load: async () => encoded(),
    createContext: () => {if (!attempts++) throw Error('constructor failed'); return context as unknown as AudioContext;}});
  assert.equal(await controller.start(), false); assert.equal(controller.snapshot().phase, 'error');
  assert.equal(await controller.start(), true); await controller.close();
  for (const synchronous of [false, true]) {
    const other = fixture(); const realResume = other.context.resume.bind(other.context);
    other.context.resume = synchronous ? () => {throw Error('sync resume failure');}
      : async () => {throw Error('async resume failure');};
    assert.equal(await other.controller.start(), false); assert.equal(other.controller.snapshot().phase, 'error');
    other.context.resume = realResume; assert.equal(await other.controller.start(), true);
    assert.equal(other.counts().ended, 0); await other.controller.close();
  }
});

test('source start failure disconnects its partial node and later start succeeds', async () => {
  const {controller, context, counts} = fixture(); context.failStart = true;
  assert.equal(await controller.start(), false); assert.equal(controller.snapshot().phase, 'error');
  assert.equal(context.sources[0]!.disconnects, 1); assert.equal(context.sources[0]!.onended, null);
  assert.equal(counts().ended, 0); context.failStart = false; assert.equal(await controller.start(), true);
  await controller.close(); assert.equal(context.sources[1]!.disconnects, 1);
});

test('close disposes sources, listener and context once, including a gain-disconnect exception', async () => {
  for (const failDisconnect of [false, true]) {
    const {controller, context, counts} = fixture(); await controller.start();
    const stale = context.sources[0]!.onended!;
    if (failDisconnect) context.gains[0]!.disconnect = () => {throw Error('already disconnected');};
    const closing = controller.close(); assert.strictEqual(controller.close(), closing); await closing; stale();
    assert.equal(context.sources[0]!.stops, 1); assert.equal(context.sources[0]!.disconnects, 1);
    assert.equal(context.closeCalls, 1); assert.equal(getEventListeners(context, 'statechange').length, 0);
    assert.equal(controller.snapshot().phase, 'closed'); assert.equal(counts().ended, 0);
    assert.equal(await controller.start(), false); controller.pause(); controller.stop();
    assert.equal(controller.snapshot().phase, 'closed');
  }
});

test('wrong context and invalid origin, volume and closed mutation fail closed; unused close is lazy', async () => {
  for (const origin of ['file:///', ORIGIN + '/', ORIGIN + '/lesson', 'https://user:secret@example.test'])
    assert.throws(() => new P010SpanishAudioController({origin}), /P010_SA_ORIGIN/);
  const {controller, context, counts} = fixture(); context.sampleRate = 22_050;
  assert.equal(await controller.start(), false); assert.equal(controller.snapshot().phase, 'error');
  assert.equal(counts().loads, 0); assert.equal(context.closeCalls, 1);
  for (const value of [-1, 2, NaN, Infinity]) assert.throws(() => controller.setVolume(value), /P010_SA_VOLUME/);
  await controller.close(); assert.throws(() => controller.setVolume(0), /P010_SA_CLOSED/);
  const unused = fixture(); await unused.controller.close(); assert.equal(unused.counts().contexts, 0);
});
