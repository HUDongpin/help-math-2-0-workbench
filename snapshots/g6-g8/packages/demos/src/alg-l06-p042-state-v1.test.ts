import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  P042_CHOICES, P042_SOURCE, p042InitialState, p042Reduce,
  type P042Choice, type P042Event, type P042State,
} from './alg-l06-p042-state-v1';

function accepted(state: P042State, event: P042Event): P042State {
  const result = p042Reduce(state, event);
  assert.equal(result.accepted, true, result.reason);
  return result.state;
}

function atQuiz(): P042State {
  let state = p042InitialState();
  state = accepted(state, {type: 'start-main', epoch: state.epoch});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 279});
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.mainPlaying, false);
  assert.equal(state.quizSection, true);
  assert.equal(state.quizTryCount, 0);
  return state;
}

function wrongCycle(state: P042State, choice: Exclude<P042Choice, 'A'>) {
  state = accepted(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice});
  const token = state.feedback!.token;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 22});
  const held = state;
  state = accepted(state, {type: 'close-wrong', epoch: state.epoch, token});
  const tail = state;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31});
  return {held, tail, ended: state, token};
}

test('maintained P042 identity and answer binding match frozen v2 source pins', () => {
  const bytes = readFileSync(new URL('../../../output/alg-l06-p042-behavior-state-draft-20261002-v2/source-pins-v2.json', import.meta.url));
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, P042_SOURCE.sourcePinsSha256);
  const pins = JSON.parse(bytes.toString());
  assert.equal(pins.physical.swf.sha256, P042_SOURCE.swfSha256);
  assert.equal(pins.physical.lessonXml.sha256, P042_SOURCE.lessonXmlSha256);
  const native = JSON.parse(readFileSync(new URL('../../../output/g678-p042-native-canvas-preparation-20261002-v1/native-model-v1.json', import.meta.url)).toString());
  assert.equal(native.quiz.holdFrame, P042_SOURCE.quizFrame);
  for (const placement of native.quiz.answerPlacements) {
    const choice = P042_CHOICES[placement.sourceStageLetter.text as P042Choice];
    assert.equal(placement.sourceStageLabelBindingAccepted, true);
    assert.equal(placement.browserHitParityAccepted, false);
    assert.equal(placement.instance, choice.instance);
    assert.equal(placement.buttonId, choice.buttonId);
    assert.equal(placement.branch, choice.kind);
    assert.equal(Number(placement.sourceStageValue.text.replace('–', '-')), choice.value);
  }
});

test('main observer stops at quiz frame 279 and ignores overrun', () => {
  let state = p042InitialState();
  const started = p042Reduce(state, {type: 'start-main', epoch: state.epoch});
  assert.equal(started.accepted, true);
  assert.equal(started.state.audioOwner, 'main:0:1');
  state = started.state;
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 278});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 400});
  assert.equal(state.mainFrame, 279);
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.audioOwner, null);
  assert.equal(state.lessonCompleted, false);
  assert.equal(p042Reduce(state, {type: 'advance-main', epoch: state.epoch, frame: 280}).accepted, false);
});

test('wrong feedback stops at 22; count changes only after Close→23→terminal31', () => {
  let state = atQuiz();
  const choice = p042Reduce(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'B'});
  assert.equal(choice.accepted, true);
  state = choice.state;
  const token = state.feedback!.token;
  assert.equal(state.phase, 'wrong-feedback-playing');
  assert.equal(state.feedback?.spriteId, 292);
  assert.equal(state.wrongFeedText, 'Substitute –2 for x in the equation. Try again.');
  assert.equal(state.quizTryCount, 0);
  assert.equal(p042Reduce(state, {type: 'close-wrong', epoch: state.epoch, token}).accepted, false);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31});
  assert.equal(state.phase, 'wrong-feedback-held');
  assert.equal(state.feedback?.frame, 22);
  assert.equal(state.wrongFeedbackPopupVisible, true);
  assert.equal(state.audioOwner, null);
  assert.equal(state.quizTryCount, 0);
  assert.equal(p042Reduce(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31}).accepted, false);
  const closed = p042Reduce(state, {type: 'close-wrong', epoch: state.epoch, token});
  assert.equal(closed.accepted, true);
  state = closed.state;
  assert.equal(state.phase, 'wrong-feedback-tail');
  assert.equal(state.feedback?.frame, 23);
  assert.deepEqual(closed.effects[0], {type: 'feedback:seekPlay', spriteId: 292, frame: 23, token});
  assert.deepEqual(closed.effects[1], {
    type: 'answerClips:reset', instances: ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], frame: 1,
  });
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31});
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.quizButtonsEnabled, true);
  assert.equal(state.nmhButtonEnabled, true);
});

