import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ALG_L12_GLOSSARY_PAIR_AUDIO as PAIR,
  pairFrameToTimelineSample, pairTimelineSampleToFrame, resolvePairMainAudio,
  type AlgL12GlossaryPairAudioConfig} from '../src/alg-l12-glossary-pair-audio-schedule';
import {AlgL12GlossaryPairAudioController} from '../src/alg-l12-glossary-pair-audio';
import {AlgL12GlossaryPairSpanishAudioController} from '../src/alg-l12-glossary-pair-audio-spanish';

const ORIGIN = 'http://127.0.0.1:3109';
const pairs = [PAIR.p013, PAIR.p015] as const;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function embedded(config: AlgL12GlossaryPairAudioConfig) {
  return new Uint8Array(readFileSync(new URL(
    `../../../output/alg-l12-next-glossary-20260927/audio/${config.animationId.endsWith('p013') ? 'p013-main-sprite-63' : 'p015-main-sprite-76'}.mp3`,
    import.meta.url)));
}
function sidecar(config: AlgL12GlossaryPairAudioConfig) {
  return new Uint8Array(readFileSync(
    `/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/SA/${config.animationId.endsWith('p013') ? 'L12VB08' : 'L12VB10'}.mp3`));
}
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(done => {resolve = done;});
  return {promise, resolve};
}
async function flush() {await new Promise<void>(resolve => setImmediate(resolve));}
function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
}
function response(bytes: Uint8Array, url: string, overrides: {mime?: string; status?: number} = {}) {
  const result = new Response(bytes.slice(), {status: overrides.status ?? 200,
    headers: {'content-type': overrides.mime ?? 'audio/mpeg', 'content-length': String(bytes.length)}});
  Object.defineProperties(result, {url: {value: url}, redirected: {value: false}, type: {value: 'basic'}});
  return result;
}
class FakeGain {
  gain = {value: -1};
  disconnects = 0;
  connect() {}
  disconnect() {this.disconnects++;}
}
class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number | undefined]> = [];
  stops = 0;
  disconnects = 0;
  connect(target: unknown) {assert(target instanceof FakeGain);}
  start(when: number, offset: number, duration?: number) {this.starts.push([when, offset, duration]);}
  stop() {this.stops++;}
  disconnect() {this.disconnects++;}
}
class FakeContext extends EventTarget {
  sampleRate: number;
  channels: number;
  samples: number;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain();
  sources: FakeSource[] = [];
  resumeCalls = 0;
  decodeCalls = 0;
  closeCalls = 0;
  constructor(sampleRate: number, channels: number, samples: number) {
    super(); this.sampleRate = sampleRate; this.channels = channels; this.samples = samples;
  }
  setState(state: AudioContextState) {this.state = state; this.dispatchEvent(new Event('statechange'));}
  createGain() {return this.gain;}
  createBufferSource() {const node = new FakeSource(); this.sources.push(node); return node;}
  async resume() {this.resumeCalls++; if (this.state !== 'closed') this.setState('running');}
  async decodeAudioData(_bytes: ArrayBuffer) {
    this.decodeCalls++;
    const channel = new Float32Array(this.samples);
    return {sampleRate: this.sampleRate, numberOfChannels: this.channels, length: this.samples,
      getChannelData: () => channel} as unknown as AudioBuffer;
  }
  async close() {this.closeCalls++; this.setState('closed');}
}

