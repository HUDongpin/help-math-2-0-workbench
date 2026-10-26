import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {initialP050State, p050PresentationState, p050Question, reduceP050,
  type P050State, type P050Event, type P050Choice} from './alg-l06-p050-state-v1';
import {P050_SOURCE} from './alg-l06-p050-source-bindings-v1';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const extraction = JSON.parse(fs.readFileSync(path.join(root,
  'migrations/shared-alg001-l06-p050/audit-v1/source-extraction-v1.json'), 'utf8'));
const script = (relative: string) => fs.readFileSync(path.join(extraction.exportRoot, 'scripts', relative), 'utf8');
const expectedAnswers = ['D', 'A', 'B', 'D', 'C', 'A', 'B', 'C', 'D', 'B'] as const;

function step(s: P050State, e: Omit<P050Event, 'epoch'>) {
  const transition = reduceP050(s, {...e, epoch: s.epoch});
  assert(transition.accepted, transition.reason);
  return transition.state;
}
function start(seed = 0) {
  const requested = step(initialP050State(seed), {type: 'start-game'});
  assert.equal(requested.phase, 'begin');
  assert.equal(requested.drawCount, 0);
  return step(requested, {type: 'enter-frame'});
}
function choose(s: P050State, correct: boolean) {
  assert.notEqual(s.questionId, null);
  const answer = expectedAnswers[s.questionId! - 1]!;
  const choice: P050Choice = correct ? answer : answer === 'A' ? 'B' : 'A';
  return step(s, {type: 'choose', questionGeneration: s.questionGeneration, choice});
}
function finish(s: P050State) {
  assert(s.feedback);
  const token = s.feedback.token;
  if (s.scoreAnimation) s = step(s, {type: 'advance-score', token, frame: 20});
  if (s.feedback!.kind === 'wrong') {
    s = step(s, {type: 'advance-feedback', token, frame: 28});
    assert.equal(s.phase, 'wrong-held');
    assert.equal(s.feedback!.frame, 23);
    assert(p050PresentationState(s).wrongPopupVisible);
    s = step(s, {type: 'close-wrong', token});
    assert.equal(s.feedback!.frame, 24);
    assert(!p050PresentationState(s).wrongPopupVisible);
  }
  return step(s, {type: 'advance-feedback', token, frame: s.feedback!.endFrame});
}

test('all ten bindings agree with independent letter expectations and actual AS releases', () => {
  assert.deepEqual(P050_SOURCE.questions.map(q => q.correctChoice), expectedAnswers);
  for (const question of P050_SOURCE.questions) {
    assert.equal(question.frame, 662 + question.number);
    const stateScript = script(`DefineSprite_489/frame_${question.frame}/DoAction.as`);
    assert.match(stateScript, /random\(3\)/);
    for (const option of question.options) {
      const release = script(`DefineButton2_${option.buttonId}/BUTTONCONDACTION on(release).as`);
      assert.equal(release.includes('_global.score += 10'), option.letter === expectedAnswers[question.number - 1]);
      assert.equal(option.sourceLetter.letter, option.letter);
      assert(option.sourceLetter.overlap >= .5);
      if (!option.correct) assert(release.includes(`Sorry, the correct answer was ${question.correctChoice}.`));
    }
    const end = script(`DefineSprite_${question.correctFeedbackSpriteId}/frame_${question.correctFeedbackEndFrame}/DoAction.as`);
    assert.match(end, /_parent.doGetRandomQuiz\(\)/);
  }
  assert.match(script('DefineSprite_489/frame_662/DoAction_2.as'), /quizLabelArray.splice\(_loc1_.tempQNo,1\)/);
  assert.match(script('DefineSprite_380/frame_28/DoAction.as'), /_parent.doGetRandomQuiz\(\)/);
});

test('Start, Skip and natural intro completion preserve the source held beginning', () => {
  let s = initialP050State();
  assert.equal(reduceP050(s, {type: 'advance-main', epoch: 0, frame: 662}).accepted, false);
  s = step(s, {type: 'play'});
  s = step(s, {type: 'advance-main', frame: 72});
  s = step(s, {type: 'advance-main', frame: 674});
  assert.equal(s.mainFrame, 662);
  assert.equal(s.drawCount, 0);
  assert.equal(s.phase, 'begin');
  assert.equal(s.audioOwner, null);
  assert.equal(reduceP050(s, {type: 'enter-frame', epoch: 0}).accepted, false);
  s = step(s, {type: 'start-game'});
  s = step(s, {type: 'enter-frame'});
  assert.equal(s.drawCount, 1);
  assert.equal(reduceP050(s, {type: 'enter-frame', epoch: 0}).accepted, false);
  const skipped = step(initialP050State(), {type: 'skip-intro'});
  assert.equal(skipped.startRequested, false);
  assert.equal(skipped.mainFrame, 662);
  assert.match(script('DefineButton2_34/BUTTONCONDACTION on(release).as'), /startGame = true/);
  assert.doesNotMatch(script('DefineButton2_38/BUTTONCONDACTION on(release).as'), /startGame/);
});

