import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P012AudioController, P012_MAIN_AUDIO_URL, P012_COACH_AUDIO_URL} from '../src/alg-l12-p012-audio';
import {P012_AUDIO_SOURCE as source, P012_MAIN_AUDIO_SCHEDULE as schedule,
  frameToP012TimelineSample, resolveP012CoachBranch, type P012CoachAudioLabel,
} from '../src/alg-l12-p012-audio-schedule';

const ORIGIN = 'http://127.0.0.1:3109';
const files = {
  main: new Uint8Array(readFileSync(new URL('../../../migrations/shared-alg001-l12-p012/audio-source-v1/main-sprite-86.mp3', import.meta.url))),
  coach: new Uint8Array(readFileSync(new URL('../../../migrations/shared-alg001-l12-p012/audio-source-v1/coach-sprite-76.mp3', import.meta.url))),
};
const URLs = {main: new URL(P012_MAIN_AUDIO_URL, ORIGIN).href,
  coach: new URL(P012_COACH_AUDIO_URL, ORIGIN).href};
function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return {promise, resolve};
}
async function flush() { await new Promise<void>(resolve => setImmediate(resolve)); }
function reply(domain: 'main' | 'coach', bytes = files[domain], overrides: {
  status?: number; url?: string; mime?: string; length?: string | null; redirected?: boolean,
} = {}) {
  const headers = new Headers({'content-type': overrides.mime ?? 'audio/mpeg'});
  if (overrides.length !== null) headers.set('content-length', overrides.length ?? String(bytes.length));
  const response = new Response(bytes.slice(), {status: overrides.status ?? 200, headers});
  Object.defineProperties(response, {url: {value: overrides.url ?? URLs[domain]},
    redirected: {value: overrides.redirected ?? false}, type: {value: 'basic'}});
  return response;
}
class FakeGain {
  gain = {value: -1}; disconnects = 0;
  connect() {} disconnect() {this.disconnects++;}
}
class FakeNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number]> = [];
  stops = 0;
  disconnects = 0;
  connect(gain: unknown) { assert(gain instanceof FakeGain); }
  disconnect() { this.disconnects++; }
  start(when: number, offset: number, duration: number) { this.starts.push([when, offset, duration]); }
  stop() {this.stops++;}
}
class FakeContext extends EventTarget {
  sampleRate = source.sampleRate;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain();
  nodes: FakeNode[] = [];
  decodes: Array<'main' | 'coach'> = [];
  resumeCalls = 0;
  closeCalls = 0;
  resumeNext: (() => Promise<void>) | null = null;
  decodeNext: ((domain: 'main' | 'coach') => Promise<AudioBuffer>) | null = null;
  setState(state: AudioContextState) {this.state = state; this.dispatchEvent(new Event('statechange'));}
  createGain() {return this.gain;}
  createBufferSource() {const node = new FakeNode();this.nodes.push(node);return node;}
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.setState('running');
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    const domain = bytes.byteLength === source.main.bytes ? 'main' : 'coach';
    assert.deepEqual(new Uint8Array(bytes), files[domain]);
    this.decodes.push(domain);
    if (this.decodeNext) return this.decodeNext(domain);
    return decoded(domain);
  }
  async close() {this.closeCalls++;this.setState('closed');}
}
function decoded(domain: 'main' | 'coach', overrides: Partial<AudioBuffer> = {}): AudioBuffer {
  const samples = new Float32Array(source[domain].decodedSamples);
  return {sampleRate: source.sampleRate, numberOfChannels: 1,
    length: source[domain].decodedSamples, getChannelData: () => samples,
    ...overrides} as AudioBuffer;
}
function fixture(override?: typeof fetch) {
  const context = new FakeContext();
  const calls: string[] = [];
  let creations = 0;
  const fetcher: typeof fetch = async (input) => {
    const url = String(input); calls.push(url);
    return reply(url === URLs.main ? 'main' : 'coach');
  };
  const changes: string[] = [];
  const controller = new P012AudioController({origin: ORIGIN,
    createContext: () => {creations++;return context as unknown as AudioContext;},
    fetch: override ?? fetcher, onChange: s => {changes.push(s.phase);}});
  return {controller, context, calls, changes, creations: () => creations};
}

