import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P060_MAIN_FRAMES, P060_RIGHT_IDS, P060_SOURCE_SHA, P060_STOPS,
  P060_WRONG_IDS, advanceP060State, createP060State, dispatchP060State,
  p060SourceFrame, type P060State,
} from '../src/nms-l02-p060-state-v1';

function atStop(frame: 262 | 400 | 527 | 646 | 699, seed = 0): P060State {
  let state = createP060State(seed);
  for (const stop of P060_STOPS) {
    state = advanceP060State(state, stop - state.mainFrame);
    assert.equal(state.mainFrame, stop);
    assert.equal(state.mainPlaying, false);
    if (stop === frame) return state;
    state = dispatchP060State(state, { type: 'continue' });
  }
  throw new Error(`unreachable stop ${frame}`);
}

test('source identity and complete one-indexed 721-frame query', () => {
  assert.equal(P060_SOURCE_SHA, '80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1');
  assert.equal(P060_MAIN_FRAMES, 721);
  assert.deepEqual(P060_STOPS, [262, 400, 527, 646, 699, 718]);
  assert.deepEqual(P060_WRONG_IDS, [205, 217, 245]);
  assert.deepEqual(P060_RIGHT_IDS, [354, 296, 275, 322]);
  for (let frame = 1; frame <= P060_MAIN_FRAMES; frame += 1) {
    const snapshot = p060SourceFrame(frame);
    assert.equal(snapshot.frame, frame);
    assert.equal(snapshot.sourceStop, P060_STOPS.some((stop) => stop === frame));
    assert.equal(snapshot.mainStreamBlockPresent, frame >= 9 && frame <= 711);
  }
  assert.equal(p060SourceFrame(699).sourceQuizTryCountReset, true);
  assert.equal(p060SourceFrame(700).sourceQuizSectionAssignment, false);
  for (const frame of [0, 722, 1.5, NaN]) assert.throws(() => p060SourceFrame(frame), RangeError);
  for (const seed of [-1, 2 ** 32, 0.5]) assert.throws(() => createP060State(seed), RangeError);
});

test('four early stops require explicit source continuation; 718 is terminal', () => {
  let state = createP060State();
  state = advanceP060State(state, 1000);
  assert.equal(state.mainFrame, 262);
  assert.equal(state.quizSection, true);
  assert.equal(state.aTextVisible, false);
  assert.deepEqual(advanceP060State(state, 30), state);
  for (const nextStop of [400, 527, 646, 699, 718]) {
    state = dispatchP060State(state, { type: 'continue' });
    if (nextStop === 718) {
      // Frame 699 has no direct continue: its answer-feedback branch resumes it.
      assert.equal(state.mainFrame, 699);
      state = dispatchP060State(state, { type: 'answer', ordinal: 1 });
      assert.equal(state.feedback?.kind, 'right');
      state = advanceP060State(state, state.feedback!.terminalFrame - state.feedback!.frame);
      assert.equal(state.mainPlaying, true);
      state = advanceP060State(state, 19);
    } else {
      state = advanceP060State(state, nextStop - state.mainFrame);
    }
    assert.equal(state.mainFrame, nextStop);
    assert.equal(state.mainPlaying, false);
  }
  assert.equal(state.quizSection, false);
  assert.equal(state.quizControlsVisible, false);
  assert.deepEqual(advanceP060State(state, 100), state);
});

