import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P060AudioController, P060_AUDIO_DOMAINS, P060_AUDIO_SOURCE,
  P060_MAIN_STOP_FRAMES, p060SourceSampleAtFrame,
  type P060AudioBinding, type P060AudioDomainId,
} from '../src/nms-l02-p060-audio-v1';

const rawBytes = readFileSync(new URL('../../../output/nms-l02-p060-source-20260927/audio-raw-index.json',
  import.meta.url));
const raw = JSON.parse(rawBytes.toString('utf8')) as {streams: Array<{ownerDomainId: string;
  payload: {bytes: number; sha256: string}; header: {channels: number; sampleRateHz: number};
  blockFrameRange: {first: number; last: number}; blocks: Array<{
  frame: number; declaredSamples: number}>}>};
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return {promise, resolve};
};

class FakeGain {
  gain = {value: -1};
  disconnected = 0;
  connect() {}
  disconnect() { this.disconnected++; }
}
class FakeNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number]> = [];
  stops = 0;
  disconnected = 0;
  connect(gain: unknown) { assert.ok(gain instanceof FakeGain); }
  disconnect() { this.disconnected++; }
  start(when: number, offset: number, duration: number) {
    assert.ok(duration > 0);
    this.starts.push([when, offset, duration]);
  }
  stop() { this.stops++; }
  end() { this.onended?.(); }
}
class FakeContext extends EventTarget {
  sampleRate = P060_AUDIO_SOURCE.sampleRate;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain();
  nodes: FakeNode[] = [];
  resumes = 0;
  closes = 0;
  createGain() { return this.gain; }
  createBufferSource() { const node = new FakeNode(); this.nodes.push(node); return node; }
  async resume() { this.resumes++; this.state = 'running'; this.dispatchEvent(new Event('statechange')); }
  async close() { this.closes++; this.state = 'closed'; this.dispatchEvent(new Event('statechange')); }
  interrupt() { this.state = 'suspended'; this.dispatchEvent(new Event('statechange')); }
}
function buffer(binding: P060AudioBinding, channels = binding.channels): AudioBuffer {
  const data = Array.from({length: channels}, () => new Float32Array(binding.decodedSamples));
  return {sampleRate: binding.sampleRate, numberOfChannels: channels,
    length: binding.decodedSamples, getChannelData: (channel: number) => data[channel]} as AudioBuffer;
}
function fixture(reader?: (binding: P060AudioBinding, signal: AbortSignal,
  context: AudioContext) => Promise<AudioBuffer>) {
  const context = new FakeContext();
  const loads: P060AudioDomainId[] = [];
  const controller = new P060AudioController({createContext: () => context as unknown as AudioContext,
    readVerified: reader ?? (async (binding, signal) => {
      assert.equal(signal.aborted, false);
      loads.push(binding.id);
      return buffer(binding);
    })});
  return {controller, context, loads};
}

