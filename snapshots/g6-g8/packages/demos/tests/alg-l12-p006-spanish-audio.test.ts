import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getEventListeners} from 'node:events';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {decodeP006SpanishAudio, P006_SPANISH_AUDIO_SOURCE as SOURCE,
  P006SpanishAudioController, type P006SpanishAudioSnapshot} from '../src/alg-l12-p006-spanish-audio';

const sourceBytes = readFileSync('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/SA/L12RW06.mp3');
const encoded = () => Uint8Array.from(sourceBytes).buffer;
const buffer = (overrides: Partial<Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'length'>> = {}) =>
  ({sampleRate: 48000, numberOfChannels: 1, length: 736128, ...overrides}) as AudioBuffer;

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
  sampleRate = 48000;
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
  async decodeAudioData(bytes: ArrayBuffer) {this.decodeCalls++; return this.decodeNext?.(bytes) ?? buffer();}
  async close() {this.closeCalls++; this.setState('closed');}
}

function fixture(load: (signal: AbortSignal) => Promise<ArrayBuffer> = async () => encoded()) {
  const context = new FakeContext();
  const changes: P006SpanishAudioSnapshot[] = [];
  let contexts = 0, loads = 0, ended = 0;
  const controller = new P006SpanishAudioController({
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

test('construction and volume changes perform no fetch, context creation or autoplay; explicit start resumes before load', async () => {
  let fixtureState!: ReturnType<typeof fixture>;
  fixtureState = fixture(async () => {
    assert.equal(fixtureState.context.resumeCalls, 1, 'user-activation resume precedes fetch');
    return encoded();
  });
  const {controller, context, counts} = fixtureState;
  assert.deepEqual(controller.snapshot(), {phase: 'idle', volume: 1});
  controller.setVolume(0.4);
  assert.deepEqual(counts(), {contexts: 0, loads: 0, ended: 0});
  const pending = controller.start();
  assert.deepEqual(controller.snapshot(), {phase: 'loading', volume: 0.4});
  assert.equal(await pending, true);
  assert.deepEqual(controller.snapshot(), {phase: 'playing', volume: 0.4});
  assert.equal(context.gains[0]!.gain.value, 0.4);
  assert.deepEqual(context.sources[0]!.starts, [[5, 0]]);
  assert.equal(context.sources[0]!.loop, false);
  assert.equal(await controller.start(), true);
  assert.equal(context.sources.length, 1, 'playing cannot overlap a second source');
  assert.equal(counts().loads, 1);
  await controller.close();
});

test('pause keeps main ownership outside controller, restarts SA at zero and never emits natural end', async () => {
  const {controller, context, counts} = fixture();
  await controller.start();
  const staleEnd = context.sources[0]!.onended!;
  context.currentTime = 10;
  controller.pause();
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.sources[0]!.onended, null);
  staleEnd();
  assert.equal(counts().ended, 0);
  assert.equal(await controller.start(), true);
  assert.deepEqual(context.sources[1]!.starts, [[10, 0]], 'SA_PLAY restart policy is explicitly zero');
  assert.equal(context.decodeCalls, 1, 'pause retains the pinned buffer');
  assert.equal(counts().loads, 1);
  await controller.close();
});

test('natural end disconnects once and emits only for current source; stop unloads and next start loads anew', async () => {
  const {controller, context, counts} = fixture();
  await controller.start();
  const end = context.sources[0]!.onended!;
  end(); end();
  assert.equal(controller.snapshot().phase, 'ended');
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.sources[0]!.stops, 0);
  assert.equal(counts().ended, 1);
  controller.pause();
  assert.equal(controller.snapshot().phase, 'ended');
  await controller.start();
  const staleEnd = context.sources[1]!.onended!;
  controller.stop(); staleEnd();
  assert.equal(controller.snapshot().phase, 'idle');
  assert.equal(counts().ended, 1);
  await controller.start();
  assert.equal(counts().loads, 3, 'completion and return-to-main both release the buffer');
  assert.equal(context.decodeCalls, 3);
  await controller.close();
});

test('pause, stop and close abort pending loads; even a loader ignoring abort cannot start stale sound', async () => {
  for (const action of ['pause', 'stop', 'close'] as const) {
    const loading = deferred<ArrayBuffer>();
    let signal!: AbortSignal;
    const {controller, context, counts} = fixture(input => {signal = input; return loading.promise;});
    const pending = controller.start();
    assert.equal(signal.aborted, false);
    if (action === 'close') await controller.close(); else controller[action]();
    assert.equal(signal.aborted, true, action);
    loading.resolve(encoded());
    assert.equal(await pending, false, action);
    assert.equal(context.decodeCalls, 0, action);
    assert.equal(context.sources.length, 0, action);
    assert.equal(counts().ended, 0, action);
    assert.equal(controller.snapshot().phase, action === 'pause' ? 'paused' : action === 'stop' ? 'idle' : 'closed');
    await controller.close();
  }
});

test('a stale decode cannot produce nodes or overwrite a newer successful start', async () => {
  const first = deferred<AudioBuffer>();
  const {controller, context, counts} = fixture();
  context.decodeNext = async () => context.decodeCalls === 1 ? first.promise : buffer();
  const old = controller.start();
  await waitFor(() => context.decodeCalls === 1);
  const latest = controller.start();
  assert.equal(await latest, true);
  first.resolve(buffer());
  assert.equal(await old, false);
  assert.equal(context.sources.length, 1);
  assert.equal(controller.snapshot().phase, 'playing');
  assert.equal(counts().ended, 0);
  await controller.close();
});

test('cancelled context resume cannot restart after stop or affect newer playback, including late rejection', async () => {
  for (const reject of [false, true]) {
    const resume = deferred<void>();
    const {controller, context, counts} = fixture();
    context.resumeNext = () => resume.promise;
    const old = controller.start();
    controller.stop();
    context.resumeNext = undefined;
    assert.equal(await controller.start(), true);
    if (reject) resume.reject(Error('stale resume')); else resume.resolve();
    assert.equal(await old, false);
    assert.equal(context.sources.length, 1);
    assert.equal(controller.snapshot().phase, 'playing');
    assert.equal(counts().ended, 0);
    await controller.close();
  }
});

test('external interruption during playback or loading cancels generation; running event never autoplays', async () => {
  const {controller, context, counts} = fixture();
  await controller.start();
  context.setState('suspended');
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.sources[0]!.stops, 1);
  context.setState('running');
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.sources.length, 1);
  assert.equal(counts().ended, 0);
  await controller.close();

  const loading = deferred<ArrayBuffer>();
  let signal!: AbortSignal;
  const other = fixture(input => {signal = input; return loading.promise;});
  const pending = other.controller.start();
  await new Promise<void>(resolve => setImmediate(resolve));
  other.context.setState('suspended');
  assert.equal(other.controller.snapshot().phase, 'paused');
  assert.equal(signal.aborted, true);
  other.context.setState('running');
  loading.resolve(encoded());
  assert.equal(await pending, false);
  assert.equal(other.context.sources.length, 0);
  await other.controller.close();
});

