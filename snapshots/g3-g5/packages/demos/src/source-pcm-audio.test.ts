import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {SourcePcmAudio} from './source-pcm-audio';
import {LessonActivityAudioController, type LessonActivityAudioState} from './lesson-activity-audio';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';

class BufferNode {
  buffer: unknown = null;
  onended: ((event: Event) => void) | null = null;
  readonly starts: number[][] = [];
  stops = 0;
  disconnected = false;
  connect() {}
  disconnect() {this.disconnected = true;}
  start(...values: number[]) {this.starts.push(values);}
  stop() {this.stops++;}
  finish() {this.onended?.(new Event('ended'));}
}
class PcmContext {
  static readonly created: PcmContext[] = [];
  state = 'running';
  currentTime = 0;
  readonly destination = {};
  readonly nodes: BufferNode[] = [];
  constructor() {PcmContext.created.push(this);}
  async resume() {this.state = 'running';}
  async close() {this.state = 'closed';}
  createBuffer(channels: number, frames: number) {
    const samples = Array.from({length: channels}, () => new Float32Array(frames));
    return {getChannelData(channel: number) {return samples[channel]!;}};
  }
  createGain() {return {gain: {value: 1}, connect() {}, disconnect() {}};}
  createBufferSource() {const node = new BufferNode(); this.nodes.push(node); return node;}
}
async function flush() {for (let n = 0; n < 12; n++) await Promise.resolve();}
function setup() {
  const priorAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const priorFetch = globalThis.fetch;
  const bytes = Buffer.alloc(144576 * 4); // Exact reported G3 frame-count/rate ratio.
  for (let i = 0; i < 144576; i++) bytes.writeFloatLE(Math.sin(i / 16) * .1, i * 4);
  const asset = {source: '/test/source.f32le', sha256: createHash('sha256').update(bytes).digest('hex'), channels: 1, sampleRate: 22050, frames: 144576};
  Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true, value: PcmContext});
  globalThis.fetch = (async () => new Response(new Uint8Array(bytes), {status: 200})) as typeof fetch;
  const owned: SourcePcmAudio[] = [];
  const make = () => {const audio = new SourcePcmAudio('/test/source.mp3', asset); owned.push(audio); return audio;};
  return {asset, make, contexts: PcmContext.created, async cleanup() {
    for (const audio of owned) audio.dispose();
    await flush();
    globalThis.fetch = priorFetch;
    if (priorAudioContext) Object.defineProperty(globalThis, 'AudioContext', priorAudioContext);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
    PcmContext.created.length = 0;
  }};
}
test('G3 frame86 seek beyond the decoded end completes without replaying offset zero', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make();
  const requested = (86 - 7) / 12;
  assert(requested > h.asset.frames / h.asset.sampleRate);
  const events: string[] = [];
  for (const name of ['play', 'playing', 'ended']) audio.addEventListener(name, () => events.push(name));
  audio.currentTime = requested;
  await audio.play();
  assert.equal(audio.currentTime, h.asset.frames / h.asset.sampleRate);
  assert.equal(audio.paused, true);
  assert.deepEqual(events, ['ended']);
  assert.equal(h.contexts.flatMap(context => context.nodes).length, 0);
});
test('exact end also completes, while an explicit zero seek starts a legitimate Replay', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make(); let ended = 0;
  audio.addEventListener('ended', () => ended++);
  audio.currentTime = audio.duration; await audio.play();
  assert.equal(ended, 1); assert.equal(audio.paused, true);
  assert.equal(h.contexts.flatMap(context => context.nodes).length, 0);
  audio.currentTime = 0; await audio.play();
  const node = h.contexts.at(-1)!.nodes.at(-1)!;
  assert.equal(node.starts.length, 1);
  assert.equal(node.starts[0]![1], 0);
  assert.equal(node.starts[0]![2], audio.duration);
  assert.equal(audio.paused, false);
});
test('natural completion stays ended until an explicit replay seek is supplied', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make();
  await audio.play(); const context = h.contexts.at(-1)!, first = context.nodes[0]!;
  context.currentTime = audio.duration; first.finish();
  assert.equal(audio.paused, true); assert.equal(audio.currentTime, audio.duration);
  await audio.play(); assert.equal(context.nodes.length, 1);
  audio.currentTime = 0; await audio.play(); assert.equal(context.nodes.length, 2);
  assert.equal(context.nodes[1]!.starts[0]![1], 0);
});
test('the last valid source sample is still playable with its exact remaining duration', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make();
  const offset = audio.duration - 1 / h.asset.sampleRate; audio.currentTime = offset; await audio.play();
  const node = h.contexts.at(-1)!.nodes[0]!;
  assert.equal(node.starts[0]![1], offset);
  assert.equal(node.starts[0]![2], audio.duration - offset);
  assert(node.starts[0]![2]! > 0);
});
test('seeking a playing stream past its end stops the old node and creates no replacement', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make(); await audio.play();
  const context = h.contexts.at(-1)!, node = context.nodes[0]!; context.currentTime = .25;
  let ended = 0; audio.addEventListener('ended', () => ended++);
  audio.currentTime = audio.duration + 1; await flush();
  assert.equal(node.stops, 1); assert.equal(node.disconnected, true);
  assert.equal(context.nodes.length, 1); assert.equal(audio.currentTime, audio.duration);
  assert.equal(audio.paused, true); assert.equal(ended, 1);
});
test('ordinary pause and resume preserve the offset and a cancelled pending play cannot start', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make(); await audio.play();
  const context = h.contexts.at(-1)!; context.currentTime = .25; audio.pause();
  assert.equal(audio.currentTime, .25); await audio.play();
  assert.equal(context.nodes[1]!.starts[0]![1], .25);
  audio.pause(); const pending = audio.play(); audio.pause();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
  assert.equal(context.nodes.length, 2);
});
test('an exhausted source activity publishes ended rather than playing or blocked', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make(); await audio.prepareForTimeline();
  const states: LessonActivityAudioState[] = [];
  const controller = new LessonActivityAudioController(() => audio, state => states.push(state));
  t.after(() => controller.dispose());
  const definition: LessonTextActivityDefinition = {id: 'source-tail', parentFrames: [86], frameDomain: 'sprite-10', startFrame: 80, endFrame: 90, fps: 12,
    audio: {source: '/test/source.mp3', sha256: 'a'.repeat(64), firstFrame: 1, lastFrame: 90, language: 'shared'}};
  const activity: LessonTextActivitySnapshot = {id: 'source-tail', frameDomain: 'sprite-10', revision: 1, frame: 80, status: 'playing'};
  controller.update({identity: 'fixture', activity, definitions: [definition], enabled: true, paused: false, language: 'en', volume: .8});
  await flush();
  assert.equal(states.at(-1)?.status, 'ended');
  assert(!states.some(state => state.status === 'playing' || state.status === 'blocked'));
  assert.equal(h.contexts.flatMap(context => context.nodes).length, 0);
});
test('same-instance activity replay resets to zero and disposes all source context owners', async t => {
  const h = setup(); t.after(() => h.cleanup()); const audio = h.make(); await audio.prepareForTimeline();
  const states: LessonActivityAudioState[] = [], controller = new LessonActivityAudioController(() => audio, state => states.push(state));
  t.after(() => controller.dispose());
  const definition: LessonTextActivityDefinition = {id: 'cue', parentFrames: [1], frameDomain: 'sprite-10', startFrame: 1, endFrame: 80, fps: 12,
    audio: {source: '/test/source.mp3', sha256: 'b'.repeat(64), firstFrame: 1, lastFrame: 80, language: 'shared'}};
  const activity: LessonTextActivitySnapshot = {id: 'cue', frameDomain: 'sprite-10', revision: 1, frame: 1, status: 'playing'};
  const base = {identity: 'fixture', definitions: [definition], enabled: true, paused: false, language: 'en' as const, volume: .8};
  controller.update({...base, activity}); await flush();
  const context = h.contexts.at(-1)!, first = context.nodes[0]!; context.currentTime = audio.duration; first.finish();
  controller.update({...base, activity: {...activity, revision: 2}}); await flush();
  assert.equal(context.nodes.length, 2); assert.equal(context.nodes[1]!.starts[0]![1], 0);
  assert.equal(states.at(-1)?.status, 'playing');
  controller.dispose(); await flush(); assert.equal(context.state, 'closed');
});
