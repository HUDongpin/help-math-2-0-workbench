import {P050_SOURCE} from './alg-l06-p050-source-bindings-v1';

export type P050Choice = 'A' | 'B' | 'C' | 'D';
export type P050Phase = 'intro' | 'begin' | 'question' | 'correct-feedback' |
  'wrong-feedback' | 'wrong-held' | 'wrong-tail' | 'final' | 'left';
export type P050Response = Readonly<{questionId: number; choice: P050Choice; correct: boolean}>;
export type P050Feedback = Readonly<{kind: 'correct' | 'wrong'; spriteId: number;
  branch: number | null; frame: number; endFrame: number; token: string}>;
export interface P050State {
  readonly epoch: number;
  readonly seed: number;
  readonly rngState: number;
  readonly phase: P050Phase;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly paused: boolean;
  readonly score: number;
  readonly scoreAnimation: Readonly<{frame: number; endFrame: 10 | 20; token: string}> | null;
  readonly drawCount: number;
  readonly remaining: readonly number[];
  readonly order: readonly number[];
  readonly responses: readonly P050Response[];
  readonly questionId: number | null;
  readonly questionGeneration: number;
  readonly selectionSerial: number;
  readonly startRequested: boolean;
  readonly directionsOpen: boolean;
  readonly feedback: P050Feedback | null;
  readonly wrongText: string | null;
  readonly audioOwner: string | null;
  readonly audioSerial: number;
  readonly lessonCompleted: false;
}
export interface P050Event {
  type: 'play' | 'pause' | 'advance-main' | 'start-game' | 'skip-intro' | 'enter-frame' |
    'choose' | 'advance-feedback' | 'close-wrong' | 'advance-score' |
    'open-directions' | 'close-directions' | 'audio-complete' | 'replay' | 'leave';
  epoch: number;
  questionGeneration?: number;
  choice?: P050Choice;
  frame?: number;
  token?: string;
  owner?: string;
}
export type P050Effect = Readonly<
  {type: 'audio:cancelAll'} |
  {type: 'audio:start'; spriteId: number; frame: number; owner: string} |
  {type: 'stage:reset'} |
  {type: 'host:cleanup'} |
  {type: 'host:quizEnabled'; enabled: boolean} |
  {type: 'timeline:hold'; frame: number} |
  {type: 'source:unresolvedCall'; name: string}
>;
export type P050Transition = Readonly<{accepted: boolean; reason: string;
  state: P050State; effects: readonly P050Effect[]}>;

const B = P050_SOURCE.behavior;
const movingFeedback = new Set<P050Phase>(['correct-feedback', 'wrong-feedback', 'wrong-tail']);
const cancel: P050Effect = {type: 'audio:cancelAll'};
const blocked = (state: P050State, reason: string): P050Transition =>
  ({accepted: false, reason, state, effects: []});
function freeze(state: P050State): P050State {
  return Object.freeze({...state, remaining: Object.freeze([...state.remaining]),
    order: Object.freeze([...state.order]),
    responses: Object.freeze(state.responses.map(r => Object.freeze({...r}))),
    feedback: state.feedback && Object.freeze({...state.feedback}),
    scoreAnimation: state.scoreAnimation && Object.freeze({...state.scoreAnimation})});
}
const accepted = (state: P050State, reason: string, effects: P050Effect[] = []): P050Transition =>
  ({accepted: true, reason, state: freeze(state), effects: Object.freeze(effects)});
const validFrame = (frame: unknown, last: number): frame is number =>
  typeof frame === 'number' && Number.isSafeInteger(frame) && frame >= 1 && frame <= last;

/** P047's established seeded draw algorithm, kept local because the admitted
 * P047 reducer has a different frozen assessment lifecycle. P050 interleaves
 * question draws with wrong-feedback draws. This is not AVM1 RNG parity. */
function randomUnit(rngState: number) {
  const next = (rngState + 0x6d2b79f5) >>> 0;
  let value = next;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return {rngState: next, unit: ((value ^ value >>> 14) >>> 0) / 4294967296};
}