test('527 and 646 reveal independent stopped box timelines; box release never resumes main', () => {
  for (const [mainFrame, spriteId, releaseFrame, terminalFrame] of [
    [527, 139, 15, 20], [646, 190, 103, 109],
  ] as const) {
    let state = atStop(mainFrame);
    state = dispatchP060State(state, { type: 'reveal' });
    assert.equal(state.box?.spriteId, spriteId);
    assert.equal(state.box?.frame, 1);
    assert.equal(state.box?.playing, false); // gotoAndPlay(1) meets source frame-1 stop.
    assert.equal(state.revealClipVisible, false);
    assert.equal(state.hintVisible, true);
    assert.deepEqual(advanceP060State(state, 50), state);
    assert.deepEqual(dispatchP060State(state, { type: 'reveal' }), state);
    state = dispatchP060State(state, { type: 'box-play' });
    state = advanceP060State(state, releaseFrame - 1);
    assert.equal(state.box?.frame, releaseFrame);
    assert.equal(state.box?.playing, false);
    assert.equal(state.mainFrame, mainFrame);
    state = dispatchP060State(state, { type: 'box-release' });
    assert.equal(state.quizSection, false);
    assert.equal(state.box?.playing, true);
    state = advanceP060State(state, terminalFrame - releaseFrame);
    assert.equal(state.box?.frame, 1);
    assert.equal(state.box?.playing, false);
    assert.equal(state.mainFrame, mainFrame);
    assert.equal(state.mainPlaying, false);
    state = dispatchP060State(state, { type: 'continue' });
    assert.equal(state.mainPlaying, true);
    assert.equal(state.box, null);
  }
});

test('conditional host feedback choices are deterministic and limited to 3 wrong / 4 right domains', () => {
  for (let seed = 0; seed < 12; seed += 1) {
    let state = atStop(699, seed);
    const wrong = dispatchP060State(state, { type: 'answer', ordinal: 4 });
    assert.equal(wrong.feedback?.spriteId, P060_WRONG_IDS[seed % 3]);
    assert.equal(wrong.feedback?.frame, 2);
    assert.equal(wrong.activeAudioDomain, `sprite-${P060_WRONG_IDS[seed % 3]}`);
    assert.equal(wrong.quizControlsEnabled, false);
    state = atStop(699, seed);
    const right = dispatchP060State(state, { type: 'answer', ordinal: 1 });
    assert.equal(right.feedback?.spriteId, P060_RIGHT_IDS[seed % 4]);
    assert.equal(right.feedback?.frame, 2);
    assert.equal(right.originalRuntimeParityEstablished, false);
  }
});

test('wrong feedback reenables at first attempt and resumes after second; right resumes without count', () => {
  for (const ordinal of [2, 3, 4] as const) {
    let state = atStop(699, ordinal);
    state = dispatchP060State(state, { type: 'answer', ordinal });
    assert.deepEqual(dispatchP060State(state, { type: 'answer', ordinal: 1 }), state);
    state = advanceP060State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.feedback, null);
    assert.equal(state.quizTryCount, 1);
    assert.equal(state.mainFrame, 699);
    assert.equal(state.mainPlaying, false);
    assert.equal(state.quizControlsEnabled, true);
    state = dispatchP060State(state, { type: 'answer', ordinal });
    state = advanceP060State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.feedback, null);
    assert.equal(state.quizTryCount, 0);
    assert.equal(state.quizSection, false);
    assert.equal(state.mainPlaying, true);
    state = advanceP060State(state, 1);
    assert.equal(state.mainFrame, 700);
    assert.equal(state.quizControlsVisible, false);
    assert.equal(state.popupVisible, false);
  }
  let right = atStop(699, 3);
  right = dispatchP060State(right, { type: 'answer', ordinal: 1 });
  right = advanceP060State(right, right.feedback!.terminalFrame - 2);
  assert.equal(right.quizTryCount, 0);
  assert.equal(right.mainPlaying, true);
  assert.equal(right.quizSection, false);
});