test('ten correct responses draw without replacement, earn100 and hold authored Final', () => {
  let s = start(88);
  for (let n = 1; n <= 10; n++) {
    assert.equal(s.phase, 'question');
    assert.equal(s.drawCount, n);
    const answering = s;
    s = choose(s, true);
    assert.equal(s.score, n * 10);
    assert.equal(s.responses.length, n);
    assert.equal(s.order.length, n);
    assert.equal(s.scoreAnimation!.endFrame, n === 10 ? 20 : 10);
    assert.equal(reduceP050(s, {type: 'choose', epoch: s.epoch,
      questionGeneration: answering.questionGeneration, choice: 'A'}).accepted, false);
    s = finish(s);
  }
  assert.equal(new Set(s.order).size, 10);
  assert.equal(s.remaining.length, 0);
  assert.equal(s.phase, 'final');
  assert.equal(s.mainFrame, 673);
  assert.equal(s.drawCount, 11);
  assert.equal(s.scoreAnimation, null);
  assert.equal(s.lessonCompleted, false);
  assert.equal(p050PresentationState(s).sourceFinalClipResolved, false);
  assert.equal(s.audioOwner, null);
});

test('wrong draws exhaust all branch identities and never deduct or retry a question', () => {
  const branches = new Set<number>();
  for (let seed = 0; seed < 32; seed++) {
    let s = start(seed);
    for (let n = 1; n <= 10; n++) {
      const id = s.questionId;
      s = choose(s, false);
      branches.add(s.feedback!.branch!);
      assert.equal(s.feedback!.spriteId, 380);
      assert.equal(s.score, 0);
      assert.equal(s.wrongText, `Sorry, the correct answer was ${expectedAnswers[id! - 1]}.`);
      s = finish(s);
      assert.equal(s.remaining.includes(id!), false);
    }
    assert.equal(s.responses.length, 10);
    assert.equal(s.order.length, 10);
    assert.equal(new Set(s.order).size, 10);
    assert.equal(s.phase, 'final');
  }
  assert.deepEqual([...branches].sort(), [1, 2, 3]);
});

test('score clock uses distinct100-point branch without incrementing score twice', () => {
  let s = start(1);
  for (let i = 0; i < 9; i++) s = finish(choose(s, true));
  s = choose(s, true);
  const token = s.scoreAnimation!.token;
  s = step(s, {type: 'advance-score', token, frame: 3});
  assert.equal(s.scoreAnimation!.frame, 11);
  s = step(s, {type: 'advance-score', token, frame: 19});
  assert.equal(s.score, 100);
  s = step(s, {type: 'advance-score', token, frame: 20});
  assert.equal(p050PresentationState(s).scoreFrame, 1);
  assert.equal(reduceP050(s, {type: 'advance-score', epoch: s.epoch, token, frame: 20}).accepted, false);
  assert.match(script('DefineSprite_265/frame_2/DoAction.as'), /score >= 100/);
});

test('wrong hold cannot be skipped by a late frame or closed before frame23', () => {
  let s = choose(start(), false);
  const token = s.feedback!.token;
  assert.equal(reduceP050(s, {type: 'close-wrong', epoch: s.epoch, token}).accepted, false);
  s = step(s, {type: 'advance-feedback', token, frame: 17});
  assert(p050PresentationState(s).wrongPopupVisible);
  s = step(s, {type: 'advance-feedback', token, frame: 28});
  assert.equal(s.feedback!.frame, 23);
  assert.equal(s.drawCount, 1);
  assert.equal(reduceP050(s, {type: 'advance-feedback', epoch: 0, token, frame: 28}).accepted, false);
  assert.equal(reduceP050(s, {type: 'close-wrong', epoch: 0, token: 'stale'}).accepted, false);
  assert.match(script('DefineButton2_376/BUTTONCONDACTION on(release).as'), /gotoAndPlay\(24\)/);
});