test('lazy construction, exact same-origin URL pins, reset and volume', async () => {
  const {controller, context, calls, creations} = fixture();
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(controller.snapshot().mainFrame, 1);
  controller.setVolume(0.65); controller.seekFrame(80); controller.reset();
  assert.equal(controller.snapshot().mainFrame, 1);
  assert.equal(creations(), 0); assert.equal(calls.length, 0);
  for (const value of [-1, 2, NaN]) assert.throws(() => controller.setVolume(value), /P012_AUDIO_VOLUME/);
  for (const frame of [0, 120, 2.5]) assert.throws(() => controller.seekFrame(frame), /P012_AUDIO_FRAME/);
  for (const origin of ['file:///', ORIGIN + '/', 'https://user:password@example.test'])
    assert.throws(() => new P012AudioController({origin}), /P012_AUDIO_ORIGIN/);
  assert.throws(() => new P012AudioController({origin: ORIGIN, mainPath: '/wrong' as never}), /P012_AUDIO_PATH/);
  await controller.close(); assert.equal(context.closeCalls, 0);
});

test('explicit main Play hashes/decodes whole source and keeps audio clock through frame119', async () => {
  const {controller, context, calls} = fixture();
  context.currentTime = 10;
  assert.equal(await controller.play(), true);
  assert.deepEqual(calls, [URLs.main]);
  assert.deepEqual(context.decodes, ['main']);
  assert.equal(context.gain.gain.value, 0);
  assert.deepEqual(context.nodes[0]!.starts, [[10 + schedule.timelineStartSample / source.sampleRate,
    0, source.main.decodedSamples / source.sampleRate]]);
  context.currentTime = 10 + frameToP012TimelineSample(31) / source.sampleRate;
  assert.equal(controller.snapshot().mainFrame, 31);
  assert.equal(controller.snapshot().phase, 'playing');
  context.currentTime = 10 + schedule.interactiveEntrySample / source.sampleRate;
  assert.equal(controller.snapshot().mainFrame, 119);
  context.currentTime = 10 + schedule.audioEndTimelineSample / source.sampleRate;
  assert.equal(controller.snapshot().phase, 'playing');
  context.currentTime = 10 + schedule.terminalTimelineSample / source.sampleRate;
  assert.equal(controller.snapshot().phase, 'ended');
  assert.equal(controller.snapshot().mainFrame, 119);
  assert.equal(await controller.play(), false);
  await controller.close();
});

test('each coach branch starts at raw cumulative sample and stops at source return clock', async () => {
  for (const label of ['S1', 'S2', 'S3', 'S4'] as P012CoachAudioLabel[]) {
    const {controller, context, calls, changes} = fixture();
    controller.seekFrame(119);
    changes.length = 0;
    context.currentTime = 4;
    assert.equal(await controller.playCoach(label), true);
    assert.ok(!changes.includes('paused'), 'branch start must not emit a transient pause to the host');
    const branch = resolveP012CoachBranch(label);
    assert.deepEqual(calls, [URLs.coach]);
    assert.deepEqual(context.nodes[0]!.starts, [[4,
      branch.playbackStartSample / source.sampleRate,
      branch.scheduledDurationSamples / source.sampleRate]]);
    assert.equal(controller.snapshot().phase, 'playing', 'coach-only playback remains playing');
    assert.equal(controller.snapshot().coachFrame, branch.firstFrame);
    context.currentTime = 4 + (branch.clockDurationSamples - 1) / source.sampleRate;
    assert.equal(controller.snapshot().coachFrame, branch.returnFrame - 1);
    context.currentTime = 4 + branch.clockDurationSamples / source.sampleRate;
    assert.equal(controller.snapshot().phase, 'paused', 'main 119 has not reached terminal');
    assert.ok(!changes.includes('paused'), 'natural return must not pause the reducer before its catch-up tick');
    assert.equal(controller.snapshot().coachFrame, 1);
    assert.equal(controller.snapshot().coachLabel, null);
    await controller.close();
  }
});

test('coach-only playback after main terminal stays playing until its return', async () => {
  const {controller, context} = fixture(); await controller.play();
  context.currentTime = schedule.terminalTimelineSample / source.sampleRate;
  assert.equal(controller.snapshot().phase, 'ended');
  assert.equal(await controller.playCoach('S2'), true);
  assert.equal(controller.snapshot().phase, 'playing');
  assert.equal(controller.snapshot().mainFrame, 119);
  context.currentTime += 0.1;
  controller.pause();
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(controller.snapshot().coachLabel, 'S2');
  assert.equal(await controller.resume(), true);
  assert.equal(controller.snapshot().phase, 'playing');
  context.currentTime += (resolveP012CoachBranch('S2').clockDurationSamples - 0.1 * source.sampleRate) / source.sampleRate;
  assert.equal(controller.snapshot().phase, 'ended');
  await controller.close();
});

