/** Source keys from P009's eight button release scripts, not dictionary content. */
export const P009_GLOSSARY_SOURCE_SHA256 = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
export const P009_GLOSSARY_MAIN_FRAME_COUNT = 394;

/** Modern native buttons become eligible after the complete source text run is
 * readable. These frames are geometric full-ink containment with full opacity,
 * later than source button placement; original clipped-hit parity is unverified. */
export const P009_GLOSSARY_TERMS = [
  {characterId: 6, sourceKeyAttribute: 'Ordered pair', sourceTextId: 'character-4/run-1', firstReadableFrame: 25},
  {characterId: 7, sourceKeyAttribute: 'Pair', sourceTextId: 'character-4/run-3', firstReadableFrame: 36},
  {characterId: 8, sourceKeyAttribute: 'Locate', sourceTextId: 'character-4/run-5', firstReadableFrame: 59},
  {characterId: 9, sourceKeyAttribute: 'Point', sourceTextId: 'character-4/run-7', firstReadableFrame: 65},
  {characterId: 27, sourceKeyAttribute: 'Coordinate plane/Cartesian Plane', sourceTextId: 'character-26/run-0', firstReadableFrame: 85},
  {characterId: 28, sourceKeyAttribute: 'Coordinate', sourceTextId: 'character-26/run-2', firstReadableFrame: 128},
  {characterId: 32, sourceKeyAttribute: 'X-coordinate', sourceTextId: 'character-31/run-1', firstReadableFrame: 172},
  {characterId: 33, sourceKeyAttribute: 'Y-coordinate', sourceTextId: 'character-31/run-3', firstReadableFrame: 212},
] as const;

/** Closing/returning clears the request and stays paused. Only an explicit host
 * action may resume before terminal; original-host return parity is unverified. */
export const P009_GLOSSARY_CLOSE_POLICY = 'stay-paused-until-explicit-resume; original-parity-pending';

export type P009GlossaryTerm = (typeof P009_GLOSSARY_TERMS)[number];
export type P009GlossaryIntent = P009GlossaryTerm & {readonly requestedAtFrame: number};

function validP009Frame(frame: number): boolean {
  return Number.isSafeInteger(frame) && frame >= 1 && frame <= P009_GLOSSARY_MAIN_FRAME_COUNT;
}

/** Caller owns the native button scope, callback and sole playback clock. This
 * returns only an allowlisted intent; it executes no HTML, dictionary or timer. */
export function requestP009Glossary(
  frame: number, characterId: number, alreadyPending: boolean,
): P009GlossaryIntent | null {
  if (!validP009Frame(frame) || !Number.isSafeInteger(characterId) || alreadyPending !== false) return null;
  const term = P009_GLOSSARY_TERMS.find(item => item.characterId === characterId);
  if (!term || frame < term.firstReadableFrame) return null;
  return {...term, requestedAtFrame: frame};
}

/** Pending requests are the only stored state. Frame/transport remain host-owned. */
export interface P009GlossaryState {
  readonly pending: P009GlossaryIntent | null;
}

export type P009GlossaryAction =
  | {readonly kind: 'request'; readonly frame: number; readonly characterId: number}
  | {readonly kind: 'close' | 'replay' | 'navigation'};

export function initialP009GlossaryState(): P009GlossaryState {
  return {pending: null};
}

/** Request requires the host to pause before dispatching its callback. Close
 * emits no resume; Replay/navigation clear pending before the host resets or
 * disposes its clock. No second playhead or time advancement lives here. */
export function reduceP009Glossary(
  state: P009GlossaryState, action: P009GlossaryAction,
): P009GlossaryState {
  switch (action.kind) {
    case 'request': {
      const intent = requestP009Glossary(action.frame, action.characterId, state.pending !== null);
      return intent ? {pending: intent} : state;
    }
    case 'close':
    case 'replay':
    case 'navigation':
      return state.pending === null ? state : {pending: null};
    default:
      return state;
  }
}

/** Eligibility for a separate explicit host/user resume action, never an
 * automatic close effect. Terminal 394 and invalid frames cannot resume. */
export function canExplicitlyResumeP009(frame: number, alreadyPending: boolean): boolean {
  return validP009Frame(frame) && frame < P009_GLOSSARY_MAIN_FRAME_COUNT && alreadyPending === false;
}