test('directions preserve question, score, random state and do not replay audio', () => {
  let s = start();
  const before = s;
  const opened = reduceP050(s, {type: 'open-directions', epoch: 0, questionGeneration: s.questionGeneration});
  assert(opened.accepted);
  assert(opened.effects.every(e => !e.type.startsWith('audio:')));
  s = opened.state;
  assert(!p050PresentationState(s).questionEnabled);
  assert.equal(reduceP050(s, {type: 'choose', epoch: 0, questionGeneration: s.questionGeneration, choice: 'A'}).accepted, false);
  s = step(s, {type: 'close-directions', questionGeneration: s.questionGeneration});
  assert.deepEqual(s, before);
  const feedback = choose(s, true);
  assert.equal(reduceP050(feedback, {type: 'open-directions', epoch: 0, questionGeneration: s.questionGeneration}).accepted, false);
  assert.doesNotMatch(script('DefineButton2_257/BUTTONCONDACTION on(release).as'), /gotoAndPlay|play\(/);
});

test('pause/resume owns a fresh audio identity and rejects stale callbacks', () => {
  let s = choose(start(), true);
  const owner = s.audioOwner!;
  const token = s.feedback!.token;
  s = step(s, {type: 'pause'});
  assert.equal(reduceP050(s, {type: 'advance-feedback', epoch: 0, token, frame: 3}).accepted, false);
  s = step(s, {type: 'play'});
  assert.notEqual(s.audioOwner, owner);
  assert.equal(reduceP050(s, {type: 'audio-complete', epoch: 0, owner}).accepted, false);
  const before = s.mainFrame;
  s = step(s, {type: 'audio-complete', owner: s.audioOwner!});
  assert.equal(s.mainFrame, before);
  assert.equal(s.phase, 'correct-feedback');
});

test('Replay and leave invalidate all old question, feedback and audio callbacks', () => {
  const intro = step(initialP050State(7), {type: 'play'});
  const question = start(7);
  const wrong = choose(question, false);
  const held = step(wrong, {type: 'advance-feedback', token: wrong.feedback!.token, frame: 23});
  const states = [intro, question, wrong, held, step(held, {type: 'close-wrong', token: held.feedback!.token}),
    choose(question, true), step(question, {type: 'open-directions', questionGeneration: question.questionGeneration})];
  for (const s of states) {
    for (const type of ['replay', 'leave'] as const) {
      const result = reduceP050(s, {type, epoch: s.epoch});
      assert(result.accepted);
      const after = result.state;
      assert.equal(after.epoch, s.epoch + 1);
      assert.equal(after.score, 0);
      assert.deepEqual(after.remaining, [1,2,3,4,5,6,7,8,9,10]);
      assert.deepEqual(after.responses, []);
      assert.equal(after.feedback, null);
      assert.equal(after.audioOwner, null);
      assert.equal(after.directionsOpen, false);
      assert.equal(after.phase, type === 'leave' ? 'left' : 'intro');
      assert(result.effects.some(e => e.type === 'audio:cancelAll'));
      for (const event of [
        {type: 'choose', questionGeneration: s.questionGeneration, choice: 'A'},
        {type: 'advance-feedback', token: s.feedback?.token, frame: 28},
        {type: 'audio-complete', owner: s.audioOwner ?? undefined},
      ] as const) assert.equal(reduceP050(after, {...event, epoch: s.epoch}).accepted, false);
    }
  }
});

test('source Final Start is not silently turned into full Replay', () => {
  let s = start(3);
  for (let i = 0; i < 10; i++) s = finish(choose(s, i % 2 === 0));
  assert.equal(s.score, 50);
  const requested = step(s, {type: 'start-game'});
  const result = reduceP050(requested, {type: 'enter-frame', epoch: requested.epoch});
  assert(result.accepted);
  assert.equal(result.state.phase, 'final');
  assert.equal(result.state.drawCount, 12);
  assert.equal(result.state.score, 50);
  assert.equal(result.state.remaining.length, 0);
  assert(result.effects.some(e => e.type === 'source:unresolvedCall' && e.name === 'Mc_Final.gotoAndPlay(2)'));
  const replay = step(s, {type: 'replay'});
  assert.equal(replay.score, 0);
  assert.equal(replay.mainFrame, 1);
});

test('Q6 extra parent call remains explicit and never produces a guessed second clip', () => {
  let s = start(6);
  while (s.questionId !== 6) s = finish(choose(s, true));
  const result = reduceP050(s, {type: 'choose', epoch: 0, questionGeneration: s.questionGeneration, choice: 'B'});
  assert(result.accepted);
  assert.deepEqual(result.effects.filter(e => e.type === 'source:unresolvedCall'),
    [{type: 'source:unresolvedCall', name: '_parent.showWrongFeed()'}]);
  assert.equal(result.effects.filter(e => e.type === 'audio:start').length, 1);
  assert.match(script('DefineButton2_444/BUTTONCONDACTION on(release).as'), /_parent.showWrongFeed\(\);\s+showWrongFeed\(\);/);
});

test('invalid frames and old question generations cannot mutate the game', () => {
  const old = start(11);
  const s = finish(choose(old, true));
  assert.equal(reduceP050(s, {type: 'choose', epoch: 0, questionGeneration: old.questionGeneration, choice: 'A'}).accepted, false);
  const feedback = choose(s, false);
  for (const frame of [NaN, Infinity, -1, 0, 1.5, 2, 29]) {
    const r = reduceP050(feedback, {type: 'advance-feedback', epoch: 0, token: feedback.feedback!.token, frame});
    assert.equal(r.accepted, false);
    assert.equal(r.state, feedback);
  }
  assert.throws(() => initialP050State(-1));
  assert.throws(() => p050Question(11));
  assert(Object.isFrozen(s) && Object.isFrozen(s.remaining));
});
