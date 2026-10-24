/** Source-bounded P060 interaction model. Original-runtime parity is not established. */
export const P060_ID = 'shared-nms002-l02-p060';
export const P060_SOURCE_SHA = '80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1';
export const P060_MAIN_FRAMES = 721;
export const P060_FPS = 12;
export const P060_STOPS = [262, 400, 527, 646, 699, 718] as const;
export const P060_WRONG_IDS = [205, 217, 245] as const;
export const P060_RIGHT_IDS = [354, 296, 275, 322] as const;
export const P060_GLOSSARY_KEYS = [
  'Decimal fraction', 'Equivalent', 'Fraction', 'Decimal',
  'Grid', 'Part', 'Value', 'Represent',
] as const;

export type P060GlossaryKey = typeof P060_GLOSSARY_KEYS[number];
export type P060Stop = typeof P060_STOPS[number];
export type P060BoxId = 139 | 190;
export type P060WrongId = typeof P060_WRONG_IDS[number];
export type P060RightId = typeof P060_RIGHT_IDS[number];
export type P060Feedback = {
  kind: 'wrong' | 'right';
  spriteId: P060WrongId | P060RightId;
  frame: number;
  terminalFrame: number;
  /** The host shows feedback at local frame 2; frame-1 scripts stop. */
  playing: boolean;
};
export type P060Box = {
  spriteId: P060BoxId;
  frame: number;
  terminalFrame: 20 | 109;
  releaseFrame: 15 | 103;
  playing: boolean;
};
export type P060State = {
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
  box: P060Box | null;
  feedback: P060Feedback | null;
  popupVisible: boolean;
  glossaryKey: P060GlossaryKey | null;
  glossaryReturnPlaying: boolean;
  pausedByUser: boolean;
  navigatedAway: boolean;
  activeAudioDomain: `sprite-${number}` | null;
  initialSeed: number;
  selectionSeed: number;
  /** Conditional indexMI selection, deterministic in modern tests; not historical RNG parity. */
  feedbackSelectionPolicy: 'conditional-indexmi-seeded-modern';
  /** gotoAndPlay(1) encounters a source stop on local frame 1. */
  boxStartPolicy: 'enter-stopped-frame-1-needs-explicit-play';
  originalRuntimeParityEstablished: false;
};

export type P060Event =
  | { type: 'continue' }
  | { type: 'reveal' }
  | { type: 'box-play' }
  | { type: 'box-release' }
  | { type: 'answer'; ordinal: 1 | 2 | 3 | 4 }
  | { type: 'hint' }
  | { type: 'popup-close' }
  | { type: 'glossary-open'; key: P060GlossaryKey }
  | { type: 'glossary-close' }
  | { type: 'pause' }
  | { type: 'play' }
  | { type: 'replay' }
  | { type: 'navigate-away' };

const WRONG_TERMINALS: Record<P060WrongId, number> = {
  205: 29, 217: 28, 245: 28,
};
const RIGHT_TERMINALS: Record<P060RightId, number> = {
  354: 25, 296: 33, 275: 28, 322: 31,
};

function validFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 1 || frame > P060_MAIN_FRAMES) {
    throw new RangeError(`P060 main frame must be an integer in 1..${P060_MAIN_FRAMES}`);
  }
}

function validSeed(seed: number): void {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new RangeError('P060 seed must be an unsigned 32-bit integer');
  }
}

export function p060SourceFrame(frame: number): {
  frame: number;
  sourceStop: boolean;
  stop: P060Stop | null;
  sourceQuizSectionAssignment: boolean | null;
  sourceQuizTryCountReset: boolean;
  mainStreamBlockPresent: boolean;
} {
  validFrame(frame);
  const stop = P060_STOPS.find((value) => value === frame) ?? null;
  return {
    frame,
    sourceStop: stop !== null,
    stop,
    sourceQuizSectionAssignment: frame === 700 ? false :
      (frame === 262 || frame === 400 || frame === 527 || frame === 646 || frame === 699) ? true : null,
    sourceQuizTryCountReset: frame === 699,
    mainStreamBlockPresent: frame >= 9 && frame <= 711,
  };
}