test('hint popup, glossary pause/return, user pause and navigation clean up', () => {
  let state = atStop(699);
  state = dispatchP060State(state, { type: 'hint' });
  assert.equal(state.popupVisible, true);
  assert.equal(state.quizControlsEnabled, false);
  assert.deepEqual(dispatchP060State(state, { type: 'answer', ordinal: 1 }), state);
  state = dispatchP060State(state, { type: 'glossary-open', key: 'Represent' });
  assert.equal(state.glossaryKey, 'Represent');
  assert.deepEqual(advanceP060State(state, 10), state);
  state = dispatchP060State(state, { type: 'glossary-close' });
  assert.equal(state.mainPlaying, false);
  state = dispatchP060State(state, { type: 'popup-close' });
  assert.equal(state.popupVisible, false);
  assert.equal(state.quizControlsEnabled, true);
  assert.equal(state.hintEnabled, true);
  const moving = dispatchP060State(atStop(262), { type: 'continue' });
  let glossary = dispatchP060State(moving, { type: 'glossary-open', key: 'Decimal fraction' });
  assert.equal(glossary.mainPlaying, false);
  assert.equal(glossary.glossaryReturnPlaying, true);
  glossary = dispatchP060State(glossary, { type: 'pause' });
  glossary = dispatchP060State(glossary, { type: 'glossary-close' });
  assert.equal(glossary.activeAudioDomain, null);
  assert.equal(advanceP060State(glossary, 4).mainFrame, 262);
  glossary = dispatchP060State(glossary, { type: 'play' });
  assert.equal(advanceP060State(glossary, 1).mainFrame, 263);
  const gone = dispatchP060State(glossary, { type: 'navigate-away' });
  assert.equal(gone.activeAudioDomain, null);
  assert.equal(gone.mainPlaying, false);
  assert.deepEqual(advanceP060State(gone, 100), gone);
  assert.deepEqual(dispatchP060State(gone, { type: 'continue' }), gone);
});

test('Mc_box1 exposes its own glossary occurrence at main frame 527 and freezes local playback', () => {
  const unrevealed = atStop(527);
  assert.deepEqual(dispatchP060State(unrevealed, { type: 'glossary-open', key: 'Grid' }), unrevealed);
  let state = dispatchP060State(unrevealed, { type: 'reveal' });
  state = dispatchP060State(state, { type: 'box-play' });
  state = advanceP060State(state, 4);
  assert.equal(state.box?.frame, 5);
  state = dispatchP060State(state, { type: 'glossary-open', key: 'Grid' });
  assert.equal(state.glossaryKey, 'Grid');
  assert.deepEqual(advanceP060State(state, 5), state);
  state = dispatchP060State(state, { type: 'glossary-close' });
  assert.equal(state.mainFrame, 527);
  assert.equal(state.mainPlaying, false);
  state = advanceP060State(state, 1);
  assert.equal(state.box?.frame, 6);
  assert.equal(state.mainFrame, 527);
});

test('source glossary remains available during user pause without lifting that pause', () => {
  let state = dispatchP060State(atStop(262), {type: 'pause'});
  assert.equal(state.pausedByUser, true);
  state = dispatchP060State(state, {type: 'glossary-open', key: 'Fraction'});
  assert.equal(state.glossaryKey, 'Fraction');
  assert.equal(state.pausedByUser, true);
  state = dispatchP060State(state, {type: 'glossary-close'});
  assert.equal(state.glossaryKey, null);
  assert.equal(state.pausedByUser, true);
  assert.equal(state.activeAudioDomain, null);
  assert.deepEqual(dispatchP060State(state, {type: 'continue'}), state);
});

test('Replay resets full vector and deterministic seed after every branch', () => {
  let state = atStop(699, 7);
  state = dispatchP060State(state, { type: 'answer', ordinal: 2 });
  state = advanceP060State(state, state.feedback!.terminalFrame - 2);
  state = dispatchP060State(state, { type: 'hint' });
  state = dispatchP060State(state, { type: 'navigate-away' });
  assert.deepEqual(dispatchP060State(state, { type: 'replay' }), createP060State(7));
  assert.throws(() => advanceP060State(state, -1), RangeError);
  assert.throws(() => advanceP060State(state, 1.5), RangeError);
});

 test('hint can close after glossary return while playback remains paused', () => {
  let state = dispatchP060State(atStop(699), {type: 'hint'});
  state = dispatchP060State(state, {type: 'glossary-open', key: 'Fraction'});
  state = dispatchP060State(state, {type: 'glossary-close'});
  state = dispatchP060State(state, {type: 'pause'});
  state = dispatchP060State(state, {type: 'popup-close'});
  assert.equal(state.popupVisible, false);
  assert.equal(state.pausedByUser, true);
  assert.equal(state.mainFrame, 699);
  assert.equal(state.mainPlaying, false);
  assert.equal(state.activeAudioDomain, null);
  assert.equal(state.quizControlsVisible, true);
  assert.deepEqual(dispatchP060State(state, {type: 'answer', ordinal: 1}), state);
});
