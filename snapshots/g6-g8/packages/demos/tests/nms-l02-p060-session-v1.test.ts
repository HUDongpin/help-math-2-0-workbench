import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P060_AUDIO_DOMAINS, type P060AudioDomainId, type P060AudioSnapshot,
} from '../src/nms-l02-p060-audio-v1';
import {P060Session, type P060SessionAudio} from '../src/nms-l02-p060-session-v1';

class FakeAudio implements P060SessionAudio {
  current: P060AudioSnapshot = {phase: 'paused', domain: null, frame: 1,
    fromFrame: null, toFrame: null, sourceSample: 0, atBoundary: false,
    audioPlaying: false, volume: 1, error: null};
  calls: Array<{id: P060AudioDomainId; from: number; to: number; restart: boolean}> = [];
  resumes = 0;
  resets = 0;
  closes = 0;

  snapshot(): P060AudioSnapshot { return {...this.current}; }
  async playDomain(id: P060AudioDomainId, from: number, to: number,
    options: {restart?: boolean} = {}): Promise<boolean> {
    this.calls.push({id, from, to, restart: options.restart === true});
    this.current = {...this.current, phase: 'playing', domain: id, frame: from,
      fromFrame: from, toFrame: to, sourceSample: 0, atBoundary: false, audioPlaying: true};
    return true;
  }
  async resume(): Promise<boolean> {
    this.resumes += 1;
    this.current = {...this.current, phase: 'playing', audioPlaying: true};
    return true;
  }
  pause(): void {
    this.current = {...this.current, phase: 'paused', audioPlaying: false};
  }
  reset(): void {
    this.resets += 1;
    this.current = {...this.current, phase: 'paused', domain: null, frame: 1,
      fromFrame: null, toFrame: null, sourceSample: 0, atBoundary: false, audioPlaying: false};
  }
  async close(): Promise<void> {
    this.closes += 1;
    this.current = {...this.current, phase: 'closed', audioPlaying: false};
  }
  setFrame(frame: number, atBoundary = false): void {
    this.current = {...this.current, frame, atBoundary,
      phase: atBoundary ? 'paused' : 'playing', audioPlaying: !atBoundary};
  }
}

async function toMainStop(session: P060Session, audio: FakeAudio, stop: number): Promise<void> {
  audio.setFrame(stop, false);
  assert.equal(session.tick(0).state.mainFrame, stop - 1);
  audio.setFrame(stop, true);
  assert.equal(session.tick(1).state.mainFrame, stop);
}

test('starts silent; main source windows wait for the exact audio boundary at every stop', async () => {
  const audio = new FakeAudio();
  const session = new P060Session({audio});
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.calls.length, 0);
  await session.dispatch({type: 'play'});
  assert.deepEqual(audio.calls[0], {id: 'sprite-391', from: 1, to: 262, restart: true});
  await toMainStop(session, audio, 262);
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().state.pausedByUser, false);
  await session.dispatch({type: 'continue'});
  assert.deepEqual(audio.calls[1], {id: 'sprite-391', from: 262, to: 400, restart: true});
  await toMainStop(session, audio, 400);
  await session.dispatch({type: 'continue'});
  await toMainStop(session, audio, 527);
  await session.dispatch({type: 'continue'});
  await toMainStop(session, audio, 646);
  await session.dispatch({type: 'continue'});
  await toMainStop(session, audio, 699);
  assert.equal(session.snapshot().state.quizControlsEnabled, true);
});

test('user pause and glossary return keep the exact source cursor until explicit Play', async () => {
  const audio = new FakeAudio();
  const session = new P060Session({audio});
  await session.dispatch({type: 'play'});
  audio.setFrame(100);
  audio.current.sourceSample = 12345;
  await session.dispatch({type: 'pause'});
  assert.equal(session.snapshot().state.mainFrame, 100);
  await session.dispatch({type: 'glossary-open', key: 'Fraction'});
  assert.equal(session.snapshot().state.glossaryKey, 'Fraction');
  await session.dispatch({type: 'glossary-close'});
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.resumes, 0);
  await session.dispatch({type: 'play'});
  assert.equal(audio.resumes, 1);
  assert.equal(audio.current.sourceSample, 12345);
  await session.dispatch({type: 'glossary-open', key: 'Fraction'});
  assert.equal(session.snapshot().state.glossaryKey, 'Fraction');
  await session.dispatch({type: 'glossary-close'});
  assert.equal(session.snapshot().phase, 'paused');
  assert.equal(session.snapshot().state.pausedByUser, true);
  assert.equal(audio.resumes, 1);
  await session.dispatch({type: 'play'});
  assert.equal(audio.resumes, 2);
  assert.equal(audio.current.sourceSample, 12345);
});

