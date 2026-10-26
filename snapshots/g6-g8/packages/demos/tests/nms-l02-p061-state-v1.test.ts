import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P061_MAIN_FRAMES, P061_RIGHT_IDS, P061_SOURCE_RIGHT_IDS,
  P061_SOURCE_SHA, P061_SOURCE_WRONG_IDS, P061_STOPS, P061_WRONG_IDS,
  advanceP061State, createP061State, dispatchP061State, p061SourceFrame,
  type P061State,
} from '../src/nms-l02-p061-state-v1';

function atStop(frame: 435 | 573 | 700 | 817 | 860, seed = 0): P061State {
  let state = createP061State(seed);
  for (const stop of P061_STOPS) {
    state = advanceP061State(state, stop - state.mainFrame);
    assert.equal(state.mainFrame, stop);
    assert.equal(state.mainPlaying, false);
    if (stop === frame) return state;
    state = dispatchP061State(state, { type: 'continue' });
  }
  throw new Error(`unreachable stop ${frame}`);
}

test('source identity, main audio block range, stop and assignment boundaries', () => {
  assert.equal(P061_SOURCE_SHA, '4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a');
  assert.equal(P061_MAIN_FRAMES, 882);
  assert.deepEqual(P061_STOPS, [435, 573, 700, 817, 860, 879]);
  assert.deepEqual(P061_SOURCE_WRONG_IDS, [87, 134, 146, 174, 188]);
  assert.deepEqual(P061_SOURCE_RIGHT_IDS, [284, 226, 205, 252, 298]);
  for (let frame = 1; frame <= P061_MAIN_FRAMES; frame += 1) {
    const source = p061SourceFrame(frame);
    assert.equal(source.frame, frame);
    assert.equal(source.sourceStop, P061_STOPS.some((stop) => stop === frame));
    assert.equal(source.mainStreamBlockPresent, frame >= 9 && frame <= 875);
  }
  assert.equal(p061SourceFrame(860).sourceQuizTryCountReset, true);
  assert.equal(p061SourceFrame(861).sourceQuizSectionAssignment, false);
  for (const bad of [0, 883, 1.5, NaN]) assert.throws(() => p061SourceFrame(bad), RangeError);
  for (const bad of [-1, 2 ** 32, 0.5]) assert.throws(() => createP061State(bad), RangeError);
  const state = createP061State();
  assert.equal(state.originalRuntimeParityEstablished, false);
  assert.equal(state.historicalHostAssociationEstablished, false);
  assert.equal(state.historicalGlossaryBankAssociationEstablished, false);
});

test('four authored early stops need release; answer feedback reaches terminal 879', () => {
  let state = advanceP061State(createP061State(), 1000);
  assert.equal(state.mainFrame, 435);
  assert.equal(state.quizSection, true);
  assert.equal(state.aTextVisible, false);
  assert.deepEqual(advanceP061State(state, 100), state);
  for (const stop of [573, 700, 817, 860] as const) {
    state = dispatchP061State(state, { type: 'continue' });
    state = advanceP061State(state, stop - state.mainFrame);
    assert.equal(state.mainFrame, stop);
    assert.equal(state.mainPlaying, false);
  }
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.quizControlsVisible, true);
  assert.equal(state.hintVisible, true);
  assert.deepEqual(dispatchP061State(state, { type: 'continue' }), state);
  state = dispatchP061State(state, { type: 'answer', ordinal: 2 });
  state = advanceP061State(state, state.feedback!.terminalFrame - 2);
  assert.equal(state.mainPlaying, true);
  state = advanceP061State(state, 19);
  assert.equal(state.mainFrame, 879);
  assert.equal(state.mainPlaying, false);
  assert.equal(state.quizSection, false);
  assert.equal(state.quizControlsVisible, false);
  assert.deepEqual(advanceP061State(state, 50), state);
});

