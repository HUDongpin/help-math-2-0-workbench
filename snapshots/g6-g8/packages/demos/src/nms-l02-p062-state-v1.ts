/** Source-bounded P062 interaction model. Historical host and original-runtime parity remain open. */
export const P062_ID = 'shared-nms002-l02-p062';
export const P062_SOURCE_SHA = '5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50';
export const P062_MAIN_FRAMES = 837;
export const P062_FPS = 12;
export const P062_STOPS = [384, 523, 650, 766, 815, 834] as const;
/** Conditional identified indexMI selector: random(3)+1. Its P062 historical binding is unproved. */
export const P062_WRONG_IDS = [138, 150, 178] as const;
/** Source also places early Wrong1 sprite 85 and final Wrong4 sprite 192. */
export const P062_SOURCE_WRONG_IDS = [85, 138, 150, 178, 192] as const;
/** Conditional identified indexMI selector: random(4)+1. */
export const P062_RIGHT_IDS = [288, 230, 209, 256] as const;
/** Source Right5 sprite 302 is outside that conditional selector. */
export const P062_SOURCE_RIGHT_IDS = [288, 230, 209, 256, 302] as const;
/** All seven source button scripts are quiz/help/popup controls. None sets KeyAttribute. */
export const P062_SOURCE_GLOSSARY_CONTROLS_PRESENT = false;

export type P062Stop = typeof P062_STOPS[number];
export type P062BoxId = 106 | 122;
export type P062WrongId = typeof P062_WRONG_IDS[number];
export type P062RightId = typeof P062_RIGHT_IDS[number];
export type P062Feedback = {
  kind: 'wrong' | 'right';
  spriteId: P062WrongId | P062RightId;
  frame: number;
  terminalFrame: number;
  /** Conditional host enters local frame 2, not a proven historical P062 trace. */
  playing: boolean;
};
export type P062Box = {
  spriteId: P062BoxId;
  frame: number;
  releaseFrame: 15 | 21;
  terminalFrame: 20 | 27;
  playing: boolean;
};
export type P062State = {
  mainFrame: number;
  mainPlaying: boolean;
  quizSection: boolean;
  quizTryCount: number;
  aTextVisible: boolean;
  revealClipVisible: boolean;
  hintVisible: boolean;
  hintEnabled: boolean;
  quizControlsVisible: boolean;
  quizControlsEnabled: boolean;
  box: P062Box | null;
  feedback: P062Feedback | null;
  popupVisible: boolean;
  pausedByUser: boolean;
  navigatedAway: boolean;
  activeAudioDomain: `sprite-${number}` | null;
  initialSeed: number;
  selectionSeed: number;
  feedbackSelectionPolicy: 'conditional-indexmi-seeded-modern';
  boxStartPolicy: 'enter-stopped-frame-1-needs-explicit-play';
  sourceGlossaryControlsPresent: false;
  originalRuntimeParityEstablished: false;
  historicalHostAssociationEstablished: false;
};

export type P062Event =
  | {type: 'continue'}
  | {type: 'reveal'}
  | {type: 'box-play'}
  | {type: 'box-release'}
  | {type: 'answer'; ordinal: 1 | 2 | 3 | 4}
  | {type: 'hint'}
  | {type: 'popup-close'}
  | {type: 'pause'}
  | {type: 'play'}
  | {type: 'replay'}
  | {type: 'navigate-away'};

const WRONG_TERMINALS: Record<P062WrongId, number> = {138: 29, 150: 28, 178: 28};
const RIGHT_TERMINALS: Record<P062RightId, number> = {288: 25, 230: 33, 209: 28, 256: 31};

function validFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 1 || frame > P062_MAIN_FRAMES)
    throw new RangeError(`P062 main frame must be an integer in 1..${P062_MAIN_FRAMES}`);
}
function validSeed(seed: number): void {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff)
    throw new RangeError('P062 seed must be an unsigned 32-bit integer');
}

