import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P061_AUDIO_DOMAINS, type P061AudioDomainId, type P061AudioSnapshot,
} from '../src/nms-l02-p061-audio-v1';
import {P061Session, type P061SessionAudio} from '../src/nms-l02-p061-session-v1';

class FakeAudio implements P061SessionAudio {
  current: P061AudioSnapshot = {phase: 'paused', domain: null, frame: 1,
    fromFrame: null, toFrame: null, sourceSample: 0, atBoundary: false,
    audioPlaying: false, volume: 1, error: null};
  calls: Array<{id: P061AudioDomainId; from: number; to: number; restart: boolean}> = [];
  resumes = 0;
  resets = 0;
  closes = 0;
  pending: Array<(value: boolean) => void> = [];
  holdLoads = false;

  snapshot(): P061AudioSnapshot { return {...this.current}; }
  async playDomain(id: P061AudioDomainId, from: number, to: number,
    options: {restart?: boolean} = {}): Promise<boolean> {
    this.calls.push({id, from, to, restart: options.restart === true});
    this.current = {...this.current, phase: this.holdLoads ? 'loading' : 'playing', domain: id,
      frame: from, fromFrame: from, toFrame: to, sourceSample: 0,
      atBoundary: false, audioPlaying: !this.holdLoads};
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

async function atMainStop(session: P061Session, audio: FakeAudio, stop: number): Promise<void> {
  audio.setFrame(stop, false);
  assert.equal(session.tick(0).state.mainFrame, stop - 1);
  audio.setFrame(stop, true);
  assert.equal(session.tick(1).state.mainFrame, stop);
}
async function reach(session: P061Session, audio: FakeAudio, stop: number): Promise<void> {
  await session.dispatch({type: 'play'});
  for (const n of [435, 573, 700, 817, 860]) {
    await atMainStop(session, audio, n);
    if (n === stop) return;
    await session.dispatch({type: 'continue'});
  }
  throw new Error(`unreachable ${stop}`);
}

test('silent entry and six exact source windows hold stop-1 until audio boundary', async () => {
  const audio = new FakeAudio();
  const session = new P061Session({audio});
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.calls.length, 0);
  await session.dispatch({type: 'play'});
  assert.deepEqual(audio.calls[0], {id: 'sprite-315', from: 1, to: 435, restart: true});
  for (const [index, stop] of [435, 573, 700, 817, 860].entries()) {
    await atMainStop(session, audio, stop);
    assert.equal(session.snapshot().phase, 'paused');
    if (stop !== 860) {
      await session.dispatch({type: 'continue'});
      assert.deepEqual(audio.calls[index + 1], {id: 'sprite-315', from: stop,
        to: [573, 700, 817, 860][index], restart: true});
    }
  }
  assert.equal(session.snapshot().state.quizControlsEnabled, true);
  assert.equal(session.snapshot().state.mainFrame, 860);
});

test('source cursor survives pause/glossary return and resumes only on explicit Play', async () => {
  const audio = new FakeAudio();
  const session = new P061Session({audio});
  await reach(session, audio, 700);
  await session.dispatch({type: 'continue'});
  audio.setFrame(720);
  audio.current.sourceSample = 12345;
  await session.dispatch({type: 'pause'});
  assert.equal(session.snapshot().state.mainFrame, 720);
  await session.dispatch({type: 'glossary-open', key: 'Equivalent decimal'});
  assert.equal(session.snapshot().state.glossaryKey, 'Equivalent decimal');
  await session.dispatch({type: 'glossary-close'});
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.resumes, 0);
  await session.dispatch({type: 'play'});
  assert.equal(audio.resumes, 1);
  assert.equal(audio.current.sourceSample, 12345);
  await session.dispatch({type: 'glossary-open', key: 'Equivalent decimal'});
  await session.dispatch({type: 'glossary-close'});
  assert.equal(session.snapshot().phase, 'paused');
  await session.dispatch({type: 'play'});
  assert.equal(audio.resumes, 2);
  assert.equal(audio.current.sourceSample, 12345);
});

test('both silent boxes stop locally; pause and glossary dwell never jump a box clock', async () => {
  for (const [main, spriteId, release, terminal] of [
    [700, 111, 15, 20], [817, 118, 21, 27],
  ] as const) {
    const audio = new FakeAudio();
    const session = new P061Session({audio});
    await reach(session, audio, main);
    await session.dispatch({type: 'reveal'});
    assert.equal(session.snapshot().state.box?.spriteId, spriteId);
    await session.dispatch({type: 'box-play'});
    session.tick(1000);
    assert.equal(session.tick(1333.334).state.box?.frame, 5);
    await session.dispatch({type: 'pause'});
    assert.equal(session.tick(6333.334).state.box?.frame, 5);
    if (main === 700) {
      await session.dispatch({type: 'glossary-open', key: 'Equivalent decimal'});
      assert.equal(session.snapshot().state.glossaryKey, 'Equivalent decimal');
      await session.dispatch({type: 'glossary-close'});
    }
    await session.dispatch({type: 'play'});
    assert.equal(session.tick(6333.334).state.box?.frame, 5);
    assert.equal(session.tick(6416.674).state.box?.frame, 6);
    const ms = (release - 6) * 1000 / 12;
    assert.equal(session.tick(6416.674 + ms + 1).state.box?.frame, release);
    assert.equal(session.snapshot().state.box?.playing, false);
    assert.equal(session.snapshot().state.mainFrame, main);
    await session.dispatch({type: 'box-release'});
    session.tick(10000);
    assert.equal(session.tick(10000 + (terminal - release) * 1000 / 12 + 1).state.box?.frame, 1);
    assert.equal(session.snapshot().state.mainFrame, main);
    assert.equal(session.snapshot().state.mainPlaying, false);
  }
});

