/** P041 source-bound maintained quiz/feedback reducer.
 * Physical page and conditional historical host evidence are separate. */
export const P041_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p041',
  swfSha256: 'bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85',
  conditionalHostSha256: '275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9',
  behaviorDraftSha256: '01ed347b6ab082d3f22ad3a2a8441aae930f60ad347953916e6386b669f97005',
  hostResolutionSha256: '3b325b445e2b6104f2f4199419b5afd1ffa1c3c2956be3ad97c12674e8b9a8ad',
  sourceAudioPlanSha256: '60a80bc27858e02b7c5bf4d4f04c89aecb0b0cbc27cd1b554f1b859aeb2f3dc5',
  quizFrame: 752,
  postQuizFrame: 753,
  mainLastFrame: 869,
  wrongFirst: 'Look at the height of the ball, the value on the h-axis, when the value on the t-axis is 2.5. Try again.',
  wrongLater: 'Look at the height of the ball, the value on the h-axis, when the value on the t-axis is 2.5. ',
  answerCharacters: {1: 44, 2: 44, 3: 45, 4: 44},
} as const);

export const P041_FEEDBACK = Object.freeze({
  76: {kind: 'wrong', index: 1, hold: 23, closePlacementFirst: 17, closeButton: 72, closeJump: 24, terminal: 28},
  105: {kind: 'wrong', index: 2, hold: 20, closePlacementFirst: 13, closeButton: 100, closeJump: 21, terminal: 28},
  91: {kind: 'wrong', index: 3, hold: 21, closePlacementFirst: 14, closeButton: 85, closeJump: 22, terminal: 28},
  168: {kind: 'right', index: 1, terminal: 28},
  139: {kind: 'right', index: 2, terminal: 33},
  119: {kind: 'right', index: 3, terminal: 32},
  152: {kind: 'right', index: 4, terminal: 28},
} as const);

export type P041FeedbackId = keyof typeof P041_FEEDBACK;
export type P041FeedbackKind = 'wrong' | 'right';
export type P041Phase = 'prequiz' | 'quiz-held' | 'host-selection-pending' |
  'feedback-playing' | 'wrong-feedback-held' | 'postquiz-resume' | 'postquiz' |
  'engineering-end-held' | 'left';
export type P041Cleanup = 'retire-selected-feedback' | 'abort-pending-work' |
  'retire-page-owned-media' | 'reset-native-stage';

export interface P041Feedback {
  readonly spriteId: P041FeedbackId;
  readonly kind: P041FeedbackKind;
  /** Host gotoAndPlay(2) is the only source of this initial frame. */
  readonly frame: number;
  readonly playing: boolean;
  readonly closeRequested: boolean;
  readonly generation: number;
  readonly hostX: 5;
}

export interface P041State {
  readonly phase: P041Phase;
  readonly mainFrame: number;
  readonly mainTimelinePlaying: boolean;
  readonly quizSection: boolean;
  /** Incremented at wrong-button release, never deferred to feedback terminal. */
  readonly quizTryCount: 0 | 1 | 2;
  readonly quizButtonsEnabled: boolean;
  /** Host state at the initial quiz placement is not established by this SWF. */
  readonly nMhButtonEnabled: boolean | 'unverified';
  readonly wrongFeedText: string | null;
  readonly pendingHostCall: P041FeedbackKind | null;
  readonly feedback: P041Feedback | null;
  /** Invalidates late frame/fetch/decoder callbacks on selection, Replay and Leave. */
  readonly epoch: number;
  readonly sourceToAudioAlignment: 'unresolved';
  readonly lessonCompleted: false;
}

export type P041Event =
  | {readonly type: 'play'}
  | {readonly type: 'pause'}
  | {readonly type: 'advance-main'; readonly frame: number; readonly epoch: number}
  | {readonly type: 'choose'; readonly answer: 1 | 2 | 3 | 4}
  | {readonly type: 'resolve-host-feedback'}
  | {readonly type: 'advance-feedback'; readonly frame: number; readonly generation: number; readonly epoch: number}
  | {readonly type: 'close-wrong'; readonly generation: number}
  | {readonly type: 'replay'}
  | {readonly type: 'leave'};

export interface P041Transition {
  readonly accepted: boolean;
  readonly reason: string;
  readonly state: P041State;
  readonly cleanup: readonly P041Cleanup[];
}

export type P041Draw = (maxExclusive: 3 | 4, kind: P041FeedbackKind) => number;

/** Source-domain random draw for product wiring, with injectable unit draw in tests.
 * It does not reproduce a historical Flash PRNG seed or sequence. */
export function p041SourceDomainDraw(maxExclusive: 3 | 4, randomUnit: () => number = Math.random): number {
  const value = randomUnit();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('P041_RANDOM_UNIT_OUT_OF_RANGE');
  return Math.floor(value * maxExclusive) + 1;
}