test('snapshot reconciles interruption when browser statechange delivery is delayed', async () => {
  const {controller, context} = fixture();
  await controller.start();
  context.state = 'suspended';
  assert.equal(context.sources[0]!.stops, 0);
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.sources[0]!.stops, 1);
  context.setState('running');
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(await controller.start(), true, 'only another explicit start may restart');
  assert.deepEqual(context.sources[1]!.starts, [[5, 0]]);
  await controller.close();
});

test('load, hash, decode, resume and node failures return false with retryable error, never natural end', async () => {
  for (const failure of ['load', 'bytes', 'hash', 'decode', 'resume', 'source'] as const) {
    const {controller, context, counts} = fixture(async () => {
      if (failure === 'load') throw Error('load failed');
      if (failure === 'bytes') return new ArrayBuffer(SOURCE.bytes - 1);
      const bytes = encoded();
      if (failure === 'hash') new Uint8Array(bytes)[0] ^= 1;
      return bytes;
    });
    if (failure === 'decode') context.decodeNext = async () => buffer({numberOfChannels: 2});
    if (failure === 'resume') context.resumeNext = async () => {throw Error('resume failed');};
    if (failure === 'source') context.failStart = true;
    assert.equal(await controller.start(), false, failure);
    assert.equal(controller.snapshot().phase, 'error', failure);
    controller.pause();
    assert.equal(controller.snapshot().phase, 'error', 'pause preserves error for host recovery');
    assert.equal(counts().ended, 0);
    if (failure === 'source') {
      assert.equal(context.sources[0]!.stops, 0);
      assert.equal(context.sources[0]!.disconnects, 1);
    }
    await controller.close();
  }
  const retry = fixture();
  retry.context.resumeNext = async () => {throw Error('resume failed');};
  assert.equal(await retry.controller.start(), false);
  retry.context.resumeNext = undefined;
  assert.equal(await retry.controller.start(), true);
  assert.equal(retry.controller.snapshot().phase, 'playing');
  await retry.controller.close();
});