test('second wrong also requires Close; source terminal resets count and resumes at 280', () => {
  let state = wrongCycle(atQuiz(), 'C').ended;
  assert.equal(state.quizTryCount, 1);
  const generation = state.quizGeneration;
  state = accepted(state, {type: 'choose', epoch: state.epoch, quizGeneration: generation, choice: 'D'});
  assert.equal(state.wrongFeedText, 'Substitute –2 for x in the equation.');
  const token = state.feedback!.token;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 22});
  assert.equal(state.quizTryCount, 1);
  assert.equal(p042Reduce(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31}).accepted, false);
  state = accepted(state, {type: 'close-wrong', epoch: state.epoch, token});
  const terminal = p042Reduce(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 31});
  assert.equal(terminal.accepted, true);
  assert.equal(terminal.state.phase, 'postquiz');
  assert.equal(terminal.state.mainFrame, 280);
  assert.equal(terminal.state.quizSection, false);
  assert.equal(terminal.state.quizTryCount, 0);
  assert.equal(terminal.effects.some(effect => effect.type === 'host:enableQuizButton'), false);
  state = accepted(terminal.state, {type: 'advance-main', epoch: terminal.state.epoch, frame: 400});
  assert.equal(state.phase, 'engineering-end-held');
  assert.equal(state.lessonCompleted, false);
});

test('right after one wrong retains count 1 through postquiz and frame 400', () => {
  let state = wrongCycle(atQuiz(), 'B').ended;
  assert.equal(state.quizTryCount, 1);
  state = accepted(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'A'});
  assert.equal(state.phase, 'right-feedback-playing');
  assert.equal(state.feedback?.spriteId, 239);
  const token = state.feedback!.token;
  assert.equal(p042Reduce(state, {type: 'close-wrong', epoch: state.epoch, token}).accepted, false);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, token, frame: 25});
  assert.equal(state.phase, 'postquiz');
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.quizSection, false);
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 400});
  assert.equal(state.quizTryCount, 1);
});

test('NMH and wrong feedback Close are separate; NMH preserves count', () => {
  let state = wrongCycle(atQuiz(), 'B').ended;
  const opened = p042Reduce(state, {type: 'open-nmh', epoch: state.epoch,
    quizGeneration: state.quizGeneration});
  assert.equal(opened.accepted, true);
  state = opened.state;
  assert.equal(state.phase, 'nmh-popup');
  assert.equal(state.nmhPopupVisible, true);
  assert.equal(state.wrongFeedbackPopupVisible, false);
  assert.equal(p042Reduce(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'A'}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'close-wrong', epoch: state.epoch, token: '0:1'}).accepted, false);
  state = accepted(state, {type: 'close-nmh', epoch: state.epoch, quizGeneration: state.quizGeneration});
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.quizButtonsEnabled, true);
});

test('nested glossary is reachable only through visible NMH popup', () => {
  let state = atQuiz();
  assert.equal(p042Reduce(state, {type: 'glossary', epoch: state.epoch,
    quizGeneration: state.quizGeneration, buttonId: 135}).accepted, false);
  state = accepted(state, {type: 'open-nmh', epoch: state.epoch, quizGeneration: state.quizGeneration});
  const glossary = p042Reduce(state, {type: 'glossary', epoch: state.epoch,
    quizGeneration: state.quizGeneration, buttonId: 135});
  assert.equal(glossary.accepted, true);
  assert.equal(glossary.state.phase, 'host-glossary');
  assert.equal(glossary.state.glossaryTerm, 'Substitute');
  assert.ok(glossary.effects.some(effect => effect.type === 'host:DoHyperLinks' &&
    effect.keyAttribute === 'Substitute'));
});

test('modern glossary close restores the held source page without autoplay', () => {
  const atHeld=atQuiz();
  const nmh=accepted(atHeld,{type:'open-nmh',epoch:atHeld.epoch,
    quizGeneration:atHeld.quizGeneration});
  const opened=accepted(nmh,{type:'glossary',epoch:nmh.epoch,
    quizGeneration:nmh.quizGeneration,buttonId:140});
  assert.equal(opened.phase,'host-glossary');
  assert.equal(opened.glossaryTerm,'Simplify');
  assert.equal(p042Reduce(opened,{type:'close-glossary',epoch:opened.epoch,
    quizGeneration:opened.quizGeneration+1}).accepted,false);
  const returned=accepted(opened,{type:'close-glossary',epoch:opened.epoch,
    quizGeneration:opened.quizGeneration});
  assert.equal(returned.phase,'nmh-popup');
  assert.equal(returned.nmhPopupVisible,true);
  assert.equal(returned.mainPlaying,false);
  assert.equal(returned.audioOwner,null);
  assert.equal(returned.glossaryTerm,null);
  const backToQuiz=accepted(returned,{type:'close-nmh',epoch:returned.epoch,
    quizGeneration:returned.quizGeneration});
  assert.equal(backToQuiz.quizButtonsEnabled,true);
  assert.equal(p042Reduce(backToQuiz,{type:'choose',epoch:backToQuiz.epoch,
    quizGeneration:backToQuiz.quizGeneration,choice:'B'}).accepted,true);
});

