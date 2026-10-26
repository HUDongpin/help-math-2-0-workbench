import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  P041_SOURCE, p041InitialState, p041Reduce, p041SourceDomainDraw,
  type P041Draw, type P041State,
} from './alg-l06-p041-state-v1';

test('draft identity and selector bind independently hashed physical source and retained host ActionScript', () => {
  const factsBytes = readFileSync(new URL('../../../output/alg-l06-p041-source-triage-20261001-v1/source-facts-v1.json', import.meta.url));
  const facts = JSON.parse(factsBytes.toString());
  const host = readFileSync(new URL('../../../output/alg-l06-p041-feedback-host-resolution-20261001-v1/host-actionscript/frame_35/DoAction.as', import.meta.url));
  const behaviorDraft = readFileSync(new URL('../../../output/alg-l06-p041-behavior-preparation-20261001-v1/behavior-ir-draft-v1.json', import.meta.url));
  const hostResolution = readFileSync(new URL('../../../output/alg-l06-p041-feedback-host-resolution-20261001-v1/host-resolution-v1.json', import.meta.url));
  const sourceAudioPlan = readFileSync(new URL('../../../output/alg-l06-p041-audio-source-preparation-20261001-v1/source-audio-plan-v1.json', import.meta.url));
  const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(factsBytes), '5512f5f65a9fd2eb3da8b22cb145c8fbf642e598eb257bc8db023dae2b14567d');
  assert.equal(hash(host), '380cd6581859d0ba9814833f1102b08282198713cf30b5230ce2da76c3e27a74');
  assert.equal(hash(behaviorDraft), P041_SOURCE.behaviorDraftSha256);
  assert.equal(hash(hostResolution), P041_SOURCE.hostResolutionSha256);
  assert.equal(hash(sourceAudioPlan), P041_SOURCE.sourceAudioPlanSha256);
  assert.equal(hash(readFileSync(facts.physicalSource.swf.path)), P041_SOURCE.swfSha256);
  assert.equal(P041_SOURCE.conditionalHostSha256, '275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9');
  const hostText = host.toString();
  assert.match(hostText, /function showWrongFeed\(\)[\s\S]*?intMc_Name = random\(3\);/);
  assert.match(hostText, /function showRightFeed\(\)[\s\S]*?intMc_Name = random\(4\);/);
  const named = Object.fromEntries(facts.timeline.namedSpritePlacements
    .filter((p: {spriteId: number; frame: number}) => p.spriteId === 169 && p.frame === 752)
    .map((p: {name: string; objectID: string}) => [p.name, Number(p.objectID)]));
  assert.deepEqual([named.Mc_Wrong_Feed1, named.Mc_Wrong_Feed2, named.Mc_Wrong_Feed3], [76, 105, 91]);
  assert.deepEqual([named.Mc_Right_Feed1, named.Mc_Right_Feed2, named.Mc_Right_Feed3, named.Mc_Right_Feed4], [168, 139, 119, 152]);
  const audio = JSON.parse(sourceAudioPlan.toString());
  assert.equal(audio.streamCount, 8);
  assert.equal(audio.blockCount, 1064);
  assert.ok(audio.streams.every((stream: {browserPcmBinding: unknown}) => stream.browserPcmBinding === null));
});

function accepted(state: P041State, event: Parameters<typeof p041Reduce>[1], draw?: P041Draw): P041State {
  const transition = p041Reduce(state, event, draw);
  assert.equal(transition.accepted, true, transition.reason);
  return transition.state;
}

function atQuiz(): P041State {
  let state = p041InitialState();
  state = accepted(state, {type: 'play'});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 751});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 752});
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.mainTimelinePlaying, false);
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.nMhButtonEnabled, 'unverified');
  return state;
}

function selected(state: P041State, answer: 1 | 2 | 3 | 4, index: number) {
  state = accepted(state, {type: 'choose', answer});
  let calls = 0;
  const kind = answer === 3 ? 'right' : 'wrong';
  state = accepted(state, {type: 'resolve-host-feedback'}, (max, actualKind) => {
    calls++;
    assert.equal(max, kind === 'right' ? 4 : 3);
    assert.equal(actualKind, kind);
    return index;
  });
  assert.equal(calls, 1);
  assert.equal(state.feedback?.frame, 2);
  assert.equal(state.feedback?.hostX, 5);
  return state;
}