test('pause/resume preserves both clocks, decoded caches, seek and reset discard coach', async () => {
  const {controller, context, calls} = fixture(); await controller.play();
  context.currentTime = 1;
  assert.equal(await controller.playCoach('S3'), true);
  context.currentTime = 1.1;
  const before = controller.snapshot(); controller.pause();
  const held = controller.snapshot();
  near(held.timelineSample, before.timelineSample);
  assert.equal(held.coachFrame, before.coachFrame);
  context.currentTime = 20;
  assert.equal(controller.snapshot().coachFrame, held.coachFrame);
  assert.equal(await controller.resume(), true);
  assert.equal(controller.snapshot().phase, 'playing');
  assert.deepEqual(calls, [URLs.main, URLs.coach]);
  assert.deepEqual(context.decodes, ['main', 'coach']);
  controller.seekFrame(70);
  assert.equal(controller.snapshot().coachLabel, null);
  assert.equal(await controller.play(), true);
  near(context.nodes.at(-1)!.starts[0]![1],
    (frameToP012TimelineSample(70) - schedule.timelineStartSample) / source.sampleRate);
  controller.reset(); assert.equal(controller.snapshot().mainFrame, 1);
  await controller.close();
});

test('context interruption pauses both without autoplay; stale resume and fetch cannot start', async () => {
  const {controller, context, changes} = fixture(); await controller.play(); await controller.playCoach('S1');
  context.currentTime = 0.3; context.setState('suspended');
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(controller.snapshot().coachPlaying, false);
  assert.ok(changes.includes('paused'));
  context.setState('running'); assert.equal(controller.snapshot().phase, 'paused');
  await controller.close();

  const delayed = fixture(); const gate = deferred<void>(); delayed.context.resumeNext = () => gate.promise;
  const starting = delayed.controller.play(); delayed.controller.pause(); gate.resolve();
  assert.equal(await starting, false); assert.equal(delayed.context.decodes.length, 0);
  await delayed.controller.close();

  const request = deferred<Response>(); let signal: AbortSignal | undefined;
  const late = fixture(async (_url, init) => {signal = init?.signal as AbortSignal;return request.promise;});
  const playing = late.controller.play(); await flush(); late.controller.seekFrame(80);
  assert.equal(signal?.aborted, true);
  request.resolve(reply('main')); assert.equal(await playing, false);
  assert.equal(late.context.decodes.length, 0); assert.equal(late.context.nodes.length, 0);
  await late.controller.close();
});

test('replaced coach and closed context reject late decode without a stale source', async () => {
  const {controller, context} = fixture();
  const gate = deferred<AudioBuffer>();
  context.decodeNext = async () => gate.promise;
  const first = controller.playCoach('S1');
  while (context.decodes.length === 0) await flush();
  controller.stopCoach();
  context.decodeNext = null;
  assert.equal(await controller.playCoach('S4'), true);
  gate.resolve(decoded('coach'));
  assert.equal(await first, false);
  assert.equal(context.nodes.length, 1);
  assert.equal(controller.snapshot().coachLabel, 'S4');
  await controller.close();

  const closing = fixture(); const decodeGate = deferred<AudioBuffer>();
  closing.context.decodeNext = async () => decodeGate.promise;
  const pending = closing.controller.play();
  while (closing.context.decodes.length === 0) await flush();
  await closing.controller.close();
  decodeGate.resolve(decoded('main'));
  assert.equal(await pending, false);
  assert.equal(closing.context.nodes.length, 0);
  assert.equal(closing.controller.snapshot().phase, 'closed');
});

test('both streams fail closed on byte drift and invalid response/decode', async () => {
  const drift = files.main.slice(); drift[4] ^= 1;
  for (const [respond, code] of [
    [() => reply('main', files.main, {url: 'https://other.test/main.mp3'}), 'P012_AUDIO_RESPONSE'],
    [() => reply('main', files.main, {length: '1'}), 'P012_AUDIO_BYTES'],
    [() => reply('main', drift), 'P012_AUDIO_HASH'],
  ] as const) {
    const {controller, context} = fixture(async () => respond());
    assert.equal(await controller.play(), false);
    assert.equal(controller.snapshot().error, code);
    assert.equal(context.decodes.length, 0); await controller.close();
  }
  const bad = fixture(); bad.context.decodeNext = async domain => decoded(domain, {sampleRate: 44_100});
  assert.equal(await bad.controller.playCoach('S1'), false);
  assert.equal(bad.controller.snapshot().error, 'P012_AUDIO_DECODE');
  assert.equal(bad.context.nodes.length, 0); await bad.controller.close();
});