test('close removes listeners and disposes sources and context exactly once, invalidating old callbacks', async () => {
  const {controller, context, counts} = fixture();
  await controller.start();
  const oldEnd = context.sources[0]!.onended!;
  assert.equal(getEventListeners(context, 'statechange').length, 1);
  const closing = controller.close();
  assert.strictEqual(controller.close(), closing);
  await closing; oldEnd();
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.gains[0]!.disconnects, 1);
  assert.equal(context.closeCalls, 1);
  assert.equal(getEventListeners(context, 'statechange').length, 0);
  assert.equal(controller.snapshot().phase, 'closed');
  assert.equal(counts().ended, 0);
  assert.equal(await controller.start(), false);
  controller.pause(); controller.stop();
  assert.equal(controller.snapshot().phase, 'closed');
  assert.throws(() => controller.setVolume(0.5), /P006_SA_CLOSED/);
});

test('decoder pins complete source bytes before asynchronous digest and rejects invalid metadata', async () => {
  assert.equal(sourceBytes.length, SOURCE.bytes);
  assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), SOURCE.sha256);
  const context = new FakeContext();
  context.decodeNext = async bytes => {
    assert.equal(createHash('sha256').update(new Uint8Array(bytes)).digest('hex'), SOURCE.sha256);
    return buffer();
  };
  const input = encoded();
  const task = decodeP006SpanishAudio(context as unknown as BaseAudioContext, input);
  new Uint8Array(input).fill(0);
  await task;
  for (const metadata of [{numberOfChannels: 2}, {sampleRate: 22050}, {length: 0}, {length: NaN}, {length: 1.5}]) {
    context.decodeNext = async () => buffer(metadata);
    await assert.rejects(decodeP006SpanishAudio(context as unknown as BaseAudioContext, encoded()), /P006_SA_DECODE/);
  }
  context.sampleRate = 22050;
  await assert.rejects(decodeP006SpanishAudio(context as unknown as BaseAudioContext, encoded()), /P006_SA_CONTEXT_RATE/);
});

test('default loader requests only exact local SA with no-store, same-origin and redirect denial', async t => {
  const context = new FakeContext();
  let loads = 0;
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    loads++;
    assert.equal(url, `${SOURCE.url}?sha256=${SOURCE.sha256}`);
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert(options.signal instanceof AbortSignal);
    return new Response(Uint8Array.from(sourceBytes), {headers: {'Content-Type': 'audio/mpeg', 'Content-Length': String(SOURCE.bytes)}});
  });
  const controller = new P006SpanishAudioController({createContext: () => context as unknown as AudioContext});
  assert.equal(loads, 0);
  assert.equal(await controller.start(), true);
  assert.equal(loads, 1);
  await controller.close();
});

test('failed context initialization closes owned context, and invalid volume never creates context', async () => {
  const context = new FakeContext(); context.sampleRate = 22050;
  const controller = new P006SpanishAudioController({createContext: () => context as unknown as AudioContext});
  for (const invalid of [-1, 1.1, NaN, Infinity]) assert.throws(() => controller.setVolume(invalid), /P006_SA_VOLUME/);
  assert.equal(context.closeCalls, 0);
  assert.equal(await controller.start(), false);
  assert.equal(controller.snapshot().phase, 'error');
  assert.equal(context.closeCalls, 1);
  assert.equal(context.sources.length, 0);
  await controller.close();
});