export function p062SourceFrame(frame: number): {
  frame: number;
  sourceStop: boolean;
  stop: P062Stop | null;
  sourceQuizSectionAssignment: boolean | null;
  sourceQuizTryCountReset: boolean;
  mainStreamBlockPresent: boolean;
} {
  validFrame(frame);
  const stop = P062_STOPS.find(value => value === frame) ?? null;
  return {
    frame, sourceStop: stop !== null, stop,
    sourceQuizSectionAssignment: frame === 816 ? false :
      ([384, 523, 650, 766, 815] as number[]).includes(frame) ? true : null,
    sourceQuizTryCountReset: frame === 815,
    mainStreamBlockPresent: frame >= 9 && frame <= 828,
  };
}

export function createP062State(seed = 0): P062State {
  validSeed(seed);
  return {
    mainFrame: 1, mainPlaying: true, quizSection: false, quizTryCount: 0,
    aTextVisible: true, revealClipVisible: true, hintVisible: false,
    hintEnabled: true, quizControlsVisible: false, quizControlsEnabled: false,
    box: null, feedback: null, popupVisible: false, pausedByUser: false,
    navigatedAway: false, activeAudioDomain: null, initialSeed: seed,
    selectionSeed: seed, feedbackSelectionPolicy: 'conditional-indexmi-seeded-modern',
    boxStartPolicy: 'enter-stopped-frame-1-needs-explicit-play',
    sourceGlossaryControlsPresent: false, originalRuntimeParityEstablished: false,
    historicalHostAssociationEstablished: false,
  };
}

const audioForMain = (frame: number, playing: boolean): P062State['activeAudioDomain'] =>
  playing && frame >= 9 && frame <= 828 ? 'sprite-315' : null;
const nextSeed = (seed: number): number => (Math.imul(seed, 1664525) + 1013904223) >>> 0;

function finishFeedback(state: P062State): P062State {
  const feedback = state.feedback;
  if (!feedback) return state;
  if (feedback.kind === 'right')
    return {...state, feedback: null, quizSection: false, mainPlaying: true,
      quizControlsEnabled: false, quizControlsVisible: false, activeAudioDomain: null};
  const tries = state.quizTryCount + 1;
  if (tries >= 2)
    return {...state, feedback: null, quizTryCount: 0, quizSection: false,
      mainPlaying: true, quizControlsEnabled: true, quizControlsVisible: true,
      hintEnabled: true, activeAudioDomain: null};
  return {...state, feedback: null, quizTryCount: tries, mainPlaying: false,
    quizControlsEnabled: true, quizControlsVisible: true, hintEnabled: true,
    activeAudioDomain: null};
}

function step(state: P062State): P062State {
  if (state.navigatedAway || state.pausedByUser) return state;
  if (state.feedback) {
    if (!state.feedback.playing) return state;
    const frame = Math.min(state.feedback.frame + 1, state.feedback.terminalFrame);
    const next = {...state, feedback: {...state.feedback, frame}};
    return frame === state.feedback.terminalFrame ? finishFeedback(next) : next;
  }
  if (state.box?.playing) {
    const frame = Math.min(state.box.frame + 1, state.box.terminalFrame);
    if (frame === state.box.releaseFrame)
      return {...state, box: {...state.box, frame, playing: false}};
    if (frame === state.box.terminalFrame)
      return {...state, box: {...state.box, frame: 1, playing: false},
        hintVisible: true, hintEnabled: true};
    return {...state, box: {...state.box, frame}};
  }
  if (!state.mainPlaying || state.mainFrame >= P062_MAIN_FRAMES) return state;
  const frame = state.mainFrame + 1;
  let next: P062State = {...state, mainFrame: frame,
    mainPlaying: !p062SourceFrame(frame).sourceStop,
    activeAudioDomain: audioForMain(frame, !p062SourceFrame(frame).sourceStop)};
  if ([384, 523, 650, 766].includes(frame)) {
    next = {...next, quizSection: true, aTextVisible: false,
      revealClipVisible: true, box: null, hintVisible: false};
  } else if (frame === 815) {
    next = {...next, quizSection: true, quizTryCount: 0, popupVisible: false,
      quizControlsVisible: true, quizControlsEnabled: true,
      hintVisible: true, hintEnabled: true, box: null};
  } else if (frame === 816) {
    // Source removes answer depths 200/202/204/206, NMHBtn 208, feedback, and popup 340.
    next = {...next, quizSection: false, quizControlsVisible: false,
      quizControlsEnabled: false, hintVisible: false, popupVisible: false};
  }
  return next;
}

