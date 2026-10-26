import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P062AudioController, P062_AUDIO_DOMAINS} from '../src/nms-l02-p062-audio-v1';
import {
  P062Session,
  type P062AudioDomainId, type P062AudioSnapshot, type P062SessionAudio,
} from '../src/nms-l02-p062-session-v1';

test('session audio bounds match the exact P062 raw source index', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const bytes = fs.readFileSync(path.join(root,
    'output/nms-l02-p062-source-20260928/audio-raw-index.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '7472338c839236889c0cff30be00ea99eca0fed5b8cd708a41cf68f4f378dde3');
  const index = JSON.parse(bytes.toString()) as {
    source: {sha256: string};
    streams: Array<{ownerDomainId: string; blockFrameRange: {last: number}}>;
  };
  assert.equal(index.source.sha256,
    '5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50');
  assert.deepEqual(Object.fromEntries(index.streams.map(stream =>
    [stream.ownerDomainId, stream.blockFrameRange.last])),
    Object.fromEntries(Object.entries(P062_AUDIO_DOMAINS).map(([id, binding]) =>
      [id, binding.lastBlockFrame])));
});

test('real P062 controller satisfies session transport and stays silent on construction', async () => {
  const audio: P062SessionAudio = new P062AudioController({
    readVerified: async () => {throw Error('No source fetch before explicit Play');},
  });
  const session = new P062Session({audio});
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().audio.domain, null);
  await session.close();
  assert.equal(session.snapshot().phase, 'closed');
});

class FakeAudio implements P062SessionAudio {
  current: P062AudioSnapshot = {phase: 'paused', domain: null, frame: 1,
    fromFrame: null, toFrame: null, sourceSample: 0, atBoundary: false,
    audioPlaying: false, volume: 1, error: null};
  calls: Array<{id: P062AudioDomainId; from: number; to: number; restart: boolean}> = [];
  resumes = 0;
  resets = 0;
  closes = 0;
  pending: Array<(value: boolean) => void> = [];
  holdLoads = false;

  snapshot(): P062AudioSnapshot { return {...this.current}; }
  async playDomain(id: P062AudioDomainId, from: number, to: number,
    options: {restart?: boolean} = {}): Promise<boolean> {
    this.calls.push({id, from, to, restart: options.restart === true});
    this.current = {...this.current, phase: this.holdLoads ? 'loading' : 'playing',
      domain: id, frame: from, fromFrame: from, toFrame: to,
      sourceSample: 0, atBoundary: false, audioPlaying: !this.holdLoads};
    if (this.holdLoads) return new Promise<boolean>(resolve => { this.pending.push(resolve); });
    return true;
  }
  async resume(): Promise<boolean> {
    this.resumes += 1;
    this.current = {...this.current, phase: 'playing', audioPlaying: true};
    return true;
  }
  pause(): void { this.current = {...this.current, phase: 'paused', audioPlaying: false}; }
  reset(): void {
    this.resets += 1;
    this.pending.splice(0).forEach(done => done(false));
    this.current = {...this.current, phase: 'paused', domain: null, frame: 1,
      fromFrame: null, toFrame: null, sourceSample: 0, atBoundary: false,
      audioPlaying: false};
  }
  async close(): Promise<void> {
    this.closes += 1;
    this.pending.splice(0).forEach(done => done(false));
    this.current = {...this.current, phase: 'closed', audioPlaying: false};
  }
  setFrame(frame: number, atBoundary = false): void {
    this.current = {...this.current, frame, atBoundary,
      phase: atBoundary ? 'paused' : 'playing', audioPlaying: !atBoundary};
  }
}

async function atMainStop(session: P062Session, audio: FakeAudio, stop: number): Promise<void> {
  audio.setFrame(stop, false);
  assert.equal(session.tick(0).state.mainFrame, stop - 1);
  audio.setFrame(stop, true);
  assert.equal(session.tick(1).state.mainFrame, stop);
}
async function reach(session: P062Session, audio: FakeAudio, stop: number): Promise<void> {
  await session.dispatch({type: 'play'});
  for (const n of [384, 523, 650, 766, 815]) {
    await atMainStop(session, audio, n);
    if (n === stop) return;
    await session.dispatch({type: 'continue'});
  }
  throw Error(`unreachable ${stop}`);
}

test('silent entry; all six source windows hold stop-1 until verified audio boundary', async () => {
  const audio = new FakeAudio();
  const session = new P062Session({audio});
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.calls.length, 0);
  await session.dispatch({type: 'play'});
  assert.deepEqual(audio.calls[0], {id: 'sprite-315', from: 1, to: 384, restart: true});
  for (const [index, stop] of [384, 523, 650, 766, 815].entries()) {
    await atMainStop(session, audio, stop);
    assert.equal(session.snapshot().phase, 'paused');
    if (stop !== 815) {
      await session.dispatch({type: 'continue'});
      assert.deepEqual(audio.calls[index + 1], {id: 'sprite-315', from: stop,
        to: [523, 650, 766, 815][index], restart: true});
    }
  }
  assert.equal(session.snapshot().state.quizControlsEnabled, true);
});