test('silent box uses local 12 fps, freezes at release, never resumes main', async () => {
  const audio = new FakeAudio();
  const session = new P060Session({audio});
  await session.dispatch({type: 'play'});
  for (const stop of [262, 400, 527]) {
    audio.setFrame(stop, true);
    session.tick(0);
    if (stop !== 527) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'reveal'});
  await session.dispatch({type: 'box-play'});
  session.tick(0);
  assert.equal(session.tick(1000).state.box?.frame, 13);
  await session.dispatch({type: 'pause'});
  assert.equal(session.snapshot().state.box?.frame, 13);
  await session.dispatch({type: 'play'});
  assert.equal(session.tick(2000).state.box?.frame, 13);
  assert.equal(session.tick(2166.667).state.box?.frame, 15);
  assert.equal(session.snapshot().state.box?.playing, false);
  assert.equal(session.snapshot().state.mainFrame, 527);
  await session.dispatch({type: 'box-release'});
  session.tick(3000);
  assert.equal(session.tick(4000).state.box?.frame, 1);
  assert.equal(session.snapshot().state.mainFrame, 527);
});

test('feedback waits for full payload EOF; repeated same sprite restarts; final completion once', async () => {
  const audio = new FakeAudio();
  let completions = 0;
  const session = new P060Session({audio, seed: 0, onComplete: () => { completions += 1; }});
  await session.dispatch({type: 'play'});
  for (const stop of [262, 400, 527, 646, 699]) {
    audio.setFrame(stop, true);
    session.tick(0);
    if (stop !== 699) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 2});
  const first = session.snapshot().state.feedback!;
  const id = `sprite-${first.spriteId}` as P060AudioDomainId;
  assert.deepEqual(audio.calls.at(-1), {id, from: 2,
    to: P060_AUDIO_DOMAINS[id].lastBlockFrame + 1, restart: true});
  audio.setFrame(first.terminalFrame, false);
  assert.equal(session.tick(0).state.feedback?.frame, first.terminalFrame - 1);
  audio.setFrame(first.terminalFrame + 1, true);
  assert.equal(session.tick(1).state.feedback, null);
  assert.equal(session.snapshot().state.quizTryCount, 1);
  // Reset the deterministic selector to revisit the same feedback ID. The
  // real state remains immutable to callers; this fake transport checks the
  // repeated-window restart contract through a new Replay with seed 0.
  await session.dispatch({type: 'replay'});
  for (const stop of [262, 400, 527, 646, 699]) {
    audio.setFrame(stop, true);
    session.tick(0);
    if (stop !== 699) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 2});
  assert.equal(session.snapshot().state.feedback?.spriteId, first.spriteId);
  assert.equal(audio.calls.at(-1)?.restart, true);
  await session.dispatch({type: 'replay'});
  for (const stop of [262, 400, 527, 646, 699]) {
    audio.setFrame(stop, true);
    session.tick(0);
    if (stop !== 699) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'answer', ordinal: 1});
  const right = session.snapshot().state.feedback!;
  audio.setFrame(right.terminalFrame + 1, true);
  session.tick(0);
  await Promise.resolve(); // auto main 699→718 begins after feedback completion
  assert.deepEqual(audio.calls.at(-1), {id: 'sprite-391', from: 699, to: 718, restart: true});
  audio.setFrame(718, false);
  assert.equal(session.tick(0).state.mainFrame, 717);
  audio.setFrame(718, true);
  assert.equal(session.tick(1).phase, 'complete');
  session.tick(2);
  assert.equal(completions, 1);
  await session.dispatch({type: 'replay'});
  assert.equal(session.snapshot().state.mainFrame, 1);
  assert.equal(audio.resets, 3);
});

test('silent box discards paused and glossary dwell without jumping local frames', async () => {
  const audio = new FakeAudio();
  const session = new P060Session({audio});
  await session.dispatch({type: 'play'});
  for (const stop of [262, 400, 527]) {
    audio.setFrame(stop, true);
    session.tick(0);
    if (stop !== 527) await session.dispatch({type: 'continue'});
  }
  await session.dispatch({type: 'reveal'});
  await session.dispatch({type: 'box-play'});
  session.tick(1000);
  assert.equal(session.tick(1333.334).state.box?.frame, 5);
  await session.dispatch({type: 'pause'});
  assert.equal(session.tick(6333.334).state.box?.frame, 5);
  await session.dispatch({type: 'play'});
  assert.equal(session.tick(6333.334).state.box?.frame, 5);
  assert.equal(session.tick(6416.674).state.box?.frame, 6);
  await session.dispatch({type: 'glossary-open', key: 'Grid'});
  assert.equal(session.tick(11416.674).state.box?.frame, 6);
  await session.dispatch({type: 'glossary-close'});
  assert.equal(session.snapshot().phase, 'paused');
  await session.dispatch({type: 'play'});
  assert.equal(session.tick(11416.674).state.box?.frame, 6);
  assert.equal(session.tick(11500.014).state.box?.frame, 7);
});

test('navigation closes transport and cannot resume or complete', async () => {
  const audio = new FakeAudio();
  let completions = 0;
  const session = new P060Session({audio, onComplete: () => { completions += 1; }});
  await session.dispatch({type: 'play'});
  await session.dispatch({type: 'navigate-away'});
  assert.equal(session.snapshot().phase, 'closed');
  assert.equal(audio.closes, 1);
  await session.dispatch({type: 'replay'});
  assert.equal(audio.calls.length, 1);
  assert.equal(completions, 0);
});