test('box 111 and 118 keep independent frame and parent does not resume from box release', () => {
  for (const [main, id, release, terminal] of [[700, 111, 15, 20], [817, 118, 21, 27]] as const) {
    let state = atStop(main);
    state = dispatchP061State(state, { type: 'reveal' });
    assert.deepEqual(state.box, { spriteId: id, frame: 1, releaseFrame: release, terminalFrame: terminal, playing: false });
    assert.equal(state.revealClipVisible, false);
    assert.deepEqual(advanceP061State(state, 50), state);
    state = dispatchP061State(state, { type: 'box-play' });
    state = advanceP061State(state, release - 1);
    assert.equal(state.box?.frame, release);
    assert.equal(state.box?.playing, false);
    assert.equal(state.mainFrame, main);
    state = dispatchP061State(state, { type: 'box-release' });
    assert.equal(state.quizSection, false);
    state = advanceP061State(state, terminal - release);
    assert.equal(state.box?.frame, 1);
    assert.equal(state.box?.playing, false);
    assert.equal(state.mainFrame, main);
    assert.equal(state.mainPlaying, false);
    state = dispatchP061State(state, { type: 'continue' });
    assert.equal(state.box, null);
    assert.equal(state.mainPlaying, true);
  }
});

test('conditional identified-host selector is bounded to three wrong and four right choices', () => {
  for (let seed = 0; seed < 12; seed += 1) {
    const source = atStop(860, seed);
    const wrong = dispatchP061State(source, { type: 'answer', ordinal: 1 });
    assert.equal(wrong.feedback?.kind, 'wrong');
    assert.equal(wrong.feedback?.spriteId, P061_WRONG_IDS[seed % 3]);
    assert.equal(wrong.feedback?.frame, 2);
    assert.equal(wrong.activeAudioDomain, `sprite-${P061_WRONG_IDS[seed % 3]}`);
    const right = dispatchP061State(source, { type: 'answer', ordinal: 2 });
    assert.equal(right.feedback?.kind, 'right');
    assert.equal(right.feedback?.spriteId, P061_RIGHT_IDS[seed % 4]);
    assert.equal(right.feedback?.frame, 2);
    assert.equal(right.feedbackSelectionPolicy, 'conditional-indexmi-seeded-modern');
    assert.equal(right.historicalHostAssociationEstablished, false);
  }
});

test('all three wrong options count two terminals; B $750 right resumes once', () => {
  for (const ordinal of [1, 3, 4] as const) {
    let state = dispatchP061State(atStop(860, ordinal), { type: 'answer', ordinal });
    assert.deepEqual(dispatchP061State(state, { type: 'answer', ordinal: 2 }), state);
    state = advanceP061State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.feedback, null);
    assert.equal(state.quizTryCount, 1);
    assert.equal(state.mainFrame, 860);
    assert.equal(state.mainPlaying, false);
    assert.equal(state.quizControlsEnabled, true);
    state = dispatchP061State(state, { type: 'answer', ordinal });
    state = advanceP061State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.feedback, null);
    assert.equal(state.quizTryCount, 0);
    assert.equal(state.quizSection, false);
    assert.equal(state.mainPlaying, true);
    state = advanceP061State(state, 1);
    assert.equal(state.mainFrame, 861);
    assert.equal(state.quizControlsVisible, false);
  }
  let right = dispatchP061State(atStop(860), { type: 'answer', ordinal: 2 });
  right = advanceP061State(right, right.feedback!.terminalFrame - 2);
  assert.equal(right.quizTryCount, 0);
  assert.equal(right.mainPlaying, true);
  assert.equal(right.quizSection, false);
});

