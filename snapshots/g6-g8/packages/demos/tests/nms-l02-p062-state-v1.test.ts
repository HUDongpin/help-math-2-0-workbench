import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P062_MAIN_FRAMES, P062_RIGHT_IDS, P062_SOURCE_GLOSSARY_CONTROLS_PRESENT,
  P062_SOURCE_RIGHT_IDS, P062_SOURCE_SHA, P062_SOURCE_WRONG_IDS,
  P062_STOPS, P062_WRONG_IDS, advanceP062State, createP062State,
  dispatchP062State, p062SourceFrame, type P062State,
} from '../src/nms-l02-p062-state-v1';

function atStop(frame: 384 | 523 | 650 | 766 | 815, seed = 0): P062State {
  let state = createP062State(seed);
  for (const stop of P062_STOPS) {
    state = advanceP062State(state, stop - state.mainFrame);
    assert.equal(state.mainFrame, stop);
    assert.equal(state.mainPlaying, false);
    if (stop === frame) return state;
    state = dispatchP062State(state, {type: 'continue'});
  }
  throw Error(`unreachable ${frame}`);
}

test('exact source bounds and no invented glossary contract', () => {
  assert.equal(P062_SOURCE_SHA, '5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50');
  assert.equal(P062_MAIN_FRAMES, 837);
  assert.deepEqual(P062_STOPS, [384, 523, 650, 766, 815, 834]);
  assert.deepEqual(P062_SOURCE_WRONG_IDS, [85, 138, 150, 178, 192]);
  assert.deepEqual(P062_SOURCE_RIGHT_IDS, [288, 230, 209, 256, 302]);
  assert.equal(P062_SOURCE_GLOSSARY_CONTROLS_PRESENT, false);
  for (let frame = 1; frame <= P062_MAIN_FRAMES; frame += 1) {
    const source = p062SourceFrame(frame);
    assert.equal(source.sourceStop, P062_STOPS.some(stop => stop === frame));
    assert.equal(source.mainStreamBlockPresent, frame >= 9 && frame <= 828);
  }
  assert.equal(p062SourceFrame(815).sourceQuizTryCountReset, true);
  assert.equal(p062SourceFrame(816).sourceQuizSectionAssignment, false);
  for (const frame of [0, 838, 1.5, NaN]) assert.throws(() => p062SourceFrame(frame), RangeError);
  for (const seed of [-1, 2 ** 32, 0.5]) assert.throws(() => createP062State(seed), RangeError);
  const state = createP062State();
  assert.equal(state.originalRuntimeParityEstablished, false);
  assert.equal(state.historicalHostAssociationEstablished, false);
  assert.equal(state.sourceGlossaryControlsPresent, false);
});

test('four early source stops require release and quiz reaches terminal 834', () => {
  let state = advanceP062State(createP062State(), 1000);
  assert.equal(state.mainFrame, 384);
  assert.equal(state.quizSection, true);
  assert.equal(state.aTextVisible, false);
  assert.deepEqual(advanceP062State(state, 100), state);
  for (const stop of [523, 650, 766, 815] as const) {
    state = dispatchP062State(state, {type: 'continue'});
    state = advanceP062State(state, stop - state.mainFrame);
    assert.equal(state.mainFrame, stop);
    assert.equal(state.mainPlaying, false);
  }
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.quizControlsVisible, true);
  assert.deepEqual(dispatchP062State(state, {type: 'continue'}), state);
  state = dispatchP062State(state, {type: 'answer', ordinal: 3});
  state = advanceP062State(state, state.feedback!.terminalFrame - 2);
  assert.equal(state.mainPlaying, true);
  state = advanceP062State(state, 19);
  assert.equal(state.mainFrame, 834);
  assert.equal(state.quizSection, false);
  assert.equal(state.quizControlsVisible, false);
  assert.deepEqual(advanceP062State(state, 20), state);
});