test('main glossary 152–154 requires source frame 2 or later and no NMH overlay', () => {
  let state = p042InitialState();
  assert.equal(p042Reduce(state, {type: 'glossary', epoch: state.epoch,
    quizGeneration: state.quizGeneration, buttonId: 153}).accepted, false);
  state = accepted(state, {type: 'start-main', epoch: state.epoch});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 2});
  const glossary = p042Reduce(state, {type: 'glossary', epoch: state.epoch,
    quizGeneration: state.quizGeneration, buttonId: 153});
  assert.equal(glossary.accepted, true);
  assert.equal(glossary.state.glossaryTerm, 'Function');
  state = accepted(atQuiz(), {type: 'open-nmh', epoch: 0, quizGeneration: 1});
  assert.equal(p042Reduce(state, {type: 'glossary', epoch: state.epoch,
    quizGeneration: state.quizGeneration, buttonId: 153}).accepted, false);
});

test('Replay and leave reject every stale run event and old quiz generation', () => {
  let state = atQuiz();
  const oldQuizGeneration = state.quizGeneration;
  const oldEpoch = state.epoch;
  const first = wrongCycle(state, 'B');
  state = first.ended;
  assert.equal(p042Reduce(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: oldQuizGeneration, choice: 'A'}).accepted, false);
  const pending = p042Reduce(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'C'});
  assert.equal(pending.accepted, true);
  const staleToken = pending.state.feedback!.token;
  const staleAudio = pending.state.audioOwner!;
  const replay = p042Reduce(pending.state, {type: 'replay', epoch: pending.state.epoch});
  assert.equal(replay.accepted, true);
  assert.deepEqual(replay.effects, [{type: 'audio:cancelAll'}, {type: 'stage:reset'}]);
  state = replay.state;
  assert.equal(state.epoch, oldEpoch + 1);
  assert.equal(state.quizTryCount, 0);
  assert.equal(p042Reduce(state, {type: 'advance-feedback', epoch: oldEpoch,
    token: staleToken, frame: 22}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'close-wrong', epoch: oldEpoch,
    token: staleToken}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'audio-complete', epoch: oldEpoch,
    owner: staleAudio}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'advance-main', epoch: oldEpoch, frame: 279}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'choose', epoch: oldEpoch,
    quizGeneration: oldQuizGeneration, choice: 'A'}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'open-nmh', epoch: oldEpoch,
    quizGeneration: oldQuizGeneration}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'glossary', epoch: oldEpoch,
    quizGeneration: oldQuizGeneration, buttonId: 135}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'replay', epoch: oldEpoch}).accepted, false);
  const left = p042Reduce(state, {type: 'leave', epoch: state.epoch});
  assert.equal(left.accepted, true);
  assert.equal(left.state.phase, 'left');
  assert.equal(left.state.epoch, state.epoch + 1);
  assert.equal(p042Reduce(left.state, {type: 'start-main', epoch: left.state.epoch}).accepted, false);
  assert.equal(p042Reduce(left.state, {type: 'replay', epoch: left.state.epoch}).accepted, false);
});

test('invalid source frame and old feedback token fail without state mutation', () => {
  let state = atQuiz();
  state = accepted(state, {type: 'choose', epoch: state.epoch,
    quizGeneration: state.quizGeneration, choice: 'D'});
  const original = state;
  for (const frame of [0, 1.5, Number.NaN, 32]) {
    const result = p042Reduce(state, {type: 'advance-feedback', epoch: state.epoch,
      token: state.feedback!.token, frame});
    assert.equal(result.accepted, false);
    assert.equal(result.state, original);
  }
  assert.equal(p042Reduce(state, {type: 'advance-feedback', epoch: state.epoch,
    token: 'stale', frame: 22}).accepted, false);
  assert.equal(p042Reduce(state, {type: 'audio-complete', epoch: state.epoch,
    owner: 'stale'}).accepted, false);
});
