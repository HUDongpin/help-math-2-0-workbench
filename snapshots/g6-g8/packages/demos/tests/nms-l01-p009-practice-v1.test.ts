import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P009SourceClockV1, type P009AudioPlan, type P009Picture} from '../src/nms-l01-p009-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p009';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(40 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P009AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
  decoder: {...c.decoder, sourceBytes: raws[i].length, sourceSha256: hash(raws[i]), pcmSha256: hash(new Uint8Array(pcms[i].buffer))}}))};
const payloads = () => new Map(plan.clips.map((c, i) => [c.frameDomain, raws[i].slice().buffer]));
const user = {activation: 'user' as const, reducedMotion: false};
const near = (a: number, b: number) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
class Context extends EventTarget {
  currentTime = 0; state = 'suspended'; sampleRate = 22050; destination = {}; resumeWait?: Promise<void>;
  nodes: {buffer: unknown; onended: null | (() => void); starts: number[][]; stops: number; disconnected: boolean;
    connect(): void; disconnect(): void; start(...args: number[]): void; stop(): void}[] = [];
  createGain() { return {gain: {setValueAtTime() {}}, connect() {}, disconnect() {}}; }
  createBufferSource() {
    const n = {buffer: null, onended: null, starts: [] as number[][], stops: 0, disconnected: false, connect() {},
      disconnect() { this.disconnected = true; }, start(...args: number[]) { this.starts.push(args); }, stop() { this.stops++; }};
    this.nodes.push(n); return n;
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    const i = raws.findIndex(r => r[0] === new Uint8Array(bytes)[0]), pcm = pcms[i];
    return {sampleRate: 22050, numberOfChannels: 1, length: pcm.length, getChannelData: () => pcm};
  }
  async resume() { if (this.resumeWait) await this.resumeWait; this.state = 'running'; }
  async close() { this.state = 'closed'; }
}
async function fixture(seed = 0) {
  const context = new Context(), pictures: P009Picture[] = [];
  const clock = new P009SourceClockV1(plan, {seed, createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
test('source choices and original host branch identities remain exact', () => {
  assert.deepEqual(PRACTICE.choices.map(c => [c.id, c.value, c.correct]), [['AnsBtn1', 0, false], ['AnsBtn2', -10, true], ['AnsBtn3', 10, false]]);
  assert.equal(PRACTICE.prompt, 'Click the opposite integer of 10.');
  assert.deepEqual(PLAN.branches.map(b => [b.instanceName, b.sourceCharacterId, b.frameCount]), [
    ['Mc_Wrong_Feed1', 86, 30], ['Mc_Wrong_Feed2', 62, 28], ['Mc_Wrong_Feed3', 74, 29],
    ['Mc_Right_Feed1', 128, 27], ['Mc_Right_Feed2', 145, 28], ['Mc_Right_Feed3', 157, 25], ['Mc_Right_Feed4', 171, 32],
  ]);
  assert.equal(PLAN.clips.find(c => c.frameDomain === 'sprite-157')?.latencySamples, 0);
  assert.equal(PLAN.clips.find(c => c.frameDomain === 'sprite-157')?.decoder.decodedSamples, 23870);
  assert.deepEqual(PRACTICE.wrongFeedbackTokens.filter(t => t.kind === 'link').map(t => 'entryId' in t ? t.entryId : null), ['opposite-integers', 'value', 'distance', 'direction']);
});
test('intro schedules only frames9..38 and waits39 even without timely visual ticks', async () => {
  const {clock, context} = await fixture(); await clock.play(user);
  assert.equal(context.nodes.length, 1); const start = context.nodes[0].starts[0];
  near(start[0], 8 / 12); near(start[1], 1673 / 22050); near(start[2], 30 / 12);
  context.currentTime = 38 / 12 - .001; assert.equal(clock.snapshot().picture.mainFrame, 38);
  context.currentTime = 100; const s = clock.snapshot();
  assert.equal(s.phase, 'question'); assert.equal(s.picture.mainFrame, 39); assert(s.picture.interaction.choicesEnabled);
  assert.equal(s.audioNodePlaying, false); assert.equal(s.correctAnswer, false); assert.equal(s.lessonCompleted, false);
  assert.equal((await clock.play(user)).reason, 'source-waiting-for-input'); assert.equal(context.nodes.length, 1); await clock.close();
});
test('all three wrong branches hold22, close into23 and restore all choices at their own terminal', async () => {
  for (const [seed, domain, last] of [[0, 'sprite-86', 30], [1, 'sprite-62', 28], [2, 'sprite-74', 29]] as const) {
    const {clock, context} = await fixture(seed); clock.inspect(39);
    assert((await clock.choose(seed % 2 ? 'AnsBtn1' : 'AnsBtn3', user)).accepted);
    assert.equal(clock.snapshot().selectedBranch?.frameDomain, domain);
    assert.equal(clock.snapshot().picture.interaction.choicesEnabled, false);
    assert.equal((await clock.choose('AnsBtn2', user)).accepted, false);
    const start = context.nodes[0].starts[0]; near(start[0], 0); near(start[1], 1673 / 22050); near(start[2], 20 / 12);
    assert.equal((await clock.closeWrong(user)).accepted, false);
    context.currentTime = 20 / 12; assert.equal(clock.snapshot().phase, 'wrong-wait');
    assert.equal(clock.snapshot().picture.interaction.feedbackFrame, 22); assert(clock.snapshot().picture.interaction.popupVisible);
    context.currentTime = 100; assert.equal(clock.snapshot().phase, 'wrong-wait');
    clock.pause(); await clock.play(user); assert.equal(context.nodes.length, 1); assert.equal(clock.snapshot().phase, 'wrong-wait');
    assert((await clock.closeWrong(user)).accepted); assert.equal(clock.snapshot().picture.interaction.feedbackFrame, 23);
    const closing = context.nodes[1].starts[0]; near(closing[0], 100); near(closing[1], (1673 + 21 * 22050 / 12) / 22050);
    assert(closing[2] <= (last - 23) / 12); assert.equal(clock.snapshot().picture.interaction.popupVisible, false);
    context.currentTime = 100 + (last - 23) / 12; assert.equal(clock.snapshot().phase, 'question');
    assert(clock.snapshot().picture.interaction.choicesEnabled); assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId, null);
    assert.equal(clock.snapshot().attempts, 1); assert.equal(clock.snapshot().correctAnswer, false); await clock.close();
  }
});
test('all four right branches pre-schedule native outro40 and terminate at host79', async () => {
  for (const [seed, domain, last] of [[0, 'sprite-128', 27], [1, 'sprite-145', 28], [2, 'sprite-157', 25], [3, 'sprite-171', 32]] as const) {
    const {clock, context} = await fixture(seed); clock.inspect(39); await clock.choose('AnsBtn2', user);
    assert.equal(context.nodes.length, 2, 'feedback and future main source must both be scheduled before any tick');
    const s = clock.snapshot(); assert.equal(s.selectedBranch?.frameDomain, domain); assert(s.correctAnswer);
    assert.equal(s.picture.mainFrame, 39); assert.equal(s.picture.interaction.choicesEnabled, false);
    const first = context.nodes[0].starts[0], outro = context.nodes[1].starts[0];
    near(first[0], seed === 0 || seed === 3 ? 1 / 12 : 0);
    near(first[1], seed === 2 ? 1 / 12 : 1673 / 22050);
    near(outro[0], (last - 2) / 12); near(outro[1], (1673 + 31 * 22050 / 12) / 22050);
    near(outro[2], (119232 - 1673 - 31 * 22050 / 12) / 22050);
    context.currentTime = (last - 2) / 12 - .001; assert.equal(clock.snapshot().picture.interaction.feedbackFrame, last - 1);
    context.currentTime = (last - 2) / 12; assert.equal(clock.snapshot().picture.mainFrame, 40);
    assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId, null); assert.equal(clock.snapshot().audioDomain, 'sprite-197');
    context.currentTime += 39 / 12; assert.equal(clock.snapshot().phase, 'ended'); assert.equal(clock.snapshot().picture.mainFrame, 79);
    context.currentTime += 60; assert.equal(clock.snapshot().picture.mainFrame, 79); assert.equal(clock.snapshot().audioNodePlaying, false);
    assert.equal((await clock.choose('AnsBtn1', user)).accepted, false); await clock.close();
  }
});
test('source ADPCM normalization keeps the actual third correct branch and ends before its terminal', async () => {
  const {clock, context} = await fixture(2); clock.inspect(39); await clock.choose('AnsBtn2', user);
  const node = context.nodes[0]; near(node.starts[0][1], 1 / 12); near(node.starts[0][2], 23870 / 22050 - 1 / 12);
  context.currentTime = 23870 / 22050 - 1 / 12; assert.equal(clock.snapshot().audioDomain, null);
  assert.equal(clock.snapshot().picture.interaction.feedbackCharacterId, 157); assert.equal(clock.snapshot().phase, 'playing');
  context.currentTime = 23 / 12; assert.equal(clock.snapshot().audioDomain, 'sprite-197'); await clock.close();
});
test('pause cancels future main narration and resume preserves the remaining native delay', async () => {
  const {clock, context} = await fixture(); clock.inspect(39); await clock.choose('AnsBtn2', user);
  context.currentTime = .5; clock.pause(); assert(context.nodes.every(n => n.stops === 1 && n.disconnected));
  context.currentTime = 100; await clock.play(user); assert.equal(context.nodes.length, 4);
  near(context.nodes[2].starts[0][0], 100); near(context.nodes[3].starts[0][0], 100 + 25 / 12 - .5);
  clock.replay(); assert(context.nodes.every(n => n.stops === 1)); assert.equal(clock.snapshot().phase, 'ready');
  assert.equal(clock.snapshot().picture.mainFrame, 1); assert.equal(clock.snapshot().attempts, 0); assert.equal(clock.snapshot().selectedBranch, null);
  assert.equal(clock.snapshot().correctAnswer, false); assert.equal(clock.snapshot().inspectionMode, false); await clock.close();
});
test('retries enumerate host branches and Replay restores the original seed and counters', async () => {
  const {clock, context} = await fixture(); clock.inspect(39);
  for (let i = 0; i < 6; i++) {
    await clock.choose('AnsBtn1', user); assert.equal(clock.snapshot().selectedBranch?.index, i % 3 + 1);
    const last = clock.snapshot().selectedBranch!.frameCount;
    context.currentTime += 20 / 12; assert.equal(clock.snapshot().phase, 'wrong-wait');
    await clock.closeWrong(user); context.currentTime += (last - 23) / 12; assert.equal(clock.snapshot().phase, 'question');
  }
  await clock.choose('AnsBtn2', user); assert.equal(clock.snapshot().selectedBranch?.index, 3);
  clock.replay(); clock.inspect(39); await clock.choose('AnsBtn2', user); assert.equal(clock.snapshot().selectedBranch?.index, 1); await clock.close();
});
test('pausing a glossary at wrong-wait cannot skip Close or reset attempts', async () => {
  const {clock, context} = await fixture(); clock.inspect(39); await clock.choose('AnsBtn1', user);
  context.currentTime = 20 / 12; assert.equal(clock.snapshot().phase, 'wrong-wait');
  for (let i = 0; i < 4; i++) { clock.pause(); await clock.play(user); assert.equal(clock.snapshot().phase, 'wrong-wait'); assert.equal(clock.snapshot().attempts, 1); }
  assert.equal(context.nodes.length, 1); await clock.close();
});
test('inspection cannot manufacture a correct answer and reduced motion does not autoplay', async () => {
  const {clock, context} = await fixture(); assert.equal((await clock.play({activation: 'automatic', reducedMotion: true})).accepted, false);
  assert.equal(context.nodes.length, 0); assert.equal(clock.inspect(80).accepted, false); assert.equal(clock.inspect(NaN).accepted, false);
  clock.inspect(79); assert.equal(clock.snapshot().correctAnswer, false); assert.equal(clock.snapshot().inspectionMode, true);
  assert.equal(clock.snapshot().lessonCompleted, false); assert.equal((await clock.play(user)).accepted, false);
  clock.replay(); await clock.play(user); assert.equal(clock.snapshot().inspectionMode, false); assert.equal(context.nodes.length, 1); await clock.close();
});
test('pending native starts are invalidated by pause, Replay and unmount', async () => {
  for (const action of ['pause', 'replay', 'close'] as const) {
    const {clock, context} = await fixture(); let release!: () => void;
    context.resumeWait = new Promise(r => release = r); const pending = clock.play(user); await clock[action](); release();
    assert.equal((await pending).accepted, false); assert.equal(context.nodes.length, 0); await clock.close();
  }
});
test('altered source bytes, altered native PCM and failed drawing commit fail closed', async () => {
  for (const mode of ['bytes', 'pcm', 'paint']) {
    const context = new Context(), p = mode === 'pcm' ? {...plan, clips: plan.clips.map((c, i) => i ? c : {...c, decoder: {...c.decoder, pcmSha256: '0'.repeat(64)}})} : plan;
    const clock = new P009SourceClockV1(p, {createContext: () => context as unknown as AudioContext, commitPicture: () => mode !== 'paint'});
    const b = payloads(); if (mode === 'bytes') b.set('sprite-157', Uint8Array.of(9).buffer);
    assert.equal((await clock.prepare(b)).accepted, false); assert.equal(clock.snapshot().phase, 'failed'); assert.equal(context.nodes.length, 0);
    if (mode !== 'bytes') assert.equal(context.state, 'closed'); await clock.close();
  }
  assert.throws(() => new P009SourceClockV1({...plan, branches: [...plan.branches.slice(1), plan.branches[0]]}, {commitPicture: () => true}), /BRANCH_MISMATCH/);
  assert.throws(() => new P009SourceClockV1(plan, {seed: -1, commitPicture: () => true}), /INVALID_SEED/);
});