export function p050Question(id: number) {
  const question = P050_SOURCE.questions.find(q => q.number === id);
  if (!question) throw new RangeError('P050 unknown source question');
  return question;
}
export function initialP050State(seed = 0, epoch = 0): P050State {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff ||
      !Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P050 invalid run identity');
  return freeze({epoch, seed, rngState: seed, phase: 'intro', mainFrame: 1,
    mainPlaying: false, paused: false, score: 0, scoreAnimation: null, drawCount: 0,
    remaining: P050_SOURCE.questions.map(q => q.number), order: [], responses: [],
    questionId: null, questionGeneration: 0, selectionSerial: 0, startRequested: false,
    directionsOpen: false, feedback: null, wrongText: null, audioOwner: null,
    audioSerial: 0, lessonCompleted: false});
}

function nextQuestion(state: P050State): P050Transition {
  const drawCount = state.drawCount + 1;
  const reset = {...state, drawCount, startRequested: false, feedback: null,
    wrongText: null, mainPlaying: false, paused: false, audioOwner: null, directionsOpen: false};
  if (drawCount > B.questionCount) {
    return accepted({...reset, phase: 'final', mainFrame: B.finalFrame, questionId: null},
      'source Final holds; absent Mc_Final remains unresolved', [cancel,
        {type: 'timeline:hold', frame: B.finalFrame}, {type: 'host:quizEnabled', enabled: false},
        {type: 'source:unresolvedCall', name: 'Mc_Final.gotoAndPlay(2)'}]);
  }
  if (state.remaining.length === 0) return blocked(state, 'source question bank exhausted unexpectedly');
  const random = randomUnit(state.rngState);
  const index = Math.floor(random.unit * state.remaining.length);
  const questionId = state.remaining[index]!;
  const question = p050Question(questionId);
  return accepted({...reset, phase: 'question', mainFrame: question.frame, questionId,
    questionGeneration: state.questionGeneration + 1, rngState: random.rngState,
    remaining: state.remaining.filter((_, i) => i !== index), order: [...state.order, questionId]},
    'draw once and splice the remaining source bank', [cancel,
      {type: 'timeline:hold', frame: question.frame}, {type: 'host:quizEnabled', enabled: true}]);
}

function playClock(state: P050State): P050Transition {
  if (state.directionsOpen || !(state.phase === 'intro' || movingFeedback.has(state.phase)) ||
      (state.phase === 'intro' && state.mainPlaying) ||
      (state.feedback && !state.paused)) return blocked(state, 'clock cannot start here');
  const frame = state.feedback?.frame ?? state.mainFrame;
  const spriteId = state.feedback?.spriteId ?? P050_SOURCE.runtime.mainSpriteId;
  const audioSerial = state.audioSerial + 1;
  const owner = `${state.epoch}:${audioSerial}:${spriteId}:${frame}`;
  return accepted({...state, paused: false, mainPlaying: state.phase === 'intro', audioSerial, audioOwner: owner},
    'play or resume the active source clock', [{type: 'audio:start', spriteId, frame, owner}]);
}

/** Pure source game state. Frame observations are not audio acceptance or
 * evidence that a legacy host call executed. Every async callback is owned by
 * an epoch plus a question/feedback/audio identity. */