test('pause preserves main source sample and explicit Play resumes it', async () => {
  const audio = new FakeAudio();
  const session = new P062Session({audio});
  await reach(session, audio, 650);
  await session.dispatch({type: 'continue'});
  audio.setFrame(680);
  audio.current.sourceSample = 12345;
  await session.dispatch({type: 'pause'});
  assert.equal(session.snapshot().state.mainFrame, 680);
  assert.equal(audio.resumes, 0);
  await session.dispatch({type: 'play'});
  assert.equal(audio.resumes, 1);
  assert.equal(audio.current.sourceSample, 12345);
});

test('silent help boxes freeze through long pause and cannot advance main', async () => {
  for (const [main, spriteId, release, terminal] of [
    [650, 106, 15, 20], [766, 122, 21, 27],
  ] as const) {
    const audio = new FakeAudio();
    const session = new P062Session({audio});
    await reach(session, audio, main);
    await session.dispatch({type: 'reveal'});
    assert.equal(session.snapshot().state.box?.spriteId, spriteId);
    await session.dispatch({type: 'box-play'});
    session.tick(1000);
    assert.equal(session.tick(1333.334).state.box?.frame, 5);
    await session.dispatch({type: 'pause'});
    assert.equal(session.tick(6333.334).state.box?.frame, 5);
    await session.dispatch({type: 'play'});
    assert.equal(session.tick(6333.334).state.box?.frame, 5);
    assert.equal(session.tick(6416.674).state.box?.frame, 6);
    const ms = (release - 6) * 1000 / 12;
    assert.equal(session.tick(6416.674 + ms + 1).state.box?.frame, release);
    await session.dispatch({type: 'box-release'});
    session.tick(10000);
    assert.equal(session.tick(10000 + (terminal - release) * 1000 / 12 + 1).state.box?.frame, 1);
    assert.equal(session.snapshot().state.mainFrame, main);
    assert.equal(session.snapshot().state.mainPlaying, false);
  }
});

test('feedback enters local 2 and waits for full payload EOF; answer 3 completes once', async () => {
  const audio = new FakeAudio();
  let completes = 0;
  const session = new P062Session({audio, seed: 0, onComplete: () => { completes += 1; }});
  await reach(session, audio, 815);
  await session.dispatch({type: 'answer', ordinal: 1});
  const first = session.snapshot().state.feedback!;
  const id = `sprite-${first.spriteId}` as P062AudioDomainId;
  assert.deepEqual(audio.calls.at(-1), {id, from: 2,
    to: P062_AUDIO_DOMAINS[id].lastBlockFrame + 1, restart: true});
  audio.setFrame(first.terminalFrame, false);
  assert.equal(session.tick(0).state.feedback?.frame, first.terminalFrame - 1);
  audio.setFrame(first.terminalFrame + 1, true);
  assert.equal(session.tick(1).state.quizTryCount, 1);
  await session.dispatch({type: 'answer', ordinal: 1});
  assert.equal(audio.calls.at(-1)?.restart, true);
  const second = session.snapshot().state.feedback!;
  audio.setFrame(second.terminalFrame + 1, true);
  session.tick(2);
  await Promise.resolve();
  assert.equal(session.snapshot().state.mainPlaying, true);
  await session.dispatch({type: 'replay'});
  for (const stop of [384, 523, 650, 766, 815]) {
    audio.setFrame(stop, true);session.tick(0);
    if (stop !== 815) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 3});
  const right = session.snapshot().state.feedback!;
  assert.equal(right.spriteId, 288); // first conditional host right choice; stereo source.
  audio.setFrame(right.terminalFrame, false);
  assert.equal(session.tick(0).state.feedback?.frame, right.terminalFrame - 1);
  audio.setFrame(right.terminalFrame + 1, true);
  session.tick(1);
  await Promise.resolve();
  assert.deepEqual(audio.calls.at(-1), {id: 'sprite-315', from: 815, to: 834, restart: true});
  audio.setFrame(834, false);
  assert.equal(session.tick(0).state.mainFrame, 833);
  audio.setFrame(834, true);
  assert.equal(session.tick(1).phase, 'complete');
  session.tick(2);
  assert.equal(completes, 1);
  await session.dispatch({type: 'replay'});
  assert.equal(session.snapshot().state.mainFrame, 1);
});

test('stale loading, navigation, and invalid clocks remain contained', async () => {
  const audio = new FakeAudio();
  const session = new P062Session({audio});
  assert.throws(() => session.tick(NaN), RangeError);
  audio.holdLoads = true;
  const stale = session.dispatch({type: 'play'});
  await Promise.resolve();
  assert.equal(session.snapshot().phase, 'loading');
  audio.holdLoads = false;
  await session.dispatch({type: 'replay'});
  await stale;
  assert.equal(audio.resets, 1);
  assert.deepEqual(audio.calls.at(-1), {id: 'sprite-315', from: 1, to: 384, restart: true});
  await session.dispatch({type: 'navigate-away'});
  assert.equal(session.snapshot().phase, 'closed');
  assert.equal(audio.closes, 1);
  assert.deepEqual(await session.dispatch({type: 'replay'}), session.snapshot());
  const loadingAudio = new FakeAudio();
  loadingAudio.holdLoads = true;
  const loadingSession = new P062Session({audio: loadingAudio});
  const pending = loadingSession.dispatch({type: 'play'});
  await Promise.resolve();
  await loadingSession.dispatch({type: 'navigate-away'});
  await pending;
  assert.equal(loadingSession.snapshot().phase, 'closed');
  assert.equal(loadingAudio.closes, 1);
});
