import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AlgL06P014QuizStateV1, P014_RIGHT_BRANCHES, P014_WRONG_BRANCHES,
} from '../src/alg-l06-p014-state-v1';

function heldQuiz(): AlgL06P014QuizStateV1 {
  const state = new AlgL06P014QuizStateV1();
  state.play();
  state.advanceMain(449);
  assert.equal(state.snapshot().mainFrame, 120);
  assert.equal(state.snapshot().phase, 'awaiting-answer');
  return state;
}

function finishWrong(state: AlgL06P014QuizStateV1, token: number, hold: number, terminal: number): void {
  state.advanceFeedback(terminal);
  assert.equal(state.snapshot().feedbackFrame, hold);
  assert.equal(state.snapshot().feedbackAwaitingAcknowledgment, true);
  assert.equal(state.snapshot().feedbackPlaying, false);
  state.play();
  state.advanceFeedback(terminal);
  assert.equal(state.snapshot().feedbackFrame, hold, 'ordinary Play cannot bypass source popup');
  state.completeFeedback(token, terminal);
  assert.equal(state.snapshot().phase, 'feedback');
  state.acknowledgeFeedback(token);
  assert.equal(state.snapshot().feedbackFrame, hold + 1);
  assert.equal(state.snapshot().feedbackPlaying, true);
  state.advanceFeedback(terminal);
  state.completeFeedback(token, terminal);
}

test('source frame 120 stops main and gates answer until feedback terminal', () => {
  const state = new AlgL06P014QuizStateV1();
  assert.equal(state.snapshot().answersEnabled, false);
  state.answer('AnsBtn2', 1);
  assert.equal(state.snapshot().phase, 'before-quiz');
  state.play();
  state.advanceMain(119);
  assert.equal(state.snapshot().mainFrame, 119);
  state.advanceMain(449);
  assert.equal(state.snapshot().mainFrame, 120);
  assert.equal(state.snapshot().playing, false);
  assert.equal(state.snapshot().quizSection, true);
  assert.equal(state.snapshot().tryCount, 0);
  assert.equal(state.snapshot().answersEnabled, true);
  state.play();
  state.advanceMain(121);
  assert.equal(state.snapshot().mainFrame, 120);
});

test('all source answer instances and explicit host branch ordinals map to exact domains', () => {
  for (const row of P014_RIGHT_BRANCHES) {
    const state = heldQuiz();
    const feedback = state.answer('AnsBtn2', row.ordinal);
    assert.equal(feedback.feedbackKind, 'right');
    assert.equal(feedback.feedbackDomain, row.domain);
    assert.equal(feedback.feedbackPlaying, true);
  }
  for (const row of P014_WRONG_BRANCHES) {
    for (const instance of ['AnsBtn1', 'AnsBtn3', 'AnsBtn4'] as const) {
      const state = heldQuiz();
      const feedback = state.answer(instance, row.ordinal);
      assert.equal(feedback.feedbackKind, 'wrong');
      assert.equal(feedback.feedbackDomain, row.domain);
      assert.equal(feedback.feedbackHoldFrame, row.holdFrame);
      assert.equal(feedback.feedbackAckButtonCharacterId, row.ackButtonCharacterId);
      assert.match(feedback.feedbackText ?? '', /Try again\.$/u);
    }
  }
});

test('first wrong retries at held quiz; second wrong resumes main with different text', () => {
  const state = heldQuiz();
  const first = state.answer('AnsBtn1', 3);
  assert.equal(first.feedbackDomain, 'sprite-28');
  assert.equal(first.answersEnabled, false);
  state.advanceMain(121);
  assert.equal(state.snapshot().mainFrame, 120);
  finishWrong(state, first.feedbackToken!, 20, 28);
  assert.equal(state.snapshot().phase, 'awaiting-answer');
  assert.equal(state.snapshot().tryCount, 1);
  assert.equal(state.snapshot().answersEnabled, true);
  assert.equal(state.snapshot().mainResumeRequested, false);
  const second = state.answer('AnsBtn4', 2);
  assert.equal(second.feedbackDomain, 'sprite-187');
  assert.doesNotMatch(second.feedbackText ?? '', /Try again/u);
  state.completeFeedback(first.feedbackToken!, 28);
  assert.equal(state.snapshot().phase, 'feedback');
  finishWrong(state, second.feedbackToken!, 23, 29);
  assert.equal(state.snapshot().phase, 'post-quiz');
  assert.equal(state.snapshot().tryCount, 0);
  assert.equal(state.snapshot().quizSection, false);
  assert.equal(state.snapshot().mainResumeRequested, true);
  state.advanceMain(125);
  assert.equal(state.snapshot().mainFrame, 125);
  assert.equal(state.snapshot().mainResumeRequested, false);
});