export function reduceP050(state: P050State, event: P050Event): P050Transition {
  if (event.epoch !== state.epoch) return blocked(state, 'stale run epoch');
  if (state.phase === 'left') return blocked(state, 'page already left');
  if (event.type === 'replay' || event.type === 'leave') {
    const next = initialP050State(state.seed, state.epoch + 1);
    return accepted(event.type === 'leave' ? {...next, phase: 'left'} : next,
      'invalidate old callbacks and reset every source state', [cancel, {type: 'stage:reset'},
        ...(event.type === 'leave' ? [{type: 'host:cleanup'} as const] : [])]);
  }
  if (event.type === 'audio-complete') {
    return event.owner && event.owner === state.audioOwner
      ? accepted({...state, audioOwner: null}, 'current audio ended; frame clock remains separate')
      : blocked(state, 'stale audio owner');
  }
  if (event.type === 'play') return playClock(state);
  if (event.type === 'pause') {
    if (state.paused || !(state.mainPlaying || movingFeedback.has(state.phase)))
      return blocked(state, 'nothing playing');
    return accepted({...state, paused: true, mainPlaying: false, audioOwner: null},
      'hold active clocks and cancel playback', [cancel]);
  }
  if (event.type === 'advance-main') {
    if (state.phase !== 'intro' || !state.mainPlaying || state.paused ||
        !validFrame(event.frame, P050_SOURCE.runtime.mainFrames) || event.frame <= state.mainFrame)
      return blocked(state, 'main frame unavailable');
    if (event.frame >= B.beginFrame) {
      return accepted({...state, phase: 'begin', mainFrame: B.beginFrame, mainPlaying: false,
        audioOwner: null}, 'source begins held after directions', [cancel, {type: 'timeline:hold', frame: B.beginFrame}]);
    }
    return accepted({...state, mainFrame: event.frame}, 'observed intro frame');
  }
  if (event.type === 'skip-intro' || event.type === 'start-game') {
    if (state.directionsOpen || state.startRequested ||
        !['intro', 'begin', 'final'].includes(state.phase) ||
        (event.type === 'skip-intro' && state.phase !== 'intro'))
      return blocked(state, 'source Start or Skip unavailable');
    const frame = state.phase === 'final' ? B.finalFrame : B.beginFrame;
    return accepted({...state, phase: state.phase === 'final' ? 'final' : 'begin', mainFrame: frame,
      mainPlaying: false, paused: false, audioOwner: null, startRequested: event.type === 'start-game'},
      'source request is consumed by the next enter-frame callback', [cancel, {type: 'timeline:hold', frame}]);
  }
  if (event.type === 'enter-frame') {
    return state.startRequested && !state.directionsOpen && ['begin', 'final'].includes(state.phase)
      ? nextQuestion(state) : blocked(state, 'no pending source game request');
  }
  if (event.type === 'open-directions' || event.type === 'close-directions') {
    const open = event.type === 'open-directions';
    if (!['begin', 'question', 'final'].includes(state.phase) ||
        state.startRequested || state.directionsOpen === open ||
        event.questionGeneration !== state.questionGeneration)
      return blocked(state, 'directions unavailable or stale controls');
    return accepted({...state, directionsOpen: open}, 'static source directions popup; no narration replay',
      [{type: 'host:quizEnabled', enabled: !open && state.phase === 'question'}]);
  }
  if (event.type === 'choose') {
    if (state.phase !== 'question' || state.directionsOpen || state.questionId === null ||
        event.questionGeneration !== state.questionGeneration || !event.choice)
      return blocked(state, 'answer unavailable or stale question');
    const question = p050Question(state.questionId);
    const option = question.options.find(o => o.letter === event.choice);
    if (!option) return blocked(state, 'choice not in source');
    const random = option.correct ? null : randomUnit(state.rngState);
    const branch = random ? Math.floor(random.unit * B.wrong.branchCount) + 1 : null;
    const spriteId = option.correct ? question.correctFeedbackSpriteId : B.wrong.spriteId;
    const selectionSerial = state.selectionSerial + 1;
    const token = `${state.epoch}:${state.questionGeneration}:${selectionSerial}`;
    const audioSerial = state.audioSerial + 1;
    const owner = `${state.epoch}:${audioSerial}:${spriteId}:2`;
    const score = state.score + (option.correct ? B.correctPoints : B.wrongPoints);
    const feedback: P050Feedback = {kind: option.correct ? 'correct' : 'wrong', spriteId,
      branch, frame: 2, endFrame: option.correct ? question.correctFeedbackEndFrame : B.wrong.endFrame, token};
    return accepted({...state, phase: option.correct ? 'correct-feedback' : 'wrong-feedback',
      feedback, wrongText: option.wrongText, score, paused: false, selectionSerial,
      scoreAnimation: option.correct ? {frame: 2, endFrame: score >= 100 ? 20 : 10, token} : null,
      responses: [...state.responses, {questionId: state.questionId, choice: event.choice, correct: option.correct}],
      rngState: random?.rngState ?? state.rngState, audioOwner: owner, audioSerial},
      'one source response starts the selected clip; draw waits for feedback end', [cancel,
        {type: 'host:quizEnabled', enabled: false}, {type: 'audio:start', spriteId, frame: 2, owner},
        ...(option.unboundParentWrongCall ? [{type: 'source:unresolvedCall', name: '_parent.showWrongFeed()'} as const] : [])]);
  }
  if (event.type === 'advance-score') {
    const score = state.scoreAnimation;
    if (!score || event.token !== score.token || state.paused ||
        !validFrame(event.frame, 20) || event.frame <= score.frame)
      return blocked(state, 'score clock unavailable');
    const frame = score.endFrame === 20 && score.frame === 2 ? Math.max(11, event.frame) : event.frame;
    return accepted({...state, scoreAnimation: frame >= score.endFrame ? null : {...score, frame}},
      frame >= score.endFrame ? 'score returns to source frame1' : 'source score animation');
  }
  if (event.type === 'close-wrong') {
    if (state.phase !== 'wrong-held' || !state.feedback || event.token !== state.feedback.token)
      return blocked(state, 'wrong popup is not waiting for Close');
    const audioSerial = state.audioSerial + 1;
    const owner = `${state.epoch}:${audioSerial}:${B.wrong.spriteId}:${B.wrong.closeJump}`;
    return accepted({...state, phase: 'wrong-tail', feedback: {...state.feedback, frame: B.wrong.closeJump},
      paused: false, audioOwner: owner, audioSerial}, 'Close resumes source tail at24',
      [{type: 'audio:start', spriteId: B.wrong.spriteId, frame: B.wrong.closeJump, owner}]);
  }
  if (event.type === 'advance-feedback') {
    const feedback = state.feedback;
    if (!feedback || !movingFeedback.has(state.phase) || state.paused || event.token !== feedback.token ||
        !validFrame(event.frame, feedback.endFrame) || event.frame <= feedback.frame)
      return blocked(state, 'feedback frame unavailable or stale token');
    if (state.phase === 'wrong-feedback' && event.frame >= B.wrong.holdFrame) {
      return accepted({...state, phase: 'wrong-held', feedback: {...feedback, frame: B.wrong.holdFrame},
        audioOwner: null}, 'wrong feedback stops at23 until explicit Close', [cancel]);
    }
    if (event.frame === feedback.endFrame) return nextQuestion(state);
    return accepted({...state, feedback: {...feedback, frame: event.frame}}, 'observed source feedback frame');
  }
  return blocked(state, 'unhandled event');
}

export function p050PresentationState(state: P050State) {
  return Object.freeze({mainFrame: state.mainFrame, questionId: state.questionId,
    ordinal: state.phase === 'final' ? null : state.drawCount || null, score: state.score,
    questionEnabled: state.phase === 'question' && !state.directionsOpen,
    directionsVisible: state.directionsOpen,
    wrongPopupVisible: state.feedback?.kind === 'wrong' &&
      state.feedback.frame >= B.wrong.popupFirstFrame && state.feedback.frame < B.wrong.closeJump,
    closeWrongEnabled: state.phase === 'wrong-held',
    feedbackSpriteId: state.feedback?.spriteId ?? null, feedbackFrame: state.feedback?.frame ?? 1,
    scoreFrame: state.scoreAnimation?.frame ?? 1, finalHeld: state.phase === 'final',
    sourceFinalClipResolved: false, lessonCompleted: false});
}
