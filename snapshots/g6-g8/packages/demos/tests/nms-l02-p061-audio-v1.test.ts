import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P061AudioController, P061_AUDIO_DOMAINS, P061_AUDIO_SOURCE, P061_FEEDBACK_TIMINGS,
  P061_MAIN_STOP_FRAMES, p061SourceSampleAtFrame,
  type P061AudioBinding, type P061AudioDomainId,
} from '../src/nms-l02-p061-audio-v1';

const rawBytes = readFileSync(new URL('../../../output/nms-l02-p061-source-20260927/audio-raw-index.json',
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
  sampleRate = P061_AUDIO_SOURCE.sampleRate;
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
function buffer(binding: P061AudioBinding, channels = binding.channels): AudioBuffer {
  const data = Array.from({length: channels}, () => new Float32Array(binding.decodedSamples));
  return {sampleRate: binding.sampleRate, numberOfChannels: channels,
    length: binding.decodedSamples, getChannelData: (channel: number) => data[channel]} as AudioBuffer;
}
function fixture(reader?: (binding: P061AudioBinding, signal: AbortSignal,
  context: AudioContext) => Promise<AudioBuffer>) {
  const context = new FakeContext();
  const loads: P061AudioDomainId[] = [];
  const controller = new P061AudioController({createContext: () => context as unknown as AudioContext,
    readVerified: reader ?? (async (binding, signal) => {
      assert.equal(signal.aborted, false);
      loads.push(binding.id);
      return buffer(binding);
    })});
  return {controller, context, loads};
}

test('all 11 compact domain maps and pins correspond to exact raw blocks', () => {
  assert.equal(raw.streams.length, 11);
  assert.equal(createHash('sha256').update(rawBytes).digest('hex'), P061_AUDIO_SOURCE.rawIndexSha256);
  for (const stream of raw.streams) {
    const id = stream.ownerDomainId as P061AudioDomainId;
    const binding = P061_AUDIO_DOMAINS[id];
    assert.ok(binding);
    assert.equal(binding.blockCodes.length, stream.blocks.length);
    assert.equal(binding.bytes, stream.payload.bytes);
    assert.equal(binding.sha256, stream.payload.sha256);
    assert.equal(binding.channels, stream.header.channels);
    assert.equal(binding.sampleRate, stream.header.sampleRateHz);
    assert.equal(binding.firstBlockFrame, stream.blockFrameRange.first);
    assert.equal(binding.lastBlockFrame, stream.blockFrameRange.last);
    assert.equal(binding.urlPath, `/migration-assets/nms-l02-p061/${id}.mp3?sha256=${binding.sha256}`);
    assert.equal(binding.sourceSwfSha256, P061_AUDIO_SOURCE.swfSha256);
    let prefix = 0;
    for (const block of stream.blocks) {
      assert.equal(p061SourceSampleAtFrame(id, block.frame), prefix);
      prefix += block.declaredSamples;
    }
    assert.equal(prefix, binding.decodedSamples);
    assert.equal(p061SourceSampleAtFrame(id, binding.lastBlockFrame + 1), prefix);
  }
  assert.deepEqual(P061_MAIN_STOP_FRAMES, [435, 573, 700, 817, 860, 879]);
  assert.equal(P061_AUDIO_DOMAINS['sprite-284'].channels, 2);
  assert.deepEqual(Object.values(P061_AUDIO_DOMAINS).filter(domain => domain.channels !== 1)
    .map(domain => domain.id), ['sprite-284']);
  assert.equal(P061_AUDIO_DOMAINS['sprite-315'].decodedSamples, 1_590_336);
  assert.deepEqual(P061_AUDIO_DOMAINS['sprite-315'].emptyPayloadFrames, [10, 875]);
  assert.deepEqual(P061_AUDIO_DOMAINS['sprite-315'].negativeSeekBlocks, [{frame: 875, seekSamples: -2178}]);
  assert.equal(p061SourceSampleAtFrame('sprite-315', 1), 0);
  assert.equal(p061SourceSampleAtFrame('sprite-315', 9), 0);
  assert.equal(p061SourceSampleAtFrame('sprite-315', 875), 1_590_336);
  assert.equal(p061SourceSampleAtFrame('sprite-315', 879), 1_590_336);
  assert.equal(Object.keys(P061_FEEDBACK_TIMINGS).length, 10);
  for (const [id, timing] of Object.entries(P061_FEEDBACK_TIMINGS)) {
    const binding = P061_AUDIO_DOMAINS[id as P061AudioDomainId];
    assert.equal(timing.sourceTerminalFrame, binding.lastBlockFrame);
    assert.equal(timing.fullBufferWindowEndFrame, binding.lastBlockFrame + 1);
    assert.equal(timing.decodedSamples, binding.decodedSamples);
  }
});

test('main segment has clock-only lead, scheduled sample hard stop, visual boundary and sample-exact resume', async () => {
  const {controller, context, loads} = fixture();
  assert.equal(controller.snapshot().frame, 1);
  assert.equal(context.resumes, 0);
  context.currentTime = 10;
  assert.equal(await controller.playDomain('sprite-315', 1, 435), true);
  assert.deepEqual(loads, ['sprite-315']);
  assert.equal(context.nodes.length, 1);
  const stop = p061SourceSampleAtFrame('sprite-315', 435);
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
  assert.deepEqual(loads, ['sprite-315']);
  near(context.nodes[1].starts[0][1], before / 22050);
  near(context.nodes[1].starts[0][2], (stop - before) / 22050);
  context.currentTime = 10 + 434 / 12 + 0.1;
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(controller.snapshot().frame, 435);
  assert.equal(controller.snapshot().sourceSample, stop);
  assert.equal(controller.snapshot().atBoundary, true);
  assert.equal(await controller.playDomain('sprite-315', 1, 435), false);
  await controller.close();
});

test('every main hard stop uses exact block-prefix duration; final frame remains after MP3 EOF', async () => {
  const {controller, context} = fixture();
  const frames = [1, ...P061_MAIN_STOP_FRAMES];
  for (let index = 0; index < P061_MAIN_STOP_FRAMES.length; index++) {
    const from = frames[index];
    const to = frames[index + 1];
    context.currentTime = 100 * index;
    assert.equal(await controller.playDomain('sprite-315', from, to), true);
    const start = p061SourceSampleAtFrame('sprite-315', from);
    const end = p061SourceSampleAtFrame('sprite-315', to);
    const node = context.nodes[index];
    near(node.starts[0][1], start / 22050);
    near(node.starts[0][2], (end - start) / 22050);
    context.currentTime += (to - from) / 12 + 0.1;
    const snapshot = controller.snapshot();
    assert.equal(snapshot.frame, to);
    assert.equal(snapshot.sourceSample, end);
    assert.equal(snapshot.phase, to === 879 ? 'ended' : 'paused');
    assert.equal(snapshot.atBoundary, true);
  }
  assert.equal(P061_AUDIO_DOMAINS['sprite-315'].lastBlockFrame, 875);
  assert.equal(p061SourceSampleAtFrame('sprite-315', 875),
    p061SourceSampleAtFrame('sprite-315', 879));
  await controller.close();
});

test('feedback takes the single node, verifies stereo, and main resumes same decoded buffer', async () => {
  const {controller, context, loads} = fixture();
  context.currentTime = 3;
  assert.equal(await controller.playDomain('sprite-315', 435, 573), true);
  context.currentTime = 4;
  const mainSample = controller.snapshot().sourceSample;
  assert.equal(await controller.playDomain('sprite-284', 1, 26), true);
  assert.equal(context.nodes[0].stops, 1);
  assert.deepEqual(loads, ['sprite-315', 'sprite-284']);
  near(context.nodes[1].starts[0][0], 4 + 1 / 12);
  near(context.nodes[1].starts[0][2], P061_AUDIO_DOMAINS['sprite-284'].decodedSamples / 22050);
  assert.equal(controller.snapshot().domain, 'sprite-284');
  assert.equal(await controller.playDomain('sprite-315', 435, 573), true);
  assert.equal(context.nodes[1].stops, 1);
  assert.deepEqual(loads, ['sprite-315', 'sprite-284']);
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
  const playing = controller.playDomain('sprite-315', 1, 435);
  await new Promise<void>(done => setImmediate(done));
  assert.equal(controller.snapshot().phase, 'loading');
  controller.pause();
  assert.equal(seen[0].aborted, true);
  load.resolve(buffer(P061_AUDIO_DOMAINS['sprite-315']));
  assert.equal(await playing, false);
  assert.equal(context.nodes.length, 0);
  controller.reset();
  assert.equal(controller.snapshot().domain, null);
  await controller.close();
  assert.equal(controller.snapshot().phase, 'closed');
});

test('context interruption pauses; source shape, bounds, and volume fail closed', async () => {
  const {controller, context} = fixture(async binding =>
    binding.id === 'sprite-284' ? buffer(binding, 1) : buffer(binding));
  for (const [from, to] of [[0, 435], [1, 434], [1, 573], [435, 700],
    [573, 435], [1, 880]])
    assert.throws(() => controller.playDomain('sprite-315', from, to), /P061_AUDIO_WINDOW/);
  assert.throws(() => controller.playDomain('sprite-284', 1, 25), /P061_AUDIO_WINDOW/);
  for (const value of [-1, 1.1, NaN]) assert.throws(() => controller.setVolume(value), /P061_AUDIO_VOLUME/);
  controller.setVolume(0.4);
  assert.equal(await controller.playDomain('sprite-315', 1, 435), true);
  assert.equal(context.gain.gain.value, 0.4);
  context.currentTime = 2;
  context.interrupt();
  assert.equal(controller.snapshot().phase, 'paused');
  assert.equal(context.nodes[0].stops, 1);
  assert.equal(await controller.playDomain('sprite-284', 1, 26), false);
  assert.equal(controller.snapshot().phase, 'error');
  assert.equal(controller.snapshot().error, 'P061_AUDIO_DECODE');
  await controller.close();
});