test('both configs bind exact extracted streams and separate real SA; source timing remains unaccepted', () => {
  const raw = JSON.parse(readFileSync(new URL(
    '../../../output/alg-l12-next-glossary-20260927/audio/raw-index.json', import.meta.url), 'utf8'));
  for (const config of pairs) {
    const stream = raw.pages[config.animationId];
    assert.equal(config.swfSha256, stream.source.sha256);
    assert.equal(config.mainSha256, stream.mp3.sha256);
    assert.equal(config.mainBytes, stream.mp3.bytes);
    assert.equal(config.mainDecodedSamples, stream.decode.decodedSamples);
    assert.equal(hash(embedded(config)), config.mainSha256);
    assert.equal(hash(sidecar(config)), config.saSha256);
    assert.equal(sidecar(config).length, config.saBytes);
    assert.equal(config.timelineStartSample, (config.firstAudioFrame - 1) * 1837.5);
    assert.equal(config.audioEndTimelineSample, config.timelineStartSample + config.mainDecodedSamples);
    assert.equal(config.initialLatencyTrimApplied, false);
    assert.equal(config.perBlockSeekReclockingApplied, false);
    assert.equal(config.synchronizationAccepted, false);
    assert.equal(resolvePairMainAudio(config, 0).kind, 'preroll');
    assert.equal(resolvePairMainAudio(config, config.timelineStartSample).sourceSample, 0);
    assert.equal(resolvePairMainAudio(config, config.audioEndTimelineSample).kind, 'postroll');
    assert.equal(resolvePairMainAudio(config, config.terminalTimelineSample).kind, 'terminal');
    assert.equal(pairTimelineSampleToFrame(config, config.terminalTimelineSample), config.frameCount);
    assert.throws(() => pairFrameToTimelineSample(config, config.frameCount + 1));
  }
  assert.deepEqual(PAIR.p013.negativeSeekFrames, [365]);
  assert.deepEqual(PAIR.p015.negativeSeekFrames, []);
});