test('glossary occurrence visibility, hint closing, pause, navigation and Replay', () => {
  const before = atStop(700);
  assert.deepEqual(dispatchP061State(before, { type: 'glossary-open', key: 'Equivalent decimal' }), before);
  let box = dispatchP061State(before, { type: 'reveal' });
  box = dispatchP061State(box, { type: 'box-play' });
  box = advanceP061State(box, 4);
  box = dispatchP061State(box, { type: 'glossary-open', key: 'Equivalent decimal' });
  assert.equal(box.glossaryKey, 'Equivalent decimal');
  assert.deepEqual(advanceP061State(box, 5), box);
  box = dispatchP061State(box, { type: 'glossary-close' });
  assert.equal(advanceP061State(box, 1).box?.frame, 6);
  let state = atStop(860);
  assert.deepEqual(dispatchP061State(state, { type: 'glossary-open', key: 'Express' }), state);
  state = dispatchP061State(state, { type: 'hint' });
  assert.equal(state.popupVisible, true);
  assert.equal(state.quizControlsEnabled, false);
  for (const key of ['Express', 'Denominator', 'Percent', 'Equivalent fraction', 'Decimal fraction'] as const) {
    const opened = dispatchP061State(state, { type: 'glossary-open', key });
    assert.equal(opened.glossaryKey, key);
    assert.deepEqual(dispatchP061State(opened, { type: 'glossary-close' }), state);
  }
  assert.deepEqual(dispatchP061State(state, { type: 'answer', ordinal: 2 }), state);
  state = dispatchP061State(state, { type: 'glossary-open', key: 'Express' });
  assert.equal(state.glossaryKey, 'Express');
  state = dispatchP061State(state, { type: 'pause' });
  state = dispatchP061State(state, { type: 'glossary-close' });
  assert.equal(state.pausedByUser, true);
  state = dispatchP061State(state, { type: 'popup-close' });
  assert.equal(state.popupVisible, false);
  assert.equal(state.quizControlsEnabled, true);
  assert.deepEqual(dispatchP061State(state, { type: 'answer', ordinal: 2 }), state);
  state = dispatchP061State(state, { type: 'play' });
  state = dispatchP061State(state, { type: 'answer', ordinal: 2 });
  assert.equal(state.feedback?.kind, 'right');
  state = dispatchP061State(state, { type: 'navigate-away' });
  assert.equal(state.activeAudioDomain, null);
  assert.equal(state.mainPlaying, false);
  assert.deepEqual(advanceP061State(state, 100), state);
  assert.deepEqual(dispatchP061State(state, { type: 'continue' }), state);
  assert.deepEqual(dispatchP061State(state, { type: 'replay' }), createP061State());
});

test('input bounds and source placement from main frame 701', () => {
  assert.throws(() => advanceP061State(createP061State(), -1), RangeError);
  assert.throws(() => advanceP061State(createP061State(), 0.5), RangeError);
  let state = dispatchP061State(atStop(700), { type: 'continue' });
  state = advanceP061State(state, 1);
  assert.equal(state.mainFrame, 701);
  state = dispatchP061State(state, { type: 'glossary-open', key: 'Equivalent decimal' });
  assert.equal(state.glossaryKey, 'Equivalent decimal');
  assert.equal(state.mainPlaying, false);
  state = dispatchP061State(state, { type: 'glossary-close' });
  assert.equal(state.mainPlaying, true);
  state = dispatchP061State(state, { type: 'pause' });
  state = dispatchP061State(state, { type: 'glossary-open', key: 'Equivalent decimal' });
  assert.equal(state.pausedByUser, true);
  state = dispatchP061State(state, { type: 'glossary-close' });
  assert.equal(state.activeAudioDomain, null);
  assert.equal(advanceP061State(state, 3).mainFrame, 701);
});

test('Replay restores the original seed after an alternate feedback and navigation', () => {
  const initial = createP061State(7);
  let state = dispatchP061State(atStop(860, 7), { type: 'answer', ordinal: 1 });
  state = advanceP061State(state, state.feedback!.terminalFrame - 2);
  state = dispatchP061State(state, { type: 'navigate-away' });
  assert.deepEqual(dispatchP061State(state, { type: 'replay' }), initial);
});
