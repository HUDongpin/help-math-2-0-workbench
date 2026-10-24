import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedNarrationPlan, nextNarrationRange, LessonManualNarrationController, type BoundedNarrationPlan, type ManualNarrationStatus} from './lesson-manual-narration';

const sha = 'a'.repeat(64), context = {frameDomain: 'sprite-341', lang: 'en' as const, scenario: 'source-static-frame', seed: 0};
const cue = {id: 'main', source: '/lesson-audio/main.mp3', sha256: sha, frame: 7, endFrame: 393, frameDomain: 'sprite-341', language: 'en' as const};
const intro = {firstFrame: 1, endFrameExclusive: 382};
test('TI003 introductory stream stops before the question hold and discrete randomized questions never expose later stream', () => {
  const plan = boundedNarrationPlan([cue], intro, 12, context)!;
  assert.deepEqual(plan.parts[0], {id: 'main', source: cue.source, sha256: sha, offsetSeconds: 0, delaySeconds: 0, durationSeconds: 375 / 12});
  assert.equal(plan.durationSeconds, 375 / 12);
  for (let question = 383; question <= 393; question++) assert.deepEqual(nextNarrationRange(intro, {toFrame: question, stopFrame: question}), intro);
});
test('continuous source continuation replays only its revealed segment, preserving cue offset and source removal', () => {
  const range = nextNarrationRange(intro, {toFrame: 400, stopFrame: 480});
  const plan = boundedNarrationPlan([{...cue, frame: 390, endFrame: 460}], range, 12, context)!;
  assert.equal(plan.parts[0].offsetSeconds, 10 / 12); assert.equal(plan.parts[0].durationSeconds, 60 / 12);
  assert.equal(boundedNarrationPlan([cue], range, 12, context), null);
});
test('locale, scenario, domain, hash and frame validation fail closed', () => {
  for (const patch of [{lang: 'es' as const}, {frameDomain: 'root'}]) assert.equal(boundedNarrationPlan([cue], intro, 12, {...context, ...patch}), null);
  for (const patch of [{sha256: ''}, {source: 'https://example.com/a.mp3'}, {frame: 0}, {endFrame: 7}]) assert.equal(boundedNarrationPlan([{...cue, ...patch}], intro, 12, context), null);
  assert.equal(boundedNarrationPlan([{...cue, scenario: 'other'}], intro, 12, context), null);
  assert.equal(boundedNarrationPlan([cue], intro, 0, context), null);
  assert.equal(boundedNarrationPlan([cue], {...intro, firstFrame: 382}, 12, context), null);
});

function fixture(options: {badHash?: boolean; blocked?: boolean; fetchWait?: Promise<void>} = {}) {
  const events: ManualNarrationStatus[] = [], starts: number[][] = [], nodes: {onended: null | (() => void); stopped: boolean; disconnected: boolean; start: (...args: number[]) => void; stop: () => void; connect: () => void; disconnect: () => void}[] = [];
  const gain = {gain: {value: 1}, connect() {}, disconnect() {}};
  let fetches = 0;
  const audioContext = {state: 'running', currentTime: 10, destination: {}, createGain: () => gain,
    resume: async () => {if (options.blocked) throw new Error('blocked');}, close: async () => {audioContext.state = 'closed';},
    createBuffer: (channels: number, frames: number, sampleRate: number) => ({duration: frames / sampleRate, getChannelData: () => new Float32Array(frames)}), createBufferSource: () => {
      const node = {onended: null as null | (() => void), stopped: false, disconnected: false, start: (...args: number[]) => starts.push(args), stop: () => {node.stopped = true;}, connect() {}, disconnect: () => {node.disconnected = true;}};
      nodes.push(node); return node;
    }};
  const controller = new LessonManualNarrationController(status => events.push(status), {
    createContext: () => audioContext as unknown as AudioContext,
    fetch: (async () => {fetches++; await options.fetchWait; return {ok: true, arrayBuffer: async () => new ArrayBuffer(8000 * 60 * 4)};}) as unknown as typeof fetch,
    digest: async () => options.badHash ? 'b'.repeat(64) : sha,
  });
  const plan: BoundedNarrationPlan = {parts: [{id: 'part', source: cue.source, sha256: sha, delaySeconds: 0, offsetSeconds: 5, durationSeconds: 2, pcm: {source: '/audio.f32le', sha256: sha, sampleRate: 8000, channels: 1, frames: 8000 * 60}}], durationSeconds: 2};
  const update = (patch = {}) => controller.update({identity: 'page:0:en', plan, volume: 0.6, paused: false, ...patch});
  update(); return {controller, update, plan, audioContext, events, starts, nodes, gain, fetches: () => fetches};
}
test('media schedules an exact bounded interval, volume follows the host, and ended merely reports idle', async () => {
  const f = fixture(); assert.equal(await f.controller.play(), true);
  assert.deepEqual(f.starts, [[10, 5, 2]]); assert.equal(f.gain.gain.value, 0.6);
  f.update({volume: 0}); assert.equal(f.gain.gain.value, 0);
  f.nodes[0].onended!(); assert.equal(f.events.at(-1), 'idle'); assert.equal(f.nodes[0].disconnected, true);
  assert.equal(await f.controller.play(), true); assert.equal(f.fetches(), 1); assert.deepEqual(f.starts[1], [10, 5, 2]);
});
test('host pause cancels scheduled audio and resume preserves exact remaining duration; explicit stop resets it', async () => {
  const f = fixture(); await f.controller.play(); f.audioContext.currentTime = 10.75; f.update({paused: true});
  assert.equal(f.nodes[0].stopped, true); assert.equal(f.events.at(-1), 'paused');
  assert.equal(await f.controller.play(), false); f.update({paused: false});
  await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(f.starts[1], [10.75, 5.75, 1.25]);
  f.controller.stop(); assert.equal(f.nodes[1].stopped, true); await f.controller.play(); assert.deepEqual(f.starts[2], [10.75, 5, 2]);
});
test('page or replay changes invalidate a pending fetch before any audio node is scheduled', async () => {
  let release!: () => void; const f = fixture({fetchWait: new Promise(resolve => {release = resolve;})});
  const play = f.controller.play(); await Promise.resolve(); f.update({identity: 'next-page:0:en', plan: null}); release();
  assert.equal(await play, false); assert.equal(f.starts.length, 0); assert.equal(f.events.at(-1), 'idle');
});
test('wrong bytes, blocked context, removal and strict effect remount remain distinguishable and cancelable', async () => {
  const bad = fixture({badHash: true}); assert.equal(await bad.controller.play(), false); assert.equal(bad.events.at(-1), 'error'); assert.equal(bad.starts.length, 0);
  const blocked = fixture({blocked: true}); assert.equal(await blocked.controller.play(), false); assert.equal(blocked.events.at(-1), 'blocked'); assert.equal(blocked.fetches(), 0);
  const f = fixture(); await f.controller.play(); f.controller.dispose(); assert.equal(f.nodes[0].stopped, true); assert.equal(f.audioContext.state, 'closed');
  f.audioContext.state = 'running'; f.update(); assert.equal(await f.controller.play(), true);
});