test('source-domain draw uses one bounded unit draw and never supplies a fixed variant', () => {
  let draws = 0;
  assert.equal(p041SourceDomainDraw(3, () => {draws++; return 0;}), 1);
  assert.equal(p041SourceDomainDraw(3, () => {draws++; return 0.34;}), 2);
  assert.equal(p041SourceDomainDraw(4, () => {draws++; return 0.999999;}), 4);
  assert.equal(draws, 3);
  for (const invalid of [-0.01, 1, Number.NaN, Number.POSITIVE_INFINITY])
    assert.throws(() => p041SourceDomainDraw(3, () => invalid), /P041_RANDOM_UNIT_OUT_OF_RANGE/);
});

test('each wrong and right source index resolves to the exact P041 named sprite', () => {
  for (const [index, expected] of [[1, 76], [2, 105], [3, 91]]) {
    const state = selected(atQuiz(), 1, index);
    assert.equal(state.feedback?.spriteId, expected);
    assert.equal(state.feedback?.kind, 'wrong');
  }
  for (const [index, expected] of [[1, 168], [2, 139], [3, 119], [4, 152]]) {
    const state = selected(atQuiz(), 3, index);
    assert.equal(state.feedback?.spriteId, expected);
    assert.equal(state.feedback?.kind, 'right');
  }
});

test('wrong count increments on release before draw; first Close/terminal retries at held 752', () => {
  let state = atQuiz();
  state = accepted(state, {type: 'choose', answer: 4});
  assert.equal(state.phase, 'host-selection-pending');
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.wrongFeedText, 'Look at the height of the ball, the value on the h-axis, when the value on the t-axis is 2.5. Try again.');
  assert.equal(state.quizButtonsEnabled, false);
  state = accepted(state, {type: 'resolve-host-feedback'}, () => 1);
  const generation = state.feedback!.generation;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 23, generation});
  assert.equal(state.phase, 'wrong-feedback-held');
  assert.equal(state.feedback?.frame, 23);
  assert.equal(p041Reduce(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation}).accepted, false);
  state = accepted(state, {type: 'close-wrong', generation});
  assert.equal(state.feedback?.frame, 24);
  assert.equal(state.feedback?.playing, true);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation});
  assert.equal(state.phase, 'quiz-held');
  assert.equal(state.mainFrame, 752);
  assert.equal(state.mainTimelinePlaying, false);
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.quizButtonsEnabled, true);
  assert.equal(state.nMhButtonEnabled, true);
  assert.equal(state.quizSection, true);
  assert.equal(state.feedback, null);
});

test('second wrong text preserves trailing space and terminal resumes parent to frame 753', () => {
  let state = atQuiz();
  state = selected(state, 2, 3);
  let generation = state.feedback!.generation;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 21, generation});
  state = accepted(state, {type: 'close-wrong', generation});
  assert.equal(state.feedback?.frame, 22);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation});
  assert.equal(state.quizTryCount, 1);
  state = accepted(state, {type: 'choose', answer: 1});
  assert.equal(state.quizTryCount, 2);
  assert.equal(state.wrongFeedText, 'Look at the height of the ball, the value on the h-axis, when the value on the t-axis is 2.5. ');
  state = accepted(state, {type: 'resolve-host-feedback'}, () => 2);
  generation = state.feedback!.generation;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 20, generation});
  state = accepted(state, {type: 'close-wrong', generation});
  assert.equal(state.feedback?.frame, 21);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation});
  assert.equal(state.phase, 'postquiz-resume');
  assert.equal(state.mainFrame, 752);
  assert.equal(state.mainTimelinePlaying, true);
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.quizSection, false);
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 753});
  assert.equal(state.phase, 'postquiz');
  assert.equal(state.mainFrame, 753);
  assert.equal(p041Reduce(state, {type: 'choose', answer: 3}).accepted, false);
});

test('right terminal disables quiz and resumes parent without inventing a retry reset', () => {
  let state = selected(atQuiz(), 3, 4);
  const generation = state.feedback!.generation;
  assert.equal(state.quizTryCount, 0);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation});
  assert.equal(state.phase, 'postquiz-resume');
  assert.equal(state.mainTimelinePlaying, true);
  assert.equal(state.quizButtonsEnabled, false);
  assert.equal(state.nMhButtonEnabled, false);
  assert.equal(state.quizSection, false);
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 753});
  assert.equal(state.mainFrame, 753);
});