test('wrong feedback requires full payload EOF, same sprite restarts; right completes once', async () => {
  const audio = new FakeAudio();
  let completes = 0;
  const session = new P061Session({audio, seed: 0, onComplete: () => { completes += 1; }});
  await reach(session, audio, 860);
  await session.dispatch({type: 'answer', ordinal: 1});
  const first = session.snapshot().state.feedback!;
  const id = `sprite-${first.spriteId}` as P061AudioDomainId;
  assert.deepEqual(audio.calls.at(-1), {id, from: 2,
    to: P061_AUDIO_DOMAINS[id].lastBlockFrame + 1, restart: true});
  audio.setFrame(first.terminalFrame, false);
  assert.equal(session.tick(0).state.feedback?.frame, first.terminalFrame - 1);
  audio.setFrame(first.terminalFrame + 1, true);
  assert.equal(session.tick(1).state.feedback, null);
  assert.equal(session.snapshot().state.quizTryCount, 1);
  await session.dispatch({type: 'replay'});
  for (const stop of [435, 573, 700, 817, 860]) {
    audio.setFrame(stop, true);session.tick(0);
    if (stop !== 860) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 1});
  assert.equal(session.snapshot().state.feedback?.spriteId, first.spriteId);
  assert.equal(audio.calls.at(-1)?.restart, true);
  await session.dispatch({type: 'replay'});
  for (const stop of [435, 573, 700, 817, 860]) {
    audio.setFrame(stop, true);session.tick(0);
    if (stop !== 860) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 2});
  const right = session.snapshot().state.feedback!;
  assert.equal(right.spriteId, 284); // first identified-host right selector choice; stereo source.
  audio.setFrame(right.terminalFrame, false);
  assert.equal(session.tick(0).state.feedback?.frame, right.terminalFrame - 1);
  audio.setFrame(right.terminalFrame + 1, true);
  session.tick(1);
  await Promise.resolve(); // auto main 860→879 begins after right-feedback terminal
  assert.deepEqual(audio.calls.at(-1), {id: 'sprite-315', from: 860, to: 879, restart: true});
  audio.setFrame(879, false);
  assert.equal(session.tick(0).state.mainFrame, 878);
  audio.setFrame(879, true);
  assert.equal(session.tick(1).phase, 'complete');
  session.tick(2);
  assert.equal(completes, 1);
  await session.dispatch({type: 'replay'});
  assert.equal(session.snapshot().state.mainFrame, 1);
  assert.equal(audio.resets, 3);
});

test('stale load after Replay and navigation cannot revive an old audio window', async () => {
  const audio = new FakeAudio();
  const session = new P061Session({audio});
  audio.holdLoads = true;
  const old = session.dispatch({type: 'play'});
  await Promise.resolve();
  assert.equal(session.snapshot().phase, 'loading');
  audio.holdLoads = false;
  await session.dispatch({type: 'replay'});
  await old;
  assert.equal(audio.resets, 1);
  assert.equal(session.snapshot().state.mainFrame, 1);
  assert.equal(session.snapshot().state.navigatedAway, false);
  assert.deepEqual(audio.calls.at(-1), {id: 'sprite-315', from: 1, to: 435, restart: true});
  await session.dispatch({type: 'navigate-away'});
  assert.equal(audio.closes, 1);
  assert.equal(session.snapshot().phase, 'closed');
  assert.deepEqual(await session.dispatch({type: 'replay'}), session.snapshot());
  const loadingAudio = new FakeAudio();
  loadingAudio.holdLoads = true;
  const loadingSession = new P061Session({audio: loadingAudio});
  const stale = loadingSession.dispatch({type: 'play'});
  await Promise.resolve();
  assert.equal(loadingSession.snapshot().phase, 'loading');
  await loadingSession.dispatch({type: 'navigate-away'});
  await stale;
  assert.equal(loadingSession.snapshot().phase, 'closed');
  assert.equal(loadingAudio.closes, 1);
  assert.equal(loadingAudio.calls.length, 1);
});

test('session guards invalid clock and publishes no completion after navigation', async () => {
  const audio = new FakeAudio();
  let completions = 0;
  const session = new P061Session({audio, onComplete: () => { completions += 1; }});
  assert.throws(() => session.tick(NaN), RangeError);
  await session.dispatch({type: 'play'});
  await session.dispatch({type: 'navigate-away'});
  assert.equal(session.snapshot().phase, 'closed');
  assert.equal(audio.closes, 1);
  assert.equal(completions, 0);
});