test('correct branch resumes after nested feedback terminal', () => {
  const state = heldQuiz();
  const right = state.answer('AnsBtn2', 4);
  assert.equal(right.feedbackDomain, 'sprite-148');
  state.advanceFeedback(27);
  state.completeFeedback(right.feedbackToken!, 27);
  assert.equal(state.snapshot().phase, 'post-quiz');
  assert.equal(state.snapshot().quizSection, false);
  assert.equal(state.snapshot().mainResumeRequested, true);
  state.advanceMain(449);
  assert.equal(state.snapshot().mainFrame, 449);
  assert.equal(state.snapshot().playing, false);
  assert.equal(state.snapshot().lessonCompleted, false);
});

test('right after one wrong preserves source quizTryCount until Replay', () => {
  const state=heldQuiz();
  const wrong=state.answer('AnsBtn1',1);
  finishWrong(state,wrong.feedbackToken!,22,31);
  assert.equal(state.snapshot().tryCount,1);
  const right=state.answer('AnsBtn2',1);
  state.advanceFeedback(25);
  state.completeFeedback(right.feedbackToken!,25);
  assert.equal(state.snapshot().phase,'post-quiz');
  assert.equal(state.snapshot().quizSection,false);
  assert.equal(state.snapshot().tryCount,1,'right terminal has no source reset');
  state.replay();
  assert.equal(state.snapshot().tryCount,0);
});

test('glossary and pause suspend feedback; explicit play resumes it', () => {
  const state = heldQuiz();
  const wrong = state.answer('AnsBtn3', 1);
  state.openGlossary('Input');
  assert.equal(state.snapshot().feedbackPlaying, false);
  assert.equal(state.snapshot().answersEnabled, false);
  state.completeFeedback(wrong.feedbackToken!, 31);
  assert.equal(state.snapshot().phase, 'feedback');
  state.closeGlossary();
  state.completeFeedback(wrong.feedbackToken!, 31);
  assert.equal(state.snapshot().phase, 'feedback');
  state.play();
  state.pause();
  state.completeFeedback(wrong.feedbackToken!, 31);
  assert.equal(state.snapshot().phase, 'feedback');
  state.play();
  state.advanceFeedback(31);
  assert.equal(state.snapshot().feedbackFrame, 22);
  state.completeFeedback(wrong.feedbackToken!, 31);
  assert.equal(state.snapshot().phase, 'feedback');
  state.acknowledgeFeedback(wrong.feedbackToken!);
  state.advanceFeedback(31);
  state.completeFeedback(wrong.feedbackToken!, 31);
  assert.equal(state.snapshot().phase, 'awaiting-answer');
  state.openGlossary('Output');
  assert.equal(state.snapshot().answersEnabled, false);
  state.closeGlossary();
  assert.equal(state.snapshot().answersEnabled, true);
});

test('Replay and navigation cancel stale branch callbacks and glossary state', () => {
  const state = heldQuiz();
  const right = state.answer('AnsBtn2', 1);
  state.openGlossary('Input');
  state.replay();
  assert.equal(state.snapshot().phase, 'before-quiz');
  assert.equal(state.snapshot().mainFrame, 1);
  assert.equal(state.snapshot().feedbackDomain, null);
  assert.equal(state.snapshot().glossaryOpen, null);
  state.completeFeedback(right.feedbackToken!, 25);
  assert.equal(state.snapshot().phase, 'before-quiz');
  state.navigateAway();
  assert.equal(state.snapshot().phase, 'closed');
  state.play();
  state.replay();
  assert.equal(state.snapshot().phase, 'closed');
});

test('invalid branch ordinal never enters feedback', () => {
  const state = heldQuiz();
  assert.throws(() => state.answer('AnsBtn2', 5), RangeError);
  assert.equal(state.snapshot().phase, 'awaiting-answer');
});
