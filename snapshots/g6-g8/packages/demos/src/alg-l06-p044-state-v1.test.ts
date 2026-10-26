import assert from 'node:assert/strict';
import test from 'node:test';
import {initialP044State, reduceP044, P044_SOURCE, P044_CHOICES,
  type P044State, type P044Event} from './alg-l06-p044-state-v1';

function apply(state:P044State, type:string, fields:Partial<P044Event> = {}) {
  const result = reduceP044(state, {type, epoch:state.epoch, ...fields});
  assert.equal(result.accepted, true, result.reason);
  return result;
}
function atQuiz() {
  let state = initialP044State();
  state = apply(state, 'start-main').state;
  state = apply(state, 'advance-main', {frame:53}).state;
  return state;
}
function wrongToTerminal(state:P044State, choice:'A'|'C'|'D') {
  const chosen = apply(state, 'choose', {choice, quizGeneration:state.quizGeneration});
  const token = chosen.state.feedback!.token;
  const held = apply(chosen.state, 'advance-feedback', {token, frame:20});
  assert.equal(held.state.phase, 'wrong-feedback-held');
  assert.equal(reduceP044(held.state, {type:'advance-feedback',
    epoch:held.state.epoch, token, frame:28}).accepted, false);
  const closed = apply(held.state, 'close-wrong', {token});
  assert.equal(closed.state.feedback!.frame, 21);
  assert.ok(closed.effects.some(effect => effect.type === 'answerClips:reset'));
  return apply(closed.state, 'advance-feedback', {token, frame:28});
}

test('physical source, choices and feedback sprites remain pinned', () => {
  assert.equal(P044_SOURCE.swfSha256,
    '50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34');
  assert.equal(P044_SOURCE.separateSaSha256,
    '11784e80c090326e9d4f2863ae54d1bcd25d454a4e325d76516f415e377e3abb');
  assert.deepEqual(Object.entries(P044_CHOICES).map(([label, row]) =>
    [label, row.text, row.buttonId, row.kind]), [
    ['A', '{(0, –1), (0, 0), (0, 1)}', 161, 'wrong'],
    ['B', '{(5, 1), (10, 1), (15, 1)}', 162, 'right'],
    ['C', '{(2, –2), (2, 0), (–2, 0)}', 161, 'wrong'],
    ['D', '{(–5, –4), (–4, –3), (–5, –1)}', 161, 'wrong'],
  ]);
  assert.equal(P044_SOURCE.wrongFeedbackSprite, 336);
  assert.equal(P044_SOURCE.rightFeedbackSprite, 198);
});

test('main holds at 53 and does not invent completion', () => {
  const initial = initialP044State();
  const started = apply(initial, 'start-main');
  const held = apply(started.state, 'advance-main', {frame:53});
  assert.equal(held.state.phase, 'quiz-held');
  assert.equal(held.state.mainPlaying, false);
  assert.equal(held.state.lessonCompleted, false);
  assert.equal(reduceP044(held.state, {type:'advance-main', epoch:0, frame:54}).accepted, false);
});

test('first wrong requires nested Close and permits a fresh choice', () => {
  const quiz = atQuiz();
  const chosen = apply(quiz, 'choose', {choice:'A', quizGeneration:quiz.quizGeneration});
  assert.equal(chosen.state.wrongFeedText,
    'All the x-coordinates must be different in a function. Try again.');
  const first = wrongToTerminal(quiz, 'A');
  assert.equal(first.state.phase, 'quiz-held');
  assert.equal(first.state.quizTryCount, 1);
  assert.equal(first.state.quizGeneration, quiz.quizGeneration + 1);
  assert.equal(reduceP044(first.state, {type:'choose', epoch:0,
    choice:'B', quizGeneration:quiz.quizGeneration}).accepted, false);
});

test('second wrong resumes the main at 54 without another clickable quiz interval', () => {
  const first = wrongToTerminal(atQuiz(), 'D').state;
  const secondChoice = apply(first, 'choose',
    {choice:'C', quizGeneration:first.quizGeneration});
  assert.equal(secondChoice.state.wrongFeedText,
    'All the x-coordinates must be different in a function.');
  const second = wrongToTerminal(first, 'C');
  assert.equal(second.state.phase, 'postquiz');
  assert.equal(second.state.mainFrame, 54);
  assert.equal(second.state.quizSection, false);
  assert.equal(second.state.quizButtonsEnabled, false);
  assert.equal(second.effects.some(effect => effect.type === 'host:enableQuizButton'), false);
});

test('right B after a wrong answer resumes and reaches only engineering end', () => {
  const first = wrongToTerminal(atQuiz(), 'A').state;
  const right = apply(first, 'choose',
    {choice:'B', quizGeneration:first.quizGeneration});
  assert.equal(right.state.feedback!.spriteId, 198);
  const resumed = apply(right.state, 'advance-feedback',
    {token:right.state.feedback!.token, frame:31});
  assert.equal(resumed.state.quizTryCount, 1);
  assert.equal(resumed.state.mainFrame, 54);
  const ended = apply(resumed.state, 'advance-main', {frame:275});
  assert.equal(ended.state.phase, 'engineering-end-held');
  assert.equal(ended.state.lessonCompleted, false);
});

test('NMH glossary returns to popup without audio, then closes', () => {
  const quiz = atQuiz();
  const popup = apply(quiz, 'open-nmh', {quizGeneration:quiz.quizGeneration});
  assert.equal(popup.state.phase, 'nmh-popup');
  const glossary = apply(popup.state, 'glossary',
    {buttonId:137, quizGeneration:quiz.quizGeneration});
  assert.ok(glossary.effects.some(effect => effect.type === 'host:DoHyperLinks' &&
    effect.keyAttribute === 'Relation'));
  const returned = apply(glossary.state, 'close-glossary',
    {quizGeneration:quiz.quizGeneration});
  assert.equal(returned.state.phase, 'nmh-popup');
  assert.equal(returned.state.audioOwner, null);
  const closed = apply(returned.state, 'close-nmh',
    {quizGeneration:quiz.quizGeneration});
  assert.equal(closed.state.phase, 'quiz-held');
});

test('Replay and leave invalidate callbacks without SA autoplay', () => {
  const quiz = atQuiz();
  const chosen = apply(quiz, 'choose',
    {choice:'B', quizGeneration:quiz.quizGeneration});
  const oldToken = chosen.state.feedback!.token;
  const oldOwner = chosen.state.audioOwner;
  const replay = apply(chosen.state, 'replay');
  assert.equal(replay.state.mainFrame, 1);
  assert.equal(replay.state.epoch, 1);
  assert.equal(replay.effects.some(effect => effect.type === 'audio:intent'), false);
  assert.equal(reduceP044(replay.state, {type:'advance-feedback',
    epoch:0, token:oldToken, frame:31}).accepted, false);
  assert.equal(reduceP044(replay.state, {type:'audio-complete',
    epoch:1, owner:oldOwner!}).accepted, false);
  const left = apply(replay.state, 'leave');
  assert.equal(left.state.phase, 'left');
  assert.ok(left.effects.some(effect => effect.type === 'host:cleanup'));
});
