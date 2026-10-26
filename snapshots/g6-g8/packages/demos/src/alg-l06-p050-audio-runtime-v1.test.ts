import assert from 'node:assert/strict';
import test from 'node:test';
import {P050PageRuntimeV1, type P050RuntimeOptions} from './alg-l06-p050-audio-runtime-v1';
import {P050_MEASURED_BINDINGS, type P050AudioDomain} from './alg-l06-p050-measured-bindings-v1';
import {type P050Choice, type P050Event} from './alg-l06-p050-state-v1';
import {p050VisualRequest} from './alg-l06-p050-canvas-commit-v1';
import type {DecodedStreamPhase, DecodedStreamSnapshot} from './decoded-source-stream-transport';

class Track {
  phase: DecodedStreamPhase = 'idle'; epoch = 0; cursor = 0; anchor: number | null = null;
  volume = 1; closes = 0; starts = 0; reject = false; pending: Promise<void> | null = null;
  delays: number[] = []; seeks: number[] = [];
  listeners = new Set<() => void>();
  subscribe(listener: () => void) {this.listeners.add(listener); return () => {this.listeners.delete(listener);};}
  emit() {for (const listener of this.listeners) listener();}
  constructor(readonly now: () => number, readonly rate: number) {}
  async prepare() {this.epoch++; this.phase = 'ready'; this.cursor = 0; return {accepted: true, reason: 'ready'};}
  async play(policy: {activation: 'user' | 'automatic'; reducedMotion: boolean; delaySeconds?: number}) {
    if (this.phase === 'buffer-ended') return {accepted: false, reason: 'not-ready-for-play'};
    const epoch = ++this.epoch; this.phase = 'start-pending';
    if (this.pending) await this.pending;
    if (epoch !== this.epoch) return {accepted: false, reason: 'stale-start'};
    if (this.reject) {this.phase = 'play-rejected'; return {accepted: false, reason: 'browser rejected'};}
    this.delays.push(policy.delaySeconds ?? 0); this.starts++;
    this.anchor = this.now() + (policy.delaySeconds ?? 0); this.phase = 'playing';
    return {accepted: true, reason: 'playing'};
  }
  pause() {this.cursor = this.snapshot().decodedSample; this.epoch++; this.anchor = null; this.phase = 'paused'; return {accepted: true, reason: 'paused'};}
  replay() {this.epoch++; this.cursor = 0; this.anchor = null; this.phase = 'ready'; return {accepted: true, reason: 'ready'};}
  seekDecodedSample(sample: number) {this.epoch++; this.cursor = sample; this.seeks.push(sample); this.anchor = null; this.phase = 'paused'; return {accepted: true, reason: 'seeked'};}
  setVolume(volume: number) {this.volume = volume; return {accepted: true, reason: 'volume'};}
  snapshot(): DecodedStreamSnapshot {return {phase: this.phase, epoch: this.epoch,
    decodedSample: this.cursor + (this.anchor === null ? 0 : Math.max(0, this.now() - this.anchor) * this.rate),
    contextTime: this.now(), playbackAnchor: this.anchor === null ? null : {contextTime: this.anchor, decodedSample: this.cursor},
    heldContextTime: null, elapsedMs: 0, volume: this.volume, failure: null, sourceAlignment: 'unresolved', lessonCompleted: false};}
  async close() {this.epoch++; this.closes++; this.phase = 'closed'; this.anchor = null;}
}
const flush = async () => {for (let i = 0; i < 16; i++) await Promise.resolve();};
const answers: readonly P050Choice[] = ['D', 'A', 'B', 'D', 'C', 'A', 'B', 'C', 'D', 'B'];
function fixture(overrides: Partial<P050RuntimeOptions> = {}) {
  let now = 0, cleaned = 0;
  const tracks = {} as Record<P050AudioDomain, Track>, loads: P050AudioDomain[] = [];
  const page = new P050PageRuntimeV1({now: () => now,
    load: async id => {loads.push(id); return new ArrayBuffer(1);},
    makeTransport: (binding, id) => tracks[id] = new Track(() => now, binding.sampleRate),
    resumeEnded: async () => true, onCleanup: () => cleaned++, ...overrides});
  const step = async (seconds: number) => {now += seconds; page.tick(); await flush();};
  const send = (type: P050Event['type'], fields: Partial<P050Event> = {}) => page.send({type,
    epoch: page.snapshot().state.epoch, questionGeneration: page.snapshot().state.questionGeneration, ...fields});
  const begin = async () => {
    assert(await page.start()); assert(send('start-game').accepted);
    assert.equal(page.snapshot().state.phase, 'begin'); assert.equal(page.snapshot().state.drawCount, 0);
    await step(1 / 12); assert.equal(page.snapshot().state.phase, 'question');
  };
  return {page, tracks, loads, step, send, begin, cleaned: () => cleaned};
}