export function createP060State(seed = 0): P060State {
  validSeed(seed);
  return {
    mainFrame: 1,
    mainPlaying: true,
    quizSection: false,
    quizTryCount: 0,
    aTextVisible: true,
    revealClipVisible: true,
    hintVisible: false,
    hintEnabled: true,
    quizControlsVisible: false,
    quizControlsEnabled: false,
    box: null,
    feedback: null,
    popupVisible: false,
    glossaryKey: null,
    glossaryReturnPlaying: false,
    pausedByUser: false,
    navigatedAway: false,
    activeAudioDomain: null,
    initialSeed: seed,
    selectionSeed: seed,
    feedbackSelectionPolicy: 'conditional-indexmi-seeded-modern',
    boxStartPolicy: 'enter-stopped-frame-1-needs-explicit-play',
    originalRuntimeParityEstablished: false,
  };
}

function audioForMain(frame: number, playing: boolean): P060State['activeAudioDomain'] {
  return playing && frame >= 9 && frame <= 711 ? 'sprite-391' : null;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function finishFeedback(state: P060State): P060State {
  const feedback = state.feedback;
  if (!feedback) return state;
  if (feedback.kind === 'right') {
    return { ...state, feedback: null, quizSection: false, mainPlaying: true,
      quizControlsEnabled: false, quizControlsVisible: false, activeAudioDomain: null };
  }
  const tries = state.quizTryCount + 1;
  if (tries >= 2) {
    return { ...state, feedback: null, quizTryCount: 0, quizSection: false,
      mainPlaying: true, quizControlsEnabled: true, quizControlsVisible: true,
      hintEnabled: true, activeAudioDomain: null };
  }
  return { ...state, feedback: null, quizTryCount: tries, mainPlaying: false,
    quizControlsEnabled: true, quizControlsVisible: true, hintEnabled: true,
    activeAudioDomain: null };
}

function step(state: P060State): P060State {
  if (state.navigatedAway || state.pausedByUser || state.glossaryKey) return state;
  if (state.feedback) {
    if (!state.feedback.playing) return state;
    const frame = Math.min(state.feedback.frame + 1, state.feedback.terminalFrame);
    const next = { ...state, feedback: { ...state.feedback, frame } };
    return frame === state.feedback.terminalFrame ? finishFeedback(next) : next;
  }
  if (state.box?.playing) {
    const frame = Math.min(state.box.frame + 1, state.box.terminalFrame);
    if (frame === state.box.releaseFrame) {
      return { ...state, box: { ...state.box, frame, playing: false } };
    }
    if (frame === state.box.terminalFrame) {
      return { ...state, box: { ...state.box, frame: 1, playing: false },
        hintVisible: true, hintEnabled: true };
    }
    return { ...state, box: { ...state.box, frame } };
  }
  if (!state.mainPlaying || state.mainFrame >= P060_MAIN_FRAMES) return state;
  const frame = state.mainFrame + 1;
  const stop = p060SourceFrame(frame).sourceStop;
  let next: P060State = { ...state, mainFrame: frame, mainPlaying: !stop,
    activeAudioDomain: audioForMain(frame, !stop) };
  if (frame === 262 || frame === 400 || frame === 527 || frame === 646) {
    next = { ...next, quizSection: true, aTextVisible: false,
      revealClipVisible: true, box: null, hintVisible: false };
  } else if (frame === 699) {
    next = { ...next, quizSection: true, quizTryCount: 0,
      popupVisible: false, quizControlsVisible: true, quizControlsEnabled: true,
      hintVisible: true, hintEnabled: true, box: null };
  } else if (frame === 700) {
    // Source frame 700 removes depths 335/337/339/341/343 and popup 475.
    next = { ...next, quizSection: false, quizControlsVisible: false,
      quizControlsEnabled: false, hintVisible: false, popupVisible: false };
  }
  return next;
}

/** One tick advances only the active local timeline; no wall-clock or DOM side effects. */
export function advanceP060State(state: P060State, frameSteps: number): P060State {
  if (!Number.isInteger(frameSteps) || frameSteps < 0 || frameSteps > 100_000) {
    throw new RangeError('P060 frameSteps must be an integer in 0..100000');
  }
  let next = state;
  for (let index = 0; index < frameSteps; index += 1) next = step(next);
  return next;
}

function availableGlossaryKey(state: P060State, key: P060GlossaryKey): boolean {
  if (!P060_GLOSSARY_KEYS.includes(key)) return false;
  if (key === 'Value' || key === 'Represent') return state.popupVisible;
  if (key === 'Decimal' || key === 'Grid' || key === 'Part') {
    // These buttons also occur inside Mc_box1 from its local frame 1, while
    // its parent instance is hidden until the frame-527 reveal branch.
    return state.mainFrame >= 528 ||
      (state.mainFrame === 527 && state.box?.spriteId === 139);
  }
  return true;
}

export function dispatchP060State(state: P060State, event: P060Event): P060State {
  if (event.type === 'replay') return createP060State(state.initialSeed);
  if (event.type === 'navigate-away') {
    return { ...state, navigatedAway: true, mainPlaying: false, box: null,
      feedback: null, popupVisible: false, glossaryKey: null, activeAudioDomain: null };
  }
  if (state.navigatedAway) return state;
  if (event.type === 'pause') return { ...state, pausedByUser: true, activeAudioDomain: null };
  if (event.type === 'play') return { ...state, pausedByUser: false,
    activeAudioDomain: state.glossaryKey ? null : state.feedback ? `sprite-${state.feedback.spriteId}` :
      audioForMain(state.mainFrame, state.mainPlaying) };
  if (event.type === 'glossary-close') {
    if (!state.glossaryKey) return state;
    return { ...state, glossaryKey: null, mainPlaying: state.glossaryReturnPlaying,
      glossaryReturnPlaying: false,
      activeAudioDomain: state.pausedByUser ? null :
        audioForMain(state.mainFrame, state.glossaryReturnPlaying) };
  }
  if (state.glossaryKey) return state;
  if (event.type === 'glossary-open') {
    if (state.feedback || !availableGlossaryKey(state, event.key)) return state;
    return { ...state, glossaryKey: event.key, glossaryReturnPlaying: state.mainPlaying,
      mainPlaying: false, activeAudioDomain: null };
  }
  // Dismissing a modal must remain possible while playback stays paused.
  if (event.type === 'popup-close') {
    if (!state.popupVisible) return state;
    // Source button 370 hides itself and reenables quiz controls; dismissing the
    // enclosing popup is the explicit accessible modern policy here.
    return { ...state, popupVisible: false, hintEnabled: true,
      quizControlsEnabled: true, quizControlsVisible: true };
  }
  // Source glossary controls remain usable during an explicit playback pause.
  // All source playback/quiz actions below still require an unpaused state.
  if (state.pausedByUser) return state;
  if (event.type === 'continue') {
    if (![262, 400, 527, 646].includes(state.mainFrame) || state.mainPlaying || state.feedback) return state;
    return { ...state, quizSection: false, mainPlaying: true, box: null,
      hintVisible: false, activeAudioDomain: audioForMain(state.mainFrame, true) };
  }
  if (event.type === 'reveal') {
    if ((state.mainFrame !== 527 && state.mainFrame !== 646) || state.mainPlaying ||
        !state.revealClipVisible || state.feedback) return state;
    const box: P060Box = state.mainFrame === 527
      ? { spriteId: 139, frame: 1, releaseFrame: 15, terminalFrame: 20, playing: false }
      : { spriteId: 190, frame: 1, releaseFrame: 103, terminalFrame: 109, playing: false };
    return { ...state, revealClipVisible: false, box, hintVisible: true };
  }
  if (event.type === 'box-play') {
    if (!state.box || state.box.frame !== 1 || state.box.playing) return state;
    return { ...state, box: { ...state.box, playing: true } };
  }
  if (event.type === 'box-release') {
    if (!state.box || state.box.frame !== state.box.releaseFrame || state.box.playing) return state;
    return { ...state, quizSection: false, box: { ...state.box, playing: true },
      hintEnabled: true };
  }
  if (event.type === 'answer') {
    if (state.mainFrame !== 699 || state.mainPlaying || state.feedback ||
        state.popupVisible || !state.quizControlsEnabled || !state.quizControlsVisible ||
        ![1, 2, 3, 4].includes(event.ordinal)) return state;
    const kind = event.ordinal === 1 ? 'right' : 'wrong';
    const choices = kind === 'right' ? P060_RIGHT_IDS : P060_WRONG_IDS;
    const spriteId = choices[state.selectionSeed % choices.length];
    const terminalFrame = kind === 'right'
      ? RIGHT_TERMINALS[spriteId as P060RightId]
      : WRONG_TERMINALS[spriteId as P060WrongId];
    return { ...state, selectionSeed: nextSeed(state.selectionSeed),
      feedback: { kind, spriteId, frame: 2, terminalFrame, playing: true },
      quizControlsEnabled: false, quizControlsVisible: false, hintEnabled: false,
      activeAudioDomain: `sprite-${spriteId}` };
  }
  if (event.type === 'hint') {
    if (state.mainFrame !== 699 || state.mainPlaying || state.feedback ||
        !state.hintVisible || !state.hintEnabled || state.popupVisible) return state;
    return { ...state, popupVisible: true, hintEnabled: false,
      quizControlsEnabled: false, quizControlsVisible: false };
  }
  return state;
}