for (const config of pairs) {
  test(`${config.animationId}: main Play, pause, seek, Replay, postroll and close own one lazy context`, async () => {
    const bytes = embedded(config);
    const context = new FakeContext(config.sampleRate, config.channels, config.mainDecodedSamples);
    const calls: Array<{url: string; init: RequestInit | undefined}> = [];
    const controller = new AlgL12GlossaryPairAudioController(config, {origin: ORIGIN,
      createContext: () => context as unknown as AudioContext,
      fetch: async (input, init) => {
        calls.push({url: String(input), init});
        return response(bytes, new URL(config.mainUrl, ORIGIN).href);
      }});
    assert.equal(controller.snapshot().phase, 'paused');
    assert.equal(context.resumeCalls, 0);
    controller.setVolume(0.4);
    const first = controller.play();
    assert.equal(context.resumeCalls, 1);
    assert.equal(await first, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, new URL(config.mainUrl, ORIGIN).href);
    assert.equal(calls[0]!.init?.mode, 'same-origin');
    assert.equal(context.decodeCalls, 1);
    assert.deepEqual(context.sources[0]!.starts,
      [[config.timelineStartSample / config.sampleRate, 0,
        config.mainDecodedSamples / config.sampleRate]]);
    assert.equal(context.gain.gain.value, 0.4);
    context.currentTime = config.timelineStartSample / config.sampleRate;
    assert.equal(controller.snapshot().frame, config.firstAudioFrame);
    context.currentTime = 4;
    controller.pause();
    const held = controller.snapshot().timelineSample;
    context.currentTime = 8;
    near(controller.snapshot().timelineSample, held);
    assert.equal(context.sources[0]!.stops, 1);
    controller.seekFrame(100);
    assert.equal(controller.snapshot().frame, 100);
    context.currentTime = 10;
    assert.equal(await controller.play(), true);
    assert.equal(context.decodeCalls, 1);
    assert.equal(calls.length, 1);
    near(context.sources[1]!.starts[0]![1],
      (pairFrameToTimelineSample(config, 100) - config.timelineStartSample) / config.sampleRate);
    assert.equal(await controller.replay(), true);
    assert.equal(controller.snapshot().frame, 1);
    assert.equal(context.sources[2]!.starts[0]![1], 0);
    context.currentTime = 10 + (config.audioEndTimelineSample + 1) / config.sampleRate;
    assert.equal(controller.snapshot().phase, 'playing');
    assert.equal(controller.snapshot().frame <= config.frameCount, true);
    context.currentTime = 10 + (config.terminalTimelineSample + 1) / config.sampleRate;
    assert.equal(controller.snapshot().phase, 'ended');
    assert.equal(await controller.play(), false);
    await controller.close();
    assert.equal(controller.snapshot().phase, 'closed');
    assert.equal(context.closeCalls, 1);
  });

  test(`${config.animationId}: main stale fetch and context interruption cannot start or resume sound`, async () => {
    const pending = deferred<Response>();
    const signals: AbortSignal[] = [];
    const context = new FakeContext(config.sampleRate, config.channels, config.mainDecodedSamples);
    const controller = new AlgL12GlossaryPairAudioController(config, {origin: ORIGIN,
      createContext: () => context as unknown as AudioContext,
      fetch: async (_input, init) => {signals.push(init?.signal as AbortSignal); return pending.promise;}});
    const play = controller.play();
    await flush();
    controller.seekFrame(20);
    assert.equal(signals[0]!.aborted, true);
    pending.resolve(response(embedded(config), new URL(config.mainUrl, ORIGIN).href));
    assert.equal(await play, false);
    assert.equal(context.decodeCalls, 0);
    assert.equal(context.sources.length, 0);
    await controller.close();

    const runningContext = new FakeContext(config.sampleRate, config.channels, config.mainDecodedSamples);
    const active = new AlgL12GlossaryPairAudioController(config, {origin: ORIGIN,
      createContext: () => runningContext as unknown as AudioContext,
      fetch: async () => response(embedded(config), new URL(config.mainUrl, ORIGIN).href)});
    assert.equal(await active.play(), true);
    runningContext.currentTime = 2;
    runningContext.setState('suspended');
    assert.equal(active.snapshot().phase, 'paused');
    assert.equal(runningContext.sources[0]!.stops, 1);
    runningContext.setState('running');
    assert.equal(active.snapshot().phase, 'paused');
    assert.equal(runningContext.sources.length, 1);
    await active.close();
  });

  test(`${config.animationId}: optional SA is separate, explicit, restartable and calls onEnded only naturally`, async () => {
    const bytes = sidecar(config);
    const context = new FakeContext(config.saSampleRate, config.saChannels, config.saDecodedSamples);
    const calls: string[] = [];
    let ended = 0;
    const controller = new AlgL12GlossaryPairSpanishAudioController(config, {origin: ORIGIN,
      createContext: () => context as unknown as AudioContext,
      fetch: async input => {calls.push(String(input)); return response(bytes, new URL(config.saUrl, ORIGIN).href);},
      onEnded: () => {ended++;}});
    assert.equal(controller.snapshot().phase, 'idle');
    controller.setVolume(0.3);
    assert.equal(context.resumeCalls, 0);
    assert.equal(await controller.start(), true);
    assert.equal(calls[0], new URL(config.saUrl, ORIGIN).href);
    assert.deepEqual(context.sources[0]!.starts, [[0, 0, undefined]]);
    assert.equal(context.gain.gain.value, 0.3);
    const stale = context.sources[0]!.onended!;
    controller.pause(); stale();
    assert.equal(ended, 0);
    assert.equal(controller.snapshot().phase, 'paused');
    assert.equal(await controller.start(), true);
    assert.equal(context.decodeCalls, 1, 'paused SA reuses verified buffer');
    assert.deepEqual(context.sources[1]!.starts, [[0, 0, undefined]]);
    const natural = context.sources[1]!.onended!;
    natural(); natural();
    assert.equal(ended, 1);
    assert.equal(controller.snapshot().phase, 'ended');
    assert.equal(await controller.start(), true);
    controller.stop();
    assert.equal(controller.snapshot().phase, 'idle');
    assert.equal(ended, 1);
    await controller.close();
    assert.equal(controller.snapshot().phase, 'closed');
  });

  test(`${config.animationId}: optional SA rejects late load after stop and never calls onEnded`, async () => {
    const pending = deferred<Response>();
    const signals: AbortSignal[] = [];
    const context = new FakeContext(config.saSampleRate, config.saChannels, config.saDecodedSamples);
    let ended = 0;
    const controller = new AlgL12GlossaryPairSpanishAudioController(config, {origin: ORIGIN,
      createContext: () => context as unknown as AudioContext,
      fetch: async (_input, init) => {signals.push(init?.signal as AbortSignal); return pending.promise;},
      onEnded: () => {ended++;}});
    const starting = controller.start();
    await flush();
    controller.stop();
    assert.equal(signals[0]!.aborted, true);
    pending.resolve(response(sidecar(config), new URL(config.saUrl, ORIGIN).href));
    assert.equal(await starting, false);
    assert.equal(controller.snapshot().phase, 'idle');
    assert.equal(context.decodeCalls, 0);
    assert.equal(context.sources.length, 0);
    assert.equal(ended, 0);
    await controller.close();
  });
}