test('Close cannot jump before source popup placement; after placement it jumps once', () => {
  let state = selected(atQuiz(), 1, 2); // wrong-2 sprite 105, popup first placed at 13
  const generation = state.feedback!.generation;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 12, generation});
  assert.equal(p041Reduce(state, {type: 'close-wrong', generation}).accepted, false);
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 13, generation});
  state = accepted(state, {type: 'close-wrong', generation});
  assert.equal(state.feedback?.frame, 21);
  assert.equal(p041Reduce(state, {type: 'close-wrong', generation}).accepted, false);
});

test('missing or out-of-domain host draw fails closed; rejected events never draw', () => {
  const state = atQuiz();
  let calls = 0;
  const noPending = p041Reduce(state, {type: 'resolve-host-feedback'}, () => {calls++; return 1;});
  assert.equal(noPending.accepted, false);
  assert.equal(calls, 0);
  const pending = accepted(state, {type: 'choose', answer: 3});
  assert.throws(() => p041Reduce(pending, {type: 'resolve-host-feedback'}), /P041_HOST_DRAW_REQUIRED/);
  for (const bad of [0, 5, 1.5, Number.NaN])
    assert.throws(() => p041Reduce(pending, {type: 'resolve-host-feedback'}, () => bad), /P041_HOST_DRAW_OUT_OF_RANGE/);
  assert.equal(pending.pendingHostCall, 'right');
});

test('Replay from a pending host call cancels the draw before it can select a feedback sprite', () => {
  let state = accepted(atQuiz(), {type: 'choose', answer: 2});
  assert.equal(state.pendingHostCall, 'wrong');
  const replay = p041Reduce(state, {type: 'replay'});
  assert.equal(replay.accepted, true);
  state = replay.state;
  let calls = 0;
  const late = p041Reduce(state, {type: 'resolve-host-feedback'}, () => {calls++; return 1;});
  assert.equal(late.accepted, false);
  assert.equal(calls, 0);
  assert.equal(state.feedback, null);
  assert.equal(state.quizTryCount, 0);
});

test('modern Pause holds observed frame; Replay invalidates feedback and requests full cleanup', () => {
  let state = selected(atQuiz(), 1, 1);
  const oldGeneration = state.feedback!.generation;
  state = accepted(state, {type: 'pause'});
  assert.equal(state.feedback?.playing, false);
  assert.equal(p041Reduce(state, {type: 'advance-feedback', epoch: state.epoch, frame: 3, generation: oldGeneration}).accepted, false);
  state = accepted(state, {type: 'play'});
  assert.equal(state.feedback?.playing, true);
  const replay = p041Reduce(state, {type: 'replay'});
  assert.equal(replay.accepted, true);
  assert.deepEqual(replay.cleanup, ['abort-pending-work', 'retire-page-owned-media', 'reset-native-stage']);
  state = replay.state;
  assert.equal(state.phase, 'prequiz');
  assert.equal(state.mainFrame, 1);
  assert.equal(state.feedback, null);
  assert.equal(state.quizTryCount, 0);
  assert.ok(state.epoch > oldGeneration);
  assert.equal(p041Reduce(state, {type: 'advance-feedback', epoch: state.epoch, frame: 4, generation: oldGeneration}).accepted, false);
  assert.equal(state.lessonCompleted, false);
  assert.equal(state.sourceToAudioAlignment, 'unresolved');
});

test('late main callback from the pre-Replay state epoch cannot advance the new page', () => {
  let state = p041InitialState();
  state = accepted(state, {type: 'play'});
  const oldEpoch = state.epoch;
  state = accepted(state, {type: 'replay'});
  state = accepted(state, {type: 'play'});
  const stale = p041Reduce(state, {type: 'advance-main', frame: 752, epoch: oldEpoch});
  assert.equal(stale.accepted, false);
  assert.equal(stale.state.mainFrame, 1);
  assert.equal(stale.state.quizSection, false);
});

test('Leave invalidates pending work; source final frame is an engineering hold only', () => {
  let state = atQuiz();
  state = selected(state, 3, 1);
  const generation = state.feedback!.generation;
  state = accepted(state, {type: 'advance-feedback', epoch: state.epoch, frame: 28, generation});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 753});
  state = accepted(state, {type: 'advance-main', epoch: state.epoch, frame: 869});
  assert.equal(state.phase, 'engineering-end-held');
  assert.equal(state.lessonCompleted, false);
  const left = p041Reduce(state, {type: 'leave'});
  assert.equal(left.accepted, true);
  assert.deepEqual(left.cleanup, ['abort-pending-work', 'retire-page-owned-media', 'reset-native-stage']);
  assert.equal(left.state.phase, 'left');
  assert.equal(p041Reduce(left.state, {type: 'play'}).accepted, false);
});
