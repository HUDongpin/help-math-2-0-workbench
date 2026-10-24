/** P004 source button contract; this is not an original-host glossary implementation. */
export const P004_SOURCE_SHA256 = '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334';
export const P004_MAIN_FRAME_COUNT = 969;
export const P004_GLOSSARY_CLOSE_POLICY = 'clear-request-stay-paused-until-explicit-resume; original-parity-pending';

export const P004_GLOSSARY_BUTTONS = [
  {characterId: 63, term: 'Vertical-line test', depth: 151, firstFrame: 19, lastFrame: 969},
  {characterId: 66, term: 'Vertical', depth: 157, firstFrame: 29, lastFrame: 969},
  {characterId: 67, term: 'Graph', depth: 159, firstFrame: 29, lastFrame: 969},
  {characterId: 71, term: 'Point', depth: 165, firstFrame: 203, lastFrame: 969},
  {characterId: 72, term: 'Function', depth: 167, firstFrame: 203, lastFrame: 969},
] as const;

export type P004GlossaryButton = (typeof P004_GLOSSARY_BUTTONS)[number];
export type P004Transport = 'playing' | 'paused' | 'stopped';

export interface P004GlossaryState {
  readonly frame: number;
  readonly transport: P004Transport;
  readonly pendingGlossary: null | {
    readonly term: P004GlossaryButton['term'];
    readonly sourceCharacterId: P004GlossaryButton['characterId'];
    readonly requestedAtFrame: number;
  };
}

/** Main sprite 90 begins after the host enters stopped root frame 6. */
export function initialP004GlossaryState(): P004GlossaryState {
  return {frame: 1, transport: 'playing', pendingGlossary: null};
}

/** SWF display-list presence only; original-host visual occlusion/hit tests remain unverified. */
export function visibleP004GlossaryButtons(frame: number): readonly P004GlossaryButton[] {
  if (!Number.isInteger(frame) || frame < 1 || frame > P004_MAIN_FRAME_COUNT) return [];
  return P004_GLOSSARY_BUTTONS.filter(button => frame >= button.firstFrame && frame <= button.lastFrame);
}

export function advanceP004Glossary(state: P004GlossaryState, frames = 1): P004GlossaryState {
  if (!Number.isSafeInteger(frames) || frames < 1) throw new RangeError('frames must be a positive integer');
  if (state.transport !== 'playing') return state;
  const frame = Math.min(P004_MAIN_FRAME_COUNT, state.frame + frames);
  return {...state, frame, transport: frame === P004_MAIN_FRAME_COUNT ? 'stopped' : 'playing'};
}

/** Source on(release): set KeyAttribute, request DoHyperLinks, stop animation. */
export function requestP004Glossary(state: P004GlossaryState, characterId: number): P004GlossaryState {
  if (state.pendingGlossary) return state;
  const button = visibleP004GlossaryButtons(state.frame).find(item => item.characterId === characterId);
  if (!button) return state;
  return {
    ...state,
    transport: state.frame === P004_MAIN_FRAME_COUNT ? 'stopped' : 'paused',
    pendingGlossary: {term: button.term, sourceCharacterId: button.characterId, requestedAtFrame: state.frame},
  };
}

/** Modern fallback: the source SWF has no close handler; closing alone never resumes. */
export function closeP004Glossary(state: P004GlossaryState): P004GlossaryState {
  if (!state.pendingGlossary) return state;
  return {...state, transport: state.frame === P004_MAIN_FRAME_COUNT ? 'stopped' : 'paused', pendingGlossary: null};
}

/** Explicit host/user action, separate from source button release and modal close. */
export function resumeP004Glossary(state: P004GlossaryState): P004GlossaryState {
  if (state.pendingGlossary || state.frame === P004_MAIN_FRAME_COUNT) return state;
  return {...state, transport: 'playing'};
}

/** Deterministic modern Replay; Flash host Replay and audio-reset parity are pending. */
export function replayP004Glossary(): P004GlossaryState {
  return initialP004GlossaryState();
}
