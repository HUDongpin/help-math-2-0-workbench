import assert from 'node:assert/strict';
import test from 'node:test';
import geometry from '../../../migrations/shared-alg001-l06-p045/native-v1/answer-hit-geometry-v2.json';
import {initialP045State, reduceP045, P045_SOURCE, P045_CHOICES,
  type P045State, type P045Event} from './alg-l06-p045-state-v1';

function apply(state:P045State, type:string, fields:Partial<P045Event> = {}) {
  const result = reduceP045(state, {type, epoch:state.epoch, ...fields});
  assert.equal(result.accepted, true, result.reason);
  return result;
}
function atQuiz() {
  let state = initialP045State();
  state = apply(state, 'start-main').state;
  state = apply(state, 'advance-main', {frame:53}).state;
  return state;
}
function wrongToTerminal(state:P045State, choice:'A'|'B'|'D') {
  const chosen = apply(state, 'choose', {choice, quizGeneration:state.quizGeneration});
  const token = chosen.state.feedback!.token;
  const held = apply(chosen.state, 'advance-feedback', {token, frame:22});
  assert.equal(held.state.phase, 'wrong-feedback-held');
  assert.equal(reduceP045(held.state, {type:'advance-feedback',
    epoch:held.state.epoch, token, frame:31}).accepted, false);
  const closed = apply(held.state, 'close-wrong', {token});
  assert.equal(closed.state.feedback!.frame, 23);
  assert.ok(closed.effects.some(effect => effect.type === 'answerClips:reset'));
  return apply(closed.state, 'advance-feedback', {token, frame:31});
}

test('physical source, choices and feedback sprites remain pinned', () => {
  assert.equal(P045_SOURCE.swfSha256,
    '9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d');
  assert.equal(P045_SOURCE.separateSaSha256,
    '99404ff17adb3498bf64c033a3063077f3dce961ca52dfc8074f8f84f33dc7e7');
  assert.equal(geometry.correctChoice, 'C');
  assert.deepEqual(Object.entries(P045_CHOICES).map(([label, row]) =>
    [label, row.instance, row.buttonId, row.kind]), geometry.answerPlacements.map(row =>
    [row.label, row.instance, row.buttonId, row.branch === 'right4' ? 'right' : 'wrong']));
  assert.deepEqual(geometry.answerPlacements.map(row => [row.label, row.visibleLabelTextId]),
    [['A', 52], ['B', 37], ['C', 60], ['D', 49]]);
  assert.equal(P045_SOURCE.wrongFeedbackSprite, 307);
  assert.equal(P045_SOURCE.rightFeedbackSprite, 220);
});

test('main holds at 53 and does not invent completion', () => {
  const initial = initialP045State();
  const started = apply(initial, 'start-main');
  const held = apply(started.state, 'advance-main', {frame:53});
  assert.equal(held.state.phase, 'quiz-held');
  assert.equal(held.state.mainPlaying, false);
  assert.equal(held.state.lessonCompleted, false);
  assert.equal(reduceP045(held.state, {type:'advance-main', epoch:0, frame:54}).accepted, false);
});

test('first wrong requires nested Close and permits a fresh choice', () => {
  const quiz = atQuiz();
  const chosen = apply(quiz, 'choose', {choice:'A', quizGeneration:quiz.quizGeneration});
  assert.equal(chosen.state.wrongFeedText,
    'Use the vertical-line test. Try again.');
  const first = wrongToTerminal(quiz, 'A');
  assert.equal(first.state.phase, 'quiz-held');
  assert.equal(first.state.quizTryCount, 1);
  assert.equal(first.state.quizGeneration, quiz.quizGeneration + 1);
  assert.equal(reduceP045(first.state, {type:'choose', epoch:0,
    choice:'C', quizGeneration:quiz.quizGeneration}).accepted, false);
});

test('second wrong resumes the main at 54 without another clickable quiz interval', () => {
  const first = wrongToTerminal(atQuiz(), 'D').state;
  const secondChoice = apply(first, 'choose',
    {choice:'B', quizGeneration:first.quizGeneration});
  assert.equal(secondChoice.state.wrongFeedText,
    'Use the vertical-line test.');
  const second = wrongToTerminal(first, 'B');
  assert.equal(second.state.phase, 'postquiz');
  assert.equal(second.state.mainFrame, 54);
  assert.equal(second.state.quizSection, false);
  assert.equal(second.state.quizButtonsEnabled, false);
  assert.equal(second.effects.some(effect => effect.type === 'host:enableQuizButton'), false);
});

test('right C after a wrong answer resumes and reaches only engineering end', () => {
  const first = wrongToTerminal(atQuiz(), 'A').state;
  const right = apply(first, 'choose',
    {choice:'C', quizGeneration:first.quizGeneration});
  assert.equal(right.state.feedback!.spriteId, 220);
  const resumed = apply(right.state, 'advance-feedback',
    {token:right.state.feedback!.token, frame:25});
  assert.equal(resumed.state.quizTryCount, 1);
  assert.equal(resumed.state.mainFrame, 54);
  const ended = apply(resumed.state, 'advance-main', {frame:167});
  assert.equal(ended.state.phase, 'engineering-end-held');
  assert.equal(ended.state.lessonCompleted, false);
});

test('NMH glossary returns to popup without audio, then closes', () => {
  const quiz = atQuiz();
  const popup = apply(quiz, 'open-nmh', {quizGeneration:quiz.quizGeneration});
  assert.equal(popup.state.phase, 'nmh-popup');
  const glossary = apply(popup.state, 'glossary',
    {buttonId:142, quizGeneration:quiz.quizGeneration});
  assert.ok(glossary.effects.some(effect => effect.type === 'host:DoHyperLinks' &&
    effect.keyAttribute === 'Vertical-line test'));
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
    {choice:'C', quizGeneration:quiz.quizGeneration});
  const oldToken = chosen.state.feedback!.token;
  const oldOwner = chosen.state.audioOwner;
  const replay = apply(chosen.state, 'replay');
  assert.equal(replay.state.mainFrame, 1);
  assert.equal(replay.state.epoch, 1);
  assert.equal(replay.effects.some(effect => effect.type === 'audio:intent'), false);
  assert.equal(reduceP045(replay.state, {type:'advance-feedback',
    epoch:0, token:oldToken, frame:25}).accepted, false);
  assert.equal(reduceP045(replay.state, {type:'audio-complete',
    epoch:1, owner:oldOwner!}).accepted, false);
  const left = apply(replay.state, 'leave');
  assert.equal(left.state.phase, 'left');
  assert.ok(left.effects.some(effect => effect.type === 'host:cleanup'));
});
