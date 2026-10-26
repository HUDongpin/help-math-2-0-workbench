import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {P016SourceClockV1, type P016AudioPlan, type P016Picture} from '../src/nms-l01-p016-source-clock-v1';
import {PLAN, PRACTICE} from '../src/timelines/shared-nms002-l01-p016';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const raws = PLAN.clips.map((_, i) => Uint8Array.of(40 + i, 100 + i, 200 - i));
const pcms = PLAN.clips.map(c => new Float32Array(c.decoder.decodedSamples));
const plan: P016AudioPlan = {...PLAN, clips: PLAN.clips.map((c, i) => ({...c,
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
  const context = new Context(), pictures: P016Picture[] = [];
  const clock = new P016SourceClockV1(plan, {seed, createContext: () => context as unknown as AudioContext,
    commitPicture: p => { pictures.push(p); return true; }});
  assert.equal(clock.snapshot().picture.mainFrame, 1);
  assert((await clock.prepare(payloads())).accepted); return {clock, context, pictures};
}
test('opposite of5 preserves signed correct answer and distinct0/+5 wrong choices', () => {
  assert.equal(PRACTICE.prompt, 'Click the opposite integer of 5.');
  assert.deepEqual(PRACTICE.choices.map(c => [c.id, c.value, c.correct]), [['AnsBtn1', -5, true], ['AnsBtn2-zero', 0, false], ['AnsBtn2-plus5', 5, false]]);
  assert.deepEqual(PRACTICE.sourceChoices.map(c => [c.id, c.sourceCharacterId]), [['AnsBtn1', 18], ['AnsBtn2', 17]]);
  assert.deepEqual(PLAN.branches.filter(b => b.selectable).map(b => [b.kind, b.index, b.sourceCharacterId]), [['wrong', 1, 132], ['wrong', 2, 144], ['wrong', 3, 157], ['right', 2, 50], ['right', 3, 86], ['right', 4, 58]]);
  assert.deepEqual(PLAN.feedbackSelection.rightIndexMap, {'1': 2, '2': 2, '3': 3, '4': 4});
  assert.deepEqual(PRACTICE.wrongFeedbackTokens.filter(t => t.kind === 'link').map(t => 'entryId' in t ? t.entryId : null), ['opposite-integers', 'integers', 'distance', 'number-line', 'direction']);
});
test('intro schedules only source10..48 and holds49 under delayed visual ticks', async () => {
  const {clock, context} = await fixture(); await clock.play(user);
  near(context.nodes[0].starts[0][0], 9 / 12); near(context.nodes[0].starts[0][1], 1673 / 22050); near(context.nodes[0].starts[0][2], 39 / 12);
  context.currentTime = 4 - .001; assert.equal(clock.snapshot().picture.mainFrame, 48);
  context.currentTime = 100; const s = clock.snapshot(); assert.equal(s.phase, 'question'); assert.equal(s.picture.mainFrame, 49); assert(s.picture.interaction.choicesEnabled);
  assert.equal(s.closedWrongCount, 0); assert.equal(s.quizResolved, false); assert.equal(s.correctAnswer, false); assert.equal(s.audioNodePlaying, false);
  await clock.play(user); assert.equal(context.nodes.length, 1); await clock.close();
});
test('each wrong variant holds its own frame and Close24 increments only at its terminal', async () => {
  for (const [seed, domain, last, hold] of [[0, 'sprite-132', 29, 23], [1, 'sprite-144', 29, 21], [2, 'sprite-157', 28, 21]] as const) {
    const {clock, context} = await fixture(seed); clock.inspect(49); await clock.choose(seed % 2 ? 'AnsBtn2-zero' : 'AnsBtn2-plus5', user);
    assert.equal(clock.snapshot().selectedBranch?.frameDomain, domain); assert.equal((await clock.choose('AnsBtn1', user)).accepted, false); assert.equal((await clock.closeWrong(user)).accepted, false);
    near(context.nodes[0].starts[0][2], (hold - 2) / 12); context.currentTime = 100;
    assert.equal(clock.snapshot().phase, 'wrong-wait'); assert.equal(clock.snapshot().picture.interaction.feedbackFrame, hold); assert.equal(clock.snapshot().closedWrongCount, 0);
    for (let i = 0; i < 3; i++) { clock.pause(); await clock.play(user); assert.equal(clock.snapshot().phase, 'wrong-wait'); }
    assert.equal(context.nodes.length, 1); assert((await clock.closeWrong(user)).accepted); assert.equal(clock.snapshot().picture.interaction.feedbackFrame, 24);
    assert.equal((await clock.closeWrong(user)).accepted, false, 'duplicate Close must not restart or recount');
    const n = context.nodes[1].starts[0]; near(n[0], 100); near(n[1], (1673 + 22 * 22050 / 12) / 22050); assert(n[2] <= (last - 24) / 12);
    assert.equal(clock.snapshot().picture.interaction.popupVisible, seed !== 0, 'popup1 removes24 while popup2/3 fade through28');
    context.currentTime = 100 + (last - 24) / 12 - .001; assert.equal(clock.snapshot().closedWrongCount, 0);
    context.currentTime += .001; const s = clock.snapshot(); assert.equal(s.phase, 'question'); assert.equal(s.closedWrongCount, 1); assert(s.picture.interaction.choicesEnabled); assert.equal(s.quizResolved, false);
    context.currentTime += 100; assert.equal(clock.snapshot().closedWrongCount, 1); await clock.close();
  }
});
test('second completed wrong response schedules main50 before ticks and stops73 without claiming a correct answer', async () => {
  for (const seed of [0, 1, 2]) {
    const {clock, context} = await fixture(seed); await clock.play(user); context.currentTime += 4; assert.equal(clock.snapshot().phase, 'question');
    for (let attempt = 0; attempt < 2; attempt++) {
      await clock.choose(attempt ? 'AnsBtn2-zero' : 'AnsBtn2-plus5', user); const b = clock.snapshot().selectedBranch!;
      context.currentTime += (b.waitFrame! - 2) / 12; assert.equal(clock.snapshot().phase, 'wrong-wait');
      const before = context.nodes.length, start = context.currentTime; await clock.closeWrong(user);
      assert.equal(context.nodes.length - before, attempt ? 2 : 1);
      if (attempt) {
        const outro = context.nodes.at(-1)!.starts[0]; near(outro[0], start + (b.frameCount - 24) / 12); near(outro[1], (1673 + 40 * 22050 / 12) / 22050);
        clock.pause(); assert.equal(clock.snapshot().closedWrongCount, 1); context.currentTime += 10; await clock.play(user);
      }
      context.currentTime += (b.frameCount - 24) / 12; const s = clock.snapshot();
      if (!attempt) { assert.equal(s.phase, 'question'); assert.equal(s.closedWrongCount, 1); }
      else { assert.equal(s.picture.mainFrame, 50); assert.equal(s.quizResolved, true); assert.equal(s.closedWrongCount, 0); assert.equal(s.correctAnswer, false); assert.equal(s.audioDomain, 'sprite-158'); }
    }
    context.currentTime += 23 / 12; assert.equal(clock.snapshot().phase, 'ended'); assert.equal(clock.snapshot().picture.mainFrame, 73); assert(clock.snapshot().quizResolved); assert.equal(clock.snapshot().correctAnswer, false);
    context.currentTime += 100; assert.equal(clock.snapshot().closedWrongCount, 0); assert.equal(clock.snapshot().audioNodePlaying, false); assert.equal((await clock.choose('AnsBtn1', user)).accepted, false);
    clock.replay(); assert.equal(clock.snapshot().phase, 'ready'); assert.equal(clock.snapshot().attempts, 0); assert.equal(clock.snapshot().quizResolved, false); assert.equal(clock.snapshot().closedWrongCount, 0); await clock.close();
  }
});
test('host selections1..4 resolve only to existing2/3/4 and preserve a labeled missing1 fallback', async () => {
  for (const [seed, domain, last, index] of [[0, 'sprite-50', 25, 2], [1, 'sprite-50', 25, 2], [2, 'sprite-86', 28, 3], [3, 'sprite-58', 27, 4]] as const) {
    const {clock, context} = await fixture(seed); clock.inspect(49); await clock.choose('AnsBtn1', user); const s = clock.snapshot();
    assert.equal(s.selectedHostIndex, seed + 1); assert.equal(s.selectedBranch?.index, index); assert.equal(s.selectedBranch?.frameDomain, domain); assert.equal(s.missingFeedbackFallback, seed === 0); assert.equal(s.quizResolved, false); assert(s.correctAnswer);
    assert.equal(context.nodes.length, 2); const outro = context.nodes[1].starts[0]; near(outro[0], (last - 2) / 12); near(outro[1], (1673 + 40 * 22050 / 12) / 22050); near(outro[2], (116928 - 1673 - 40 * 22050 / 12) / 22050);
    context.currentTime = (last - 2) / 12; assert.equal(clock.snapshot().picture.mainFrame, 50); assert(clock.snapshot().quizResolved);
    context.currentTime += 23 / 12; assert.equal(clock.snapshot().phase, 'ended'); assert.equal(clock.snapshot().picture.mainFrame, 73); assert.equal(clock.snapshot().audioNodePlaying, false);
    assert.equal(clock.snapshot().lessonCompleted, false); await clock.close();
  }
});
test('pause and Replay retire future narration, restore seed and clear all quiz state', async () => {
  const {clock, context} = await fixture(); clock.inspect(49); await clock.choose('AnsBtn1', user); context.currentTime = .5; clock.pause();
  assert(context.nodes.every(n => n.stops === 1 && n.disconnected)); context.currentTime = 100; await clock.play(user); assert.equal(context.nodes.length, 4); near(context.nodes[3].starts[0][0], 100 + 23 / 12 - .5);
  clock.replay(); assert(context.nodes.every(n => n.stops === 1)); const s = clock.snapshot(); assert.equal(s.picture.mainFrame, 1); assert.equal(s.selectedBranch, null); assert.equal(s.selectedHostIndex, null); assert.equal(s.quizResolved, false); assert.equal(s.inspectionMode, false);
  clock.inspect(49); await clock.choose('AnsBtn1', user); assert(clock.snapshot().missingFeedbackFallback); await clock.close();
});
test('source frame inspection and reduced motion cannot manufacture a solved quiz', async () => {
  const {clock, context} = await fixture(); assert.equal((await clock.play({activation: 'automatic', reducedMotion: true})).accepted, false); assert.equal(context.nodes.length, 0);
  assert.equal(clock.inspect(74).accepted, false); clock.inspect(73); assert.equal(clock.snapshot().quizResolved, false); assert.equal(clock.snapshot().correctAnswer, false); assert.equal(clock.snapshot().inspectionMode, true);
  clock.replay(); await clock.play(user); assert.equal(clock.snapshot().inspectionMode, false); await clock.close();
});
test('pending native starts are invalidated by pause, Replay and unmount', async () => {
  for (const action of ['pause', 'replay', 'close'] as const) {
    const {clock, context} = await fixture(); let release!: () => void; context.resumeWait = new Promise(r => release = r); const pending = clock.play(user); await clock[action](); release();
    assert.equal((await pending).accepted, false); assert.equal(context.nodes.length, 0); await clock.close();
  }
});
test('altered payload, decoded PCM, painting, branch order and repair mapping fail closed', async () => {
  for (const mode of ['bytes', 'pcm', 'paint']) {
    const context = new Context(), p = mode === 'pcm' ? {...plan, clips: plan.clips.map((c, i) => i ? c : {...c, decoder: {...c.decoder, pcmSha256: '0'.repeat(64)}})} : plan;
    const clock = new P016SourceClockV1(p, {createContext: () => context as unknown as AudioContext, commitPicture: () => mode !== 'paint'}); const b = payloads(); if (mode === 'bytes') b.set('sprite-107', Uint8Array.of(9).buffer);
    assert.equal((await clock.prepare(b)).accepted, false); assert.equal(clock.snapshot().phase, 'failed'); assert.equal(context.nodes.length, 0); await clock.close();
  }
  assert.throws(() => new P016SourceClockV1({...plan, branches: [...plan.branches.slice(1), plan.branches[0]]}, {commitPicture: () => true}), /BRANCH_MISMATCH/);
  assert.throws(() => new P016SourceClockV1({...plan, feedbackSelection: {rightIndexMap: {'1': 5, '2': 2, '3': 3, '4': 4}}}, {commitPicture: () => true}), /REPAIR_MISMATCH/);
  assert.throws(() => new P016SourceClockV1(plan, {seed: -1, commitPicture: () => true}), /INVALID_SEED/);
});