test('all 11 compact domain maps and pins correspond to exact raw blocks', () => {
  assert.equal(raw.streams.length, 11);
  assert.equal(createHash('sha256').update(rawBytes).digest('hex'), P060_AUDIO_SOURCE.rawIndexSha256);
  for (const stream of raw.streams) {
    const id = stream.ownerDomainId as P060AudioDomainId;
    const binding = P060_AUDIO_DOMAINS[id];
    assert.ok(binding);
    assert.equal(binding.blockCodes.length, stream.blocks.length);
    assert.equal(binding.bytes, stream.payload.bytes);
    assert.equal(binding.sha256, stream.payload.sha256);
    assert.equal(binding.channels, stream.header.channels);
    assert.equal(binding.sampleRate, stream.header.sampleRateHz);
    assert.equal(binding.firstBlockFrame, stream.blockFrameRange.first);
    assert.equal(binding.lastBlockFrame, stream.blockFrameRange.last);
    assert.equal(binding.urlPath, `/migration-assets/nms-l02-p060/${id}.mp3?sha256=${binding.sha256}`);
    assert.equal(binding.sourceSwfSha256, P060_AUDIO_SOURCE.swfSha256);
    let prefix = 0;
    for (const block of stream.blocks) {
      assert.equal(p060SourceSampleAtFrame(id, block.frame), prefix);
      prefix += block.declaredSamples;
    }
    assert.equal(prefix, binding.decodedSamples);
    assert.equal(p060SourceSampleAtFrame(id, binding.lastBlockFrame + 1), prefix);
  }
  assert.deepEqual(P060_MAIN_STOP_FRAMES, [262, 400, 527, 646, 699, 718]);
  assert.equal(P060_AUDIO_DOMAINS['sprite-354'].channels, 2);
  assert.deepEqual(Object.values(P060_AUDIO_DOMAINS).filter(domain => domain.channels !== 1)
    .map(domain => domain.id), ['sprite-354']);
  assert.equal(P060_AUDIO_DOMAINS['sprite-391'].decodedSamples, 1_289_088);
  assert.equal(p060SourceSampleAtFrame('sprite-391', 1), 0);
  assert.equal(p060SourceSampleAtFrame('sprite-391', 9), 0);
  assert.equal(p060SourceSampleAtFrame('sprite-391', 711), 1_289_088);
  assert.equal(p060SourceSampleAtFrame('sprite-391', 718), 1_289_088);
});

test('main segment has clock-only lead, scheduled sample hard stop, visual boundary and sample-exact resume', async () => {
  const {controller, context, loads} = fixture();
  assert.equal(controller.snapshot().frame, 1);
  assert.equal(context.resumes, 0);
  context.currentTime = 10;
  assert.equal(await controller.playDomain('sprite-391', 1, 262), true);
  assert.deepEqual(loads, ['sprite-391']);
  assert.equal(context.nodes.length, 1);
  const stop = p060SourceSampleAtFrame('sprite-391', 262);
  near(context.nodes[0].starts[0][0], 10 + 8 / 12);
  near(context.nodes[0].starts[0][1], 0);
  near(context.nodes[0].starts[0][2], stop / 22050);
  context.currentTime = 10.25;
  assert.equal(controller.snapshot().frame, 4);
  assert.equal(controller.snapshot().sourceSample, 0);
  context.currentTime = 11;
  const before = controller.snapshot().sourceSample;
  assert.ok(before > 0);
  controller.pause();
  assert.equal(controller.snapshot().sourceSample, before);
  assert.equal(context.nodes[0].stops, 1);
  assert.equal(await controller.resume(), true);
  assert.deepEqual(loads, ['sprite-391']);
  near(context.nodes[1].starts[0][1], before / 22050);
  near(context.nodes[1].starts[0][2], (stop - before) / 22050);
  context.currentTime = 10 + 261 / 12 + 0.1;
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(controller.snapshot().frame, 262);
  assert.equal(controller.snapshot().sourceSample, stop);
  assert.equal(controller.snapshot().atBoundary, true);
  assert.equal(await controller.playDomain('sprite-391', 1, 262), false);
  await controller.close();
});

test('every main hard stop uses exact block-prefix duration; final frame remains after MP3 EOF', async () => {
  const {controller, context} = fixture();
  const frames = [1, ...P060_MAIN_STOP_FRAMES];
  for (let index = 0; index < P060_MAIN_STOP_FRAMES.length; index++) {
    const from = frames[index];
    const to = frames[index + 1];
    context.currentTime = 100 * index;
    assert.equal(await controller.playDomain('sprite-391', from, to), true);
    const start = p060SourceSampleAtFrame('sprite-391', from);
    const end = p060SourceSampleAtFrame('sprite-391', to);
    const node = context.nodes[index];
    near(node.starts[0][1], start / 22050);
    near(node.starts[0][2], (end - start) / 22050);
    context.currentTime += (to - from) / 12 + 0.1;
    const snapshot = controller.snapshot();
    assert.equal(snapshot.frame, to);
    assert.equal(snapshot.sourceSample, end);
    assert.equal(snapshot.phase, to === 718 ? 'ended' : 'paused');
    assert.equal(snapshot.atBoundary, true);
  }
  assert.equal(P060_AUDIO_DOMAINS['sprite-391'].lastBlockFrame, 711);
  assert.equal(p060SourceSampleAtFrame('sprite-391', 711),
    p060SourceSampleAtFrame('sprite-391', 718));
  await controller.close();
});

