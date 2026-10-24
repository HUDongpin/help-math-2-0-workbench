/** P006 static SWF bindings. Placement does not establish a clipped hit target. */
export const P006_SOURCE_SHA256 = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
export const P006_MAIN_FRAME_COUNT = 342;
export const P006_GLOSSARY_SEGMENTS = [
  {firstFrame: 249, lastFrame: 337, ratio: 248},
  {firstFrame: 338, lastFrame: 342, ratio: 337},
] as const;
export const P006_GLOSSARY_BUTTONS = [
  {characterId: 48, term: 'Coordinate', depth: 21},
  {characterId: 49, term: 'Graph', depth: 23},
  {characterId: 50, term: 'Equation', depth: 25},
  {characterId: 51, term: 'Inequality', depth: 27},
] as const;

/** Modern close policy only; original-host close/resume parity is unverified. */
export const P006_MODERN_CLOSE_POLICY = 'clear-request-stay-paused-until-explicit-resume; original-parity-pending';

export type P006GlossaryButton = (typeof P006_GLOSSARY_BUTTONS)[number];
export type P006Transport = 'playing' | 'paused' | 'stopped';

export interface P006GlossaryState {
  readonly frame: number;
  readonly transport: P006Transport;
  readonly pendingGlossary: null | {
    readonly term: P006GlossaryButton['term'];
    readonly sourceCharacterId: P006GlossaryButton['characterId'];
    readonly requestedAtFrame: number;
  };
}

/** Main sprite 53 frame; the root places it at root frame 6. */
export function initialP006GlossaryState(): P006GlossaryState {
  return {frame: 1, transport: 'playing', pendingGlossary: null};
}

/** End-of-frame display-list presence only. The changing mask may clip every button. */
export function placedP006GlossaryButtons(frame: number): readonly P006GlossaryButton[] {
  if (!Number.isInteger(frame) || frame < 1 || frame > P006_MAIN_FRAME_COUNT) return [];
  return P006_GLOSSARY_SEGMENTS.some(({firstFrame, lastFrame}) => frame >= firstFrame && frame <= lastFrame)
    ? P006_GLOSSARY_BUTTONS : [];
}

export function advanceP006Glossary(state: P006GlossaryState, frames = 1): P006GlossaryState {
  if (!Number.isSafeInteger(frames) || frames < 1) throw new RangeError('frames must be a positive safe integer');
  if (state.transport !== 'playing') return state;
  const frame = Math.min(P006_MAIN_FRAME_COUNT, state.frame + frames);
  return {...state, frame, transport: frame === P006_MAIN_FRAME_COUNT ? 'stopped' : 'playing'};
}

/** Call only after the host verifies an eligible release through its actual clipping/hit rules. */
export function requestP006GlossaryAfterVerifiedHit(
  state: P006GlossaryState, characterId: number, verifiedHit: boolean,
): P006GlossaryState {
  if (verifiedHit !== true || state.pendingGlossary) return state;
  const button = placedP006GlossaryButtons(state.frame).find(item => item.characterId === characterId);
  if (!button) return state;
  return {
    ...state,
    transport: state.frame === P006_MAIN_FRAME_COUNT ? 'stopped' : 'paused',
    pendingGlossary: {term: button.term, sourceCharacterId: button.characterId, requestedAtFrame: state.frame},
  };
}

/** Modern modal close clears the request; it does not resume the source clock. */
export function closeP006Glossary(state: P006GlossaryState): P006GlossaryState {
  if (!state.pendingGlossary) return state;
  return {...state, transport: state.frame === P006_MAIN_FRAME_COUNT ? 'stopped' : 'paused', pendingGlossary: null};
}

/** Explicit modern host/user action, unavailable while a term is pending or at terminal. */
export function resumeP006Glossary(state: P006GlossaryState): P006GlossaryState {
  if (state.transport !== 'paused' || state.pendingGlossary || state.frame === P006_MAIN_FRAME_COUNT) return state;
  return {...state, transport: 'playing'};
}

/** Deterministic modern Replay; original-host Replay and audio reset remain unverified. */
export function replayP006Glossary(): P006GlossaryState {
  return initialP006GlossaryState();
}
