/** Source-bounded P061 interaction model. Original-runtime parity is not established. */
export const P061_ID = 'shared-nms002-l02-p061';
export const P061_SOURCE_SHA = '4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a';
export const P061_MAIN_FRAMES = 882;
export const P061_FPS = 12;
export const P061_STOPS = [435, 573, 700, 817, 860, 879] as const;
export const P061_WRONG_IDS = [134, 146, 174] as const;
/** Source also defines early sprite 87 and final Wrong4 sprite 188; neither is in the identified host final-quiz random(3)+1 subset. Sprite 87 trigger/parity remains unresolved. */
export const P061_SOURCE_WRONG_IDS = [87, 134, 146, 174, 188] as const;
export const P061_RIGHT_IDS = [284, 226, 205, 252] as const;
/** Right5 source sprite 298 is outside the identified host random(4)+1 subset. */
export const P061_SOURCE_RIGHT_IDS = [284, 226, 205, 252, 298] as const;
export const P061_GLOSSARY_KEYS = [
  'Equivalent decimal', 'Express', 'Denominator', 'Percent',
  'Equivalent fraction', 'Decimal fraction',
] as const;

export type P061GlossaryKey = typeof P061_GLOSSARY_KEYS[number];
export type P061Stop = typeof P061_STOPS[number];
export type P061BoxId = 111 | 118;
export type P061WrongId = typeof P061_WRONG_IDS[number];
export type P061RightId = typeof P061_RIGHT_IDS[number];
export type P061Feedback = {
  kind: 'wrong' | 'right';
  spriteId: P061WrongId | P061RightId;
  frame: number;
  terminalFrame: number;
  /** Conditional identified host uses gotoAndPlay(2); historical P061 host binding is unproved. */
  playing: boolean;
};
export type P061Box = {
  spriteId: P061BoxId;
  frame: number;
  terminalFrame: 20 | 27;
  releaseFrame: 15 | 21;
  playing: boolean;
};
export type P061State = {
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
  box: P061Box | null;
  feedback: P061Feedback | null;
  popupVisible: boolean;
  glossaryKey: P061GlossaryKey | null;
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
  historicalHostAssociationEstablished: false;
  historicalGlossaryBankAssociationEstablished: false;
};

export type P061Event =
  | { type: 'continue' }
  | { type: 'reveal' }
  | { type: 'box-play' }
  | { type: 'box-release' }
  | { type: 'answer'; ordinal: 1 | 2 | 3 | 4 }
  | { type: 'hint' }
  | { type: 'popup-close' }
  | { type: 'glossary-open'; key: P061GlossaryKey }
  | { type: 'glossary-close' }
  | { type: 'pause' }
  | { type: 'play' }
  | { type: 'replay' }
  | { type: 'navigate-away' };

const WRONG_TERMINALS: Record<P061WrongId, number> = {
  134: 29, 146: 28, 174: 28,
};
const RIGHT_TERMINALS: Record<P061RightId, number> = {
  284: 25, 226: 33, 205: 28, 252: 31,
};

function validFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 1 || frame > P061_MAIN_FRAMES) {
    throw new RangeError(`P061 main frame must be an integer in 1..${P061_MAIN_FRAMES}`);
  }
}

function validSeed(seed: number): void {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new RangeError('P061 seed must be an unsigned 32-bit integer');
  }
}

export function p061SourceFrame(frame: number): {
  frame: number;
  sourceStop: boolean;
  stop: P061Stop | null;
  sourceQuizSectionAssignment: boolean | null;
  sourceQuizTryCountReset: boolean;
  mainStreamBlockPresent: boolean;
} {
  validFrame(frame);
  const stop = P061_STOPS.find((value) => value === frame) ?? null;
  return {
    frame,
    sourceStop: stop !== null,
    stop,
    sourceQuizSectionAssignment: frame === 861 ? false :
      (frame === 435 || frame === 573 || frame === 700 || frame === 817 || frame === 860) ? true : null,
    sourceQuizTryCountReset: frame === 860,
    mainStreamBlockPresent: frame >= 9 && frame <= 875,
  };
}

export function createP061State(seed = 0): P061State {
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
    historicalHostAssociationEstablished: false,
    historicalGlossaryBankAssociationEstablished: false,
  };
}