test('ten real runtime draws use all three correct streams, score100 and source Final', async () => {
  const f = fixture(); await f.begin();
  assert.deepEqual(f.loads, ['main', 'wrong', 'correct358', 'correct432', 'correct479']);
  const seen = new Set<number>();
  for (let n = 1; n <= 10; n++) {
    const q = f.page.snapshot().state.questionId!; seen.add(q);
    assert(f.send('choose', {choice: answers[q - 1]}).accepted); await flush();
    const feedback = f.page.snapshot().state.feedback!;
    assert.equal(f.page.snapshot().state.score, n * 10);
    for (let local = 3; local <= feedback.endFrame; local++) {
      await f.step(1 / 12);
      const state = f.page.snapshot().state;
      p050VisualRequest(state);
      if (n === 10 && local === 3) assert.equal(state.scoreAnimation?.frame, 11);
      if (n === 10 && local === 12) assert.equal(state.scoreAnimation, null);
    }
    assert.equal(f.page.snapshot().visualClockRunning, false);
  }
  assert.equal(seen.size, 10); assert.equal(f.tracks.correct358.starts, 4);
  assert.equal(f.tracks.correct432.starts, 3); assert.equal(f.tracks.correct479.starts, 3);
  assert(f.tracks.correct358.seeks.every(n => n === 1838));
  assert(f.tracks.correct432.seeks.every(n => n === 919));
  assert(f.tracks.correct479.seeks.every(n => n === 0));
  const final = f.page.snapshot();
  assert.equal(final.state.phase, 'final'); assert.equal(final.state.score, 100);
  assert.equal(final.lessonCompleted, false); assert.equal(final.audio.owner, null);
  assert(f.send('start-game').accepted); await f.step(1 / 12);
  assert.equal(f.page.snapshot().state.phase, 'final'); assert.equal(f.page.snapshot().state.drawCount, 12);
  await f.page.close(); assert.equal(f.cleaned(), 1);
  for (const t of Object.values(f.tracks)) assert.equal(t.closes, 1);
});

test('wrong feedback clamps at23, waits for Close, seeks24 and advances without deduction', async () => {
  const f = fixture(); await f.begin(); const q = f.page.snapshot().state.questionId!;
  const answer = answers[q - 1];
  assert(f.send('choose', {choice: answer === 'A' ? 'B' : 'A'}).accepted); await flush();
  await f.step(100);
  const held = f.page.snapshot().state;
  assert.equal(held.phase, 'wrong-held'); assert.equal(held.feedback?.frame, 23);
  assert.equal(held.score, 0); assert.equal(held.drawCount, 1);
  p050VisualRequest(held); await f.step(100); assert.equal(f.page.snapshot().state, held);
  assert(f.send('close-wrong', {token: held.feedback!.token}).accepted); await flush();
  assert.equal(f.tracks.wrong.seeks.at(-1), 40425);
  await f.step(4 / 12); assert.equal(f.page.snapshot().state.drawCount, 2);
  assert.notEqual(f.page.snapshot().state.questionId, q); await f.page.close();
});