test('feedback takes the single node, verifies stereo, and main resumes same decoded buffer', async () => {
  const {controller, context, loads} = fixture();
  context.currentTime = 3;
  assert.equal(await controller.playDomain('sprite-391', 262, 400), true);
  context.currentTime = 4;
  const mainSample = controller.snapshot().sourceSample;
  assert.equal(await controller.playDomain('sprite-354', 1, 26), true);
  assert.equal(context.nodes[0].stops, 1);
  assert.deepEqual(loads, ['sprite-391', 'sprite-354']);
  near(context.nodes[1].starts[0][0], 4 + 1 / 12);
  near(context.nodes[1].starts[0][2], P060_AUDIO_DOMAINS['sprite-354'].decodedSamples / 22050);
  assert.equal(controller.snapshot().domain, 'sprite-354');
  assert.equal(await controller.playDomain('sprite-391', 262, 400), true);
  assert.equal(context.nodes[1].stops, 1);
  assert.deepEqual(loads, ['sprite-391', 'sprite-354']);
  near(context.nodes[2].starts[0][1], mainSample / 22050);
  assert.equal(context.nodes.filter(node => node.onended !== null).length, 1);
  await controller.close();
  assert.equal(context.closes, 1);
});

test('late load is cancelled and cannot start after pause, reset, or navigation close', async () => {
  const load = deferred<AudioBuffer>();
  const seen: AbortSignal[] = [];
  const {controller, context} = fixture(async (_binding, signal) => {
    seen.push(signal);
    return load.promise;
  });
  const playing = controller.playDomain('sprite-391', 1, 262);
  await new Promise<void>(done => setImmediate(done));
  assert.equal(controller.snapshot().phase, 'loading');
  controller.pause();
  assert.equal(seen[0].aborted, true);
  load.resolve(buffer(P060_AUDIO_DOMAINS['sprite-391']));
  assert.equal(await playing, false);
  assert.equal(context.nodes.length, 0);
  controller.reset();
  assert.equal(controller.snapshot().domain, null);
  await controller.close();
  assert.equal(controller.snapshot().phase, 'closed');
});

test('context interruption pauses; source shape, bounds, and volume fail closed', async () => {
  const {controller, context} = fixture(async binding =>
    binding.id === 'sprite-354' ? buffer(binding, 1) : buffer(binding));
  for (const [from, to] of [[0, 262], [1, 261], [1, 400], [262, 527],
    [400, 262], [1, 719]])
    assert.throws(() => controller.playDomain('sprite-391', from, to), /P060_AUDIO_WINDOW/);
  assert.throws(() => controller.playDomain('sprite-354', 1, 25), /P060_AUDIO_WINDOW/);
  for (const value of [-1, 1.1, NaN]) assert.throws(() => controller.setVolume(value), /P060_AUDIO_VOLUME/);
  controller.setVolume(0.4);
  assert.equal(await controller.playDomain('sprite-391', 1, 262), true);
  assert.equal(context.gain.gain.value, 0.4);
  context.currentTime = 2;
  context.interrupt();
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.nodes[0].stops, 1);
  assert.equal(await controller.playDomain('sprite-354', 1, 26), false);
  assert.equal(controller.snapshot().phase, 'error');
  assert.equal(controller.snapshot().error, 'P060_AUDIO_DECODE');
  await controller.close();
});