function audioForMain(frame: number, playing: boolean): P061State['activeAudioDomain'] {
  return playing && frame >= 9 && frame <= 875 ? 'sprite-315' : null;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function finishFeedback(state: P061State): P061State {
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

function step(state: P061State): P061State {
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
  if (!state.mainPlaying || state.mainFrame >= P061_MAIN_FRAMES) return state;
  const frame = state.mainFrame + 1;
  const stop = p061SourceFrame(frame).sourceStop;
  let next: P061State = { ...state, mainFrame: frame, mainPlaying: !stop,
    activeAudioDomain: audioForMain(frame, !stop) };
  if (frame === 435 || frame === 573 || frame === 700 || frame === 817) {
    next = { ...next, quizSection: true, aTextVisible: false,
      revealClipVisible: true, box: null, hintVisible: false };
  } else if (frame === 860) {
    next = { ...next, quizSection: true, quizTryCount: 0,
      popupVisible: false, quizControlsVisible: true, quizControlsEnabled: true,
      hintVisible: true, hintEnabled: true, box: null };
  } else if (frame === 861) {
    // Source frame 861 removes answer depths 188/190/192/194, NMHBtn 196 and popup 328.
    next = { ...next, quizSection: false, quizControlsVisible: false,
      quizControlsEnabled: false, hintVisible: false, popupVisible: false };
  }
  return next;
}

/** One tick advances only the active local timeline; no wall-clock or DOM side effects. */
export function advanceP061State(state: P061State, frameSteps: number): P061State {
  if (!Number.isInteger(frameSteps) || frameSteps < 0 || frameSteps > 100_000) {
    throw new RangeError('P061 frameSteps must be an integer in 0..100000');
  }
  let next = state;
  for (let index = 0; index < frameSteps; index += 1) next = step(next);
  return next;
}

function availableGlossaryKey(state: P061State, key: P061GlossaryKey): boolean {
  if (!P061_GLOSSARY_KEYS.includes(key)) return false;
  // Button 96 occurs in Mc_box1 sprite 111 from local frame 1 and on the
  // main timeline from frame 701. The box instance is hidden until reveal.
  if (key === 'Equivalent decimal') {
    return state.mainFrame >= 701 ||
      (state.mainFrame === 700 && state.box?.spriteId === 111);
  }
  // Buttons 303..307 are children of Mc_Popup sprite 314, placed at 860.
  return state.mainFrame === 860 && state.popupVisible;
}

export function dispatchP061State(state: P061State, event: P061Event): P061State {
  if (event.type === 'replay') return createP061State(state.initialSeed);
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
    // Source button 300 hides itself and reenables quiz controls; dismissing the
    // enclosing popup is the explicit accessible modern policy here.
    return { ...state, popupVisible: false, hintEnabled: true,
      quizControlsEnabled: true, quizControlsVisible: true };
  }
  // Source glossary controls remain usable during an explicit playback pause.
  // All source playback/quiz actions below still require an unpaused state.
  if (state.pausedByUser) return state;
  if (event.type === 'continue') {
    if (![435, 573, 700, 817].includes(state.mainFrame) || state.mainPlaying || state.feedback) return state;
    return { ...state, quizSection: false, mainPlaying: true, box: null,
      hintVisible: false, activeAudioDomain: audioForMain(state.mainFrame, true) };
  }
  if (event.type === 'reveal') {
    if ((state.mainFrame !== 700 && state.mainFrame !== 817) || state.mainPlaying ||
        !state.revealClipVisible || state.feedback) return state;
    const box: P061Box = state.mainFrame === 700
      ? { spriteId: 111, frame: 1, releaseFrame: 15, terminalFrame: 20, playing: false }
      : { spriteId: 118, frame: 1, releaseFrame: 21, terminalFrame: 27, playing: false };
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
    if (state.mainFrame !== 860 || state.mainPlaying || state.feedback ||
        state.popupVisible || !state.quizControlsEnabled || !state.quizControlsVisible ||
        ![1, 2, 3, 4].includes(event.ordinal)) return state;
    const kind = event.ordinal === 2 ? 'right' : 'wrong';
    const choices = kind === 'right' ? P061_RIGHT_IDS : P061_WRONG_IDS;
    const spriteId = choices[state.selectionSeed % choices.length];
    const terminalFrame = kind === 'right'
      ? RIGHT_TERMINALS[spriteId as P061RightId]
      : WRONG_TERMINALS[spriteId as P061WrongId];
    return { ...state, selectionSeed: nextSeed(state.selectionSeed),
      feedback: { kind, spriteId, frame: 2, terminalFrame, playing: true },
      quizControlsEnabled: false, quizControlsVisible: false, hintEnabled: false,
      activeAudioDomain: `sprite-${spriteId}` };
  }
  if (event.type === 'hint') {
    if (state.mainFrame !== 860 || state.mainPlaying || state.feedback ||
        !state.hintVisible || !state.hintEnabled || state.popupVisible) return state;
    return { ...state, popupVisible: true, hintEnabled: false,
      quizControlsEnabled: false, quizControlsVisible: false };
  }
  return state;
}