test('pause before main onset preserves the fractional cursor and only remaining silence', async () => {
  const f = fixture(); await f.page.start(); f.page.play(); await flush();
  assert.equal(f.tracks.main.delays[0], 3 / 12);
  await f.step(1.5 / 12); f.page.pause();
  assert.equal(f.page.snapshot().state.mainFrame, 2); assert.equal(f.tracks.main.cursor, 0);
  await f.step(100); f.page.play(); await flush();
  assert(Math.abs(f.tracks.main.delays[1]! - 1.5 / 12) < 1e-9);
  await f.step(659.5 / 12); assert.equal(f.page.snapshot().state.phase, 'begin');
  assert.equal(f.page.snapshot().state.mainFrame, 662); assert.equal(f.page.snapshot().audio.owner, null);
  await f.page.close();
});

test('ADPCM EOF keeps the visual tail clock; pause and resume never complete the lesson', async () => {
  const f = fixture({seed: 0}); await f.begin();
  // Draw until one of the source questions5..7 uses the ADPCM feedback.
  while (![5, 6, 7].includes(f.page.snapshot().state.questionId!)) {
    f.send('choose', {choice: answers[f.page.snapshot().state.questionId! - 1]}); await flush(); await f.step(30 / 12);
  }
  f.send('choose', {choice: answers[f.page.snapshot().state.questionId! - 1]}); await flush();
  await f.step(11 / 12); f.tracks.correct432.phase = 'buffer-ended'; f.tracks.correct432.anchor = null;
  const count = f.page.snapshot().state.drawCount;
  f.page.tick(); f.page.pause(); const heldFrame = f.page.snapshot().state.feedback!.frame;
  await f.step(100); assert.equal(f.page.snapshot().state.feedback!.frame, heldFrame);
  f.page.play(); await flush(); await f.step((25 - heldFrame) / 12);
  assert.equal(f.page.snapshot().state.drawCount, count + 1); assert.equal(f.page.snapshot().lessonCompleted, false);
  await f.page.close();
});

test('SA is explicit, pauses score and feedback, returns held and Replay resets everything', async () => {
  const f = fixture(); await f.begin();
  f.send('choose', {choice: answers[f.page.snapshot().state.questionId! - 1]}); await flush(); await f.step(2 / 12);
  assert(!f.loads.includes('sa')); assert(await f.page.startSpanish());
  const held = f.page.snapshot().state;
  assert.equal(f.page.snapshot().audio.owner, 'sa'); assert.equal(held.paused, true);
  await f.step(100); assert.equal(f.page.snapshot().state, held);
  assert.equal(f.send('choose', {choice: 'A'}).accepted, false);
  assert(f.page.returnMain()); assert.equal(f.page.snapshot().visualClockRunning, false);
  f.page.play(); await flush(); await f.step(1 / 12);
  assert(f.page.snapshot().state.feedback!.frame > held.feedback!.frame);
  assert(await f.page.startSpanish()); assert(f.page.replay());
  assert.equal(f.page.snapshot().state.mainFrame, 1); assert.equal(f.page.snapshot().state.score, 0);
  assert.equal(f.page.snapshot().spanishSelected, false); assert.equal(f.tracks.sa.phase, 'ready');
  await f.page.close();
});

test('Spanish EOF publishes while the game clock is held, and close removes subscriptions', async () => {
  const observed: string[] = [];
  const f = fixture({onSnapshot: s => observed.push(s.audio.streams.sa?.phase ?? 'idle')});
  await f.begin(); await f.page.startSpanish();
  assert.equal(f.page.snapshot().visualClockRunning, false);
  f.page.pause(); assert.equal(f.page.snapshot().audio.streams.sa?.phase, 'paused');
  f.page.play(); await flush(); assert.equal(f.page.snapshot().audio.streams.sa?.phase, 'playing');
  f.tracks.sa.phase = 'buffer-ended'; f.tracks.sa.anchor = null; f.tracks.sa.emit();
  await flush(); assert.equal(observed.at(-1), 'buffer-ended');
  assert.equal(f.page.snapshot().state.phase, 'question');
  await f.page.close(); assert(Object.values(f.tracks).every(t => t.listeners.size === 0));
});