const byKindAndIndex: Readonly<Record<P041FeedbackKind, readonly P041FeedbackId[]>> = {
  wrong: [76, 105, 91],
  right: [168, 139, 119, 152],
};

const resetCleanup: readonly P041Cleanup[] = Object.freeze([
  'abort-pending-work', 'retire-page-owned-media', 'reset-native-stage',
]);

export function p041InitialState(epoch = 0): P041State {
  return {phase: 'prequiz', mainFrame: 1, mainTimelinePlaying: false,
    quizSection: false, quizTryCount: 0, quizButtonsEnabled: false,
    nMhButtonEnabled: 'unverified', wrongFeedText: null, pendingHostCall: null,
    feedback: null, epoch, sourceToAudioAlignment: 'unresolved',
    lessonCompleted: false};
}

function reject(state: P041State, reason: string): P041Transition {
  return {accepted: false, reason, state, cleanup: []};
}

function accept(state: P041State, reason: string, cleanup: readonly P041Cleanup[] = []): P041Transition {
  return {accepted: true, reason, state, cleanup};
}

function validFrame(frame: number, max: number): void {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > max) throw new RangeError('P041_INVALID_SOURCE_FRAME');
}

/** Caller supplies observed source-frame events; this reducer owns no timer or audio transport. */
export function p041Reduce(state: P041State, event: P041Event, draw?: P041Draw): P041Transition {
  if (event.type === 'replay') {
    if (state.phase === 'left') return reject(state, 'left session cannot replay');
    return accept(p041InitialState(state.epoch + 1), 'modern Replay resets page state and invalidates pending work', resetCleanup);
  }
  if (event.type === 'leave') {
    if (state.phase === 'left') return reject(state, 'already left');
    return accept({...p041InitialState(state.epoch + 1), phase: 'left'},
      'modern My Lesson navigation/unmount invalidates page resources', resetCleanup);
  }
  if (state.phase === 'left') return reject(state, 'session left');

  switch (event.type) {
    case 'play': {
      if (state.feedback && state.phase === 'feedback-playing' && !state.feedback.playing)
        return accept({...state, feedback: {...state.feedback, playing: true}}, 'resume selected feedback frame observer');
      if ((state.phase === 'prequiz' || state.phase === 'postquiz-resume' || state.phase === 'postquiz') &&
        !state.mainTimelinePlaying)
        return accept({...state, mainTimelinePlaying: true}, 'host Play resumes main source frame observer');
      return reject(state, 'Play unavailable in held or already-playing phase');
    }
    case 'pause': {
      if (state.feedback && state.phase === 'feedback-playing' && state.feedback.playing)
        return accept({...state, feedback: {...state.feedback, playing: false}}, 'hold selected feedback frame; audio cursor remains unbound');
      if (state.mainTimelinePlaying)
        return accept({...state, mainTimelinePlaying: false}, 'hold main source frame; audio cursor remains unbound');
      return reject(state, 'nothing playing');
    }
    case 'advance-main': {
      validFrame(event.frame, P041_SOURCE.mainLastFrame);
      if (event.epoch !== state.epoch || !state.mainTimelinePlaying ||
        (state.phase !== 'prequiz' && state.phase !== 'postquiz-resume' && state.phase !== 'postquiz') ||
        event.frame <= state.mainFrame) return reject(state, 'main held, wrong phase or non-increasing frame');
      if (state.phase === 'prequiz') {
        const frame = Math.min(event.frame, P041_SOURCE.quizFrame);
        if (frame === P041_SOURCE.quizFrame)
          return accept({...state, phase: 'quiz-held', mainFrame: frame, mainTimelinePlaying: false,
            quizSection: true, quizTryCount: 0, quizButtonsEnabled: true,
            nMhButtonEnabled: 'unverified'}, 'source sprite 169 frame 752 stop and quiz reset');
        return accept({...state, mainFrame: frame}, 'observed source main frame');
      }
      if (state.phase === 'postquiz-resume' && event.frame < P041_SOURCE.postQuizFrame)
        return reject(state, 'parent has not reached frame 753');
      if (event.frame === P041_SOURCE.mainLastFrame)
        return accept({...state, phase: 'engineering-end-held', mainFrame: event.frame,
          mainTimelinePlaying: false, quizButtonsEnabled: false},
        'audited sprite boundary only; no lesson-complete signal');
      return accept({...state, phase: 'postquiz', mainFrame: event.frame,
        quizSection: false, quizButtonsEnabled: false}, 'source postquiz frame');
    }
    case 'choose': {
      if (state.phase !== 'quiz-held' || !state.quizButtonsEnabled || state.feedback ||
        !Object.prototype.hasOwnProperty.call(P041_SOURCE.answerCharacters, event.answer))
        return reject(state, 'answer unavailable');
      const kind: P041FeedbackKind = event.answer === 3 ? 'right' : 'wrong';
      const nextCount = kind === 'wrong' ? (state.quizTryCount + 1) as 1 | 2 : state.quizTryCount;
      if (nextCount > 2) return reject(state, 'source two-wrong branch already exhausted');
      return accept({...state, phase: 'host-selection-pending', mainTimelinePlaying: false,
        quizTryCount: nextCount, quizButtonsEnabled: false, nMhButtonEnabled: false,
        wrongFeedText: kind === 'wrong' ? (nextCount === 1 ? P041_SOURCE.wrongFirst : P041_SOURCE.wrongLater) : null,
        pendingHostCall: kind},
      kind === 'wrong' ? 'button 44 increments count before showWrongFeed' : 'button 45 calls showRightFeed');
    }
    case 'resolve-host-feedback': {
      const kind = state.pendingHostCall;
      if (state.phase !== 'host-selection-pending' || !kind) return reject(state, 'no authored host call pending');
      if (!draw) throw new Error('P041_HOST_DRAW_REQUIRED');
      const max = kind === 'wrong' ? 3 : 4;
      const index = draw(max, kind);
      if (!Number.isSafeInteger(index) || index < 1 || index > max) throw new RangeError('P041_HOST_DRAW_OUT_OF_RANGE');
      const spriteId = byKindAndIndex[kind][index - 1];
      const generation = state.epoch + 1;
      return accept({...state, phase: 'feedback-playing', pendingHostCall: null,
        epoch: generation, feedback: {spriteId, kind, frame: 2, playing: true,
          closeRequested: false, generation, hostX: 5}},
      `conditional indexMI show${kind === 'wrong' ? 'Wrong' : 'Right'}Feed draw ${index}; gotoAndPlay(2), x=5`);
    }
    case 'advance-feedback': {
      const feedback = state.feedback;
      if (!feedback || event.epoch !== state.epoch ||
        state.phase !== 'feedback-playing' || !feedback.playing ||
        event.generation !== feedback.generation) return reject(state, 'feedback held, absent or stale generation');
      const spec = P041_FEEDBACK[feedback.spriteId];
      validFrame(event.frame, spec.terminal);
      if (event.frame <= feedback.frame) return reject(state, 'non-increasing feedback frame');
      if (spec.kind === 'wrong' && !feedback.closeRequested) {
        const frame = Math.min(event.frame, spec.hold);
        if (frame === spec.hold)
          return accept({...state, phase: 'wrong-feedback-held', feedback: {...feedback, frame, playing: false}},
            'authored wrong feedback stop; Close required');
        return accept({...state, feedback: {...feedback, frame}}, 'observed selected wrong feedback frame');
      }
      if (event.frame >= spec.terminal) {
        if (spec.kind === 'wrong') {
          const second = state.quizTryCount >= 2;
          return accept({...state, phase: second ? 'postquiz-resume' : 'quiz-held',
            mainFrame: P041_SOURCE.quizFrame, mainTimelinePlaying: second,
            quizSection: !second, quizTryCount: second ? 0 : 1,
            quizButtonsEnabled: true, nMhButtonEnabled: true,
            wrongFeedText: null, feedback: null},
          second ? 'wrong terminal resets count and resumes parent toward 753' :
            'wrong terminal enables retry at held quiz 752', ['retire-selected-feedback']);
        }
        return accept({...state, phase: 'postquiz-resume',
          mainFrame: P041_SOURCE.quizFrame, mainTimelinePlaying: true,
          quizSection: false, quizButtonsEnabled: false, nMhButtonEnabled: false,
          feedback: null}, 'right terminal clears quiz and resumes parent toward 753',
          ['retire-selected-feedback']);
      }
      return accept({...state, feedback: {...feedback, frame: event.frame}}, 'observed selected feedback frame');
    }
    case 'close-wrong': {
      const feedback = state.feedback;
      if (!feedback || feedback.kind !== 'wrong' || feedback.closeRequested ||
        event.generation !== feedback.generation ||
        (state.phase !== 'feedback-playing' && state.phase !== 'wrong-feedback-held'))
        return reject(state, 'no closable selected wrong feedback');
      const spec = P041_FEEDBACK[feedback.spriteId];
      if (spec.kind !== 'wrong' || feedback.frame < spec.closePlacementFirst || feedback.frame > spec.hold)
        return reject(state, 'Close placement not yet reached or hold passed');
      return accept({...state, phase: 'feedback-playing', feedback: {...feedback,
        frame: spec.closeJump, playing: true, closeRequested: true}},
      `source Close ${spec.closeButton}: gotoAndPlay(${spec.closeJump}); reset AnsBtn1..4`);
    }
  }
}