/** One tick advances only the active local timeline. */
export function advanceP062State(state: P062State, frameSteps: number): P062State {
  if (!Number.isInteger(frameSteps) || frameSteps < 0 || frameSteps > 100_000)
    throw new RangeError('P062 frameSteps must be an integer in 0..100000');
  let next = state;
  for (let index = 0; index < frameSteps; index += 1) next = step(next);
  return next;
}

export function dispatchP062State(state: P062State, event: P062Event): P062State {
  if (event.type === 'replay') return createP062State(state.initialSeed);
  if (event.type === 'navigate-away')
    return {...state, navigatedAway: true, mainPlaying: false, box: null,
      feedback: null, popupVisible: false, activeAudioDomain: null};
  if (state.navigatedAway) return state;
  if (event.type === 'pause') return {...state, pausedByUser: true, activeAudioDomain: null};
  if (event.type === 'play')
    return {...state, pausedByUser: false,
      activeAudioDomain: state.feedback ? `sprite-${state.feedback.spriteId}` :
        audioForMain(state.mainFrame, state.mainPlaying)};
  if (event.type === 'popup-close') {
    if (!state.popupVisible) return state;
    // Source button 304 hides itself and reenables quiz buttons. Modal dismissal
    // is an explicit accessible modern policy; main remains at authored stop 815.
    return {...state, popupVisible: false, hintEnabled: true,
      quizControlsEnabled: true, quizControlsVisible: true};
  }
  if (state.pausedByUser) return state;
  if (event.type === 'continue') {
    if (![384, 523, 650, 766].includes(state.mainFrame) || state.mainPlaying || state.feedback)
      return state;
    return {...state, quizSection: false, mainPlaying: true, box: null,
      hintVisible: false, activeAudioDomain: audioForMain(state.mainFrame, true)};
  }
  if (event.type === 'reveal') {
    if ((state.mainFrame !== 650 && state.mainFrame !== 766) || state.mainPlaying ||
        !state.revealClipVisible || state.feedback) return state;
    const box: P062Box = state.mainFrame === 650
      ? {spriteId: 106, frame: 1, releaseFrame: 15, terminalFrame: 20, playing: false}
      : {spriteId: 122, frame: 1, releaseFrame: 21, terminalFrame: 27, playing: false};
    return {...state, revealClipVisible: false, box, hintVisible: true};
  }
  if (event.type === 'box-play') {
    if (!state.box || state.box.frame !== 1 || state.box.playing) return state;
    return {...state, box: {...state.box, playing: true}};
  }
  if (event.type === 'box-release') {
    if (!state.box || state.box.frame !== state.box.releaseFrame || state.box.playing)
      return state;
    return {...state, quizSection: false, box: {...state.box, playing: true},
      hintEnabled: true};
  }
  if (event.type === 'answer') {
    if (state.mainFrame !== 815 || state.mainPlaying || state.feedback ||
        state.popupVisible || !state.quizControlsEnabled || !state.quizControlsVisible ||
        ![1, 2, 3, 4].includes(event.ordinal)) return state;
    const kind = event.ordinal === 3 ? 'right' : 'wrong';
    const choices = kind === 'right' ? P062_RIGHT_IDS : P062_WRONG_IDS;
    const spriteId = choices[state.selectionSeed % choices.length];
    const terminalFrame = kind === 'right'
      ? RIGHT_TERMINALS[spriteId as P062RightId]
      : WRONG_TERMINALS[spriteId as P062WrongId];
    return {...state, selectionSeed: nextSeed(state.selectionSeed),
      feedback: {kind, spriteId, frame: 2, terminalFrame, playing: true},
      quizControlsEnabled: false, quizControlsVisible: false, hintEnabled: false,
      activeAudioDomain: `sprite-${spriteId}`};
  }
  if (event.type === 'hint') {
    if (state.mainFrame !== 815 || state.mainPlaying || state.feedback ||
        !state.hintVisible || !state.hintEnabled || state.popupVisible) return state;
    return {...state, popupVisible: true, hintEnabled: false,
      quizControlsEnabled: false, quizControlsVisible: false};
  }
  return state;
}