test('Replay cancels pending feedback start and deferred Start; stale handlers stay inert', async () => {
  const f = fixture(); await f.begin(); let resolve!: () => void;
  f.tracks.wrong.pending = new Promise<void>(r => resolve = r);
  const q = f.page.snapshot().state.questionId!, choice = answers[q - 1] === 'A' ? 'B' : 'A';
  f.send('choose', {choice}); await flush(); const old = f.page.snapshot().state;
  assert(f.page.replay()); resolve(); await flush();
  assert.notEqual(f.tracks.wrong.phase, 'playing'); assert.equal(f.page.snapshot().visualClockRunning, false);
  assert.equal(f.send('close-wrong', {epoch: old.epoch, token: old.feedback!.token}).accepted, false);
  f.send('start-game'); assert(f.page.replay()); await f.step(1);
  assert.equal(f.page.snapshot().state.mainFrame, 1); await f.page.close();
});

test('return or Replay aborts pending SA bytes; late bytes cannot start or mutate a run', async () => {
  for (const action of ['return', 'replay'] as const) {
    let resolve!: (value: ArrayBuffer) => void, signal: AbortSignal | undefined;
    const f = fixture({load: async (id, incoming) => id === 'sa'
      ? (signal = incoming, new Promise<ArrayBuffer>(r => resolve = r)) : new ArrayBuffer(1)});
    await f.begin(); const pending = f.page.startSpanish(); await flush();
    assert.equal(f.page.snapshot().spanishLoading, true);
    if (action === 'return') f.page.returnMain(); else f.page.replay();
    assert.equal(signal?.aborted, true); const state = f.page.snapshot().state;
    resolve(new ArrayBuffer(1)); assert.equal(await pending, false);
    assert.equal(f.page.snapshot().state, state); assert.equal(f.tracks.sa.starts, 0);
    await f.page.close();
  }
});

test('mount preload across Replay stays silent; close aborts pending loads', async () => {
  let resolve!: () => void; const wait = new Promise<void>(r => resolve = r); const signals: AbortSignal[] = [];
  const f = fixture({load: async (_id, signal) => {signals.push(signal); await wait; return new ArrayBuffer(1);}});
  const start = f.page.start(); assert(f.page.replay()); const state = f.page.snapshot().state;
  resolve(); assert(await start); assert.equal(f.page.snapshot().state, state);
  assert(Object.values(f.tracks).every(track => track.starts === 0)); await f.page.close();
  assert(signals.every(signal => signal.aborted));
});

test('rejected browser activation holds the source clock and explicit Play recovers', async () => {
  const f = fixture(); await f.page.start(); f.tracks.main.reject = true; f.page.play(); await flush();
  assert.match(f.page.snapshot().failure ?? '', /rejected/); assert.equal(f.page.snapshot().state.paused, true);
  f.tracks.main.reject = false; f.page.play(); await flush(); await f.step(1);
  assert.equal(f.page.snapshot().failure, null); assert.equal(f.page.snapshot().state.mainFrame, 13);
  await f.page.close();
});

test('the production transport receives separate measured source identities', () => {
  assert.equal(new Set(Object.values(P050_MEASURED_BINDINGS).map(x => x.sourceSha256)).size, 6);
  assert.equal(P050_MEASURED_BINDINGS.correct432.sampleRate, 11025);
  assert.equal(P050_MEASURED_BINDINGS.correct432.decodedSamples, 11935);
});