test('help 106 and 122 retain separate local stops and do not themselves resume main', () => {
  for (const [main, id, release, terminal] of [
    [650, 106, 15, 20], [766, 122, 21, 27],
  ] as const) {
    let state = dispatchP062State(atStop(main), {type: 'reveal'});
    assert.deepEqual(state.box, {spriteId: id, frame: 1, releaseFrame: release,
      terminalFrame: terminal, playing: false});
    assert.equal(state.revealClipVisible, false);
    assert.deepEqual(advanceP062State(state, 50), state);
    state = dispatchP062State(state, {type: 'box-play'});
    state = advanceP062State(state, release - 1);
    assert.equal(state.box?.frame, release);
    assert.equal(state.box?.playing, false);
    state = dispatchP062State(state, {type: 'box-release'});
    state = advanceP062State(state, terminal - release);
    assert.equal(state.box?.frame, 1);
    assert.equal(state.mainFrame, main);
    assert.equal(state.mainPlaying, false);
    state = dispatchP062State(state, {type: 'continue'});
    assert.equal(state.mainPlaying, true);
    assert.equal(state.box, null);
  }
});

test('answer 3 is right; other three are wrong and conditional feedback sets stay bounded', () => {
  for (let seed = 0; seed < 12; seed += 1) {
    const source = atStop(815, seed);
    const right = dispatchP062State(source, {type: 'answer', ordinal: 3});
    assert.equal(right.feedback?.kind, 'right');
    assert.equal(right.feedback?.spriteId, P062_RIGHT_IDS[seed % 4]);
    assert.equal(right.feedback?.frame, 2);
    assert.equal(right.historicalHostAssociationEstablished, false);
    for (const ordinal of [1, 2, 4] as const) {
      const wrong = dispatchP062State(source, {type: 'answer', ordinal});
      assert.equal(wrong.feedback?.kind, 'wrong');
      assert.equal(wrong.feedback?.spriteId, P062_WRONG_IDS[seed % 3]);
      assert.equal(wrong.activeAudioDomain, `sprite-${P062_WRONG_IDS[seed % 3]}`);
    }
  }
});

test('wrong feedback resumes only after second terminal, correct after first', () => {
  for (const ordinal of [1, 2, 4] as const) {
    let state = dispatchP062State(atStop(815, ordinal), {type: 'answer', ordinal});
    assert.deepEqual(dispatchP062State(state, {type: 'answer', ordinal: 3}), state);
    state = advanceP062State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.quizTryCount, 1);
    assert.equal(state.mainFrame, 815);
    assert.equal(state.mainPlaying, false);
    assert.equal(state.quizControlsEnabled, true);
    state = dispatchP062State(state, {type: 'answer', ordinal});
    state = advanceP062State(state, state.feedback!.terminalFrame - 2);
    assert.equal(state.quizTryCount, 0);
    assert.equal(state.mainPlaying, true);
    state = advanceP062State(state, 1);
    assert.equal(state.mainFrame, 816);
    assert.equal(state.quizControlsVisible, false);
  }
  let right = dispatchP062State(atStop(815), {type: 'answer', ordinal: 3});
  right = advanceP062State(right, right.feedback!.terminalFrame - 2);
  assert.equal(right.mainPlaying, true);
  assert.equal(right.quizTryCount, 0);
});

test('quiz popup, explicit pause, Replay and navigation cleanup', () => {
  let state = atStop(815, 7);
  state = dispatchP062State(state, {type: 'hint'});
  assert.equal(state.popupVisible, true);
  assert.equal(state.quizControlsEnabled, false);
  assert.deepEqual(dispatchP062State(state, {type: 'answer', ordinal: 3}), state);
  state = dispatchP062State(state, {type: 'pause'});
  state = dispatchP062State(state, {type: 'popup-close'});
  assert.equal(state.popupVisible, false);
  assert.equal(state.quizControlsEnabled, true);
  assert.equal(state.pausedByUser, true);
  assert.deepEqual(dispatchP062State(state, {type: 'answer', ordinal: 3}), state);
  state = dispatchP062State(state, {type: 'play'});
  state = dispatchP062State(state, {type: 'answer', ordinal: 3});
  assert.equal(state.feedback?.kind, 'right');
  state = dispatchP062State(state, {type: 'navigate-away'});
  assert.equal(state.activeAudioDomain, null);
  assert.deepEqual(advanceP062State(state, 100), state);
  assert.deepEqual(dispatchP062State(state, {type: 'replay'}), createP062State(7));
  assert.throws(() => advanceP062State(state, -1), RangeError);
  assert.throws(() => advanceP062State(state, 0.5), RangeError);
});
