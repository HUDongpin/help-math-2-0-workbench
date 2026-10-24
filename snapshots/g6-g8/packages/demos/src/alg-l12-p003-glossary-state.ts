/** Source-derived P003 interaction state; no original-host acceptance implied. */
export const P003_SOURCE_SHA256 = '384f7e8e269768063d8e6ca410350ccbd5c321596fd6f55d68903cc1b6d2bccb';
export const P003_MAIN_FRAME_COUNT = 1008;
export const P003_GLOSSARY_BUTTONS = [
  {characterId: 150, term: 'Graph', depth: 48, firstFrame: 825, lastFrame: 1008},
  {characterId: 151, term: 'Relation', depth: 50, firstFrame: 825, lastFrame: 1008},
  {characterId: 156, term: 'Function', depth: 56, firstFrame: 860, lastFrame: 1008},
  {characterId: 157, term: 'Equation', depth: 58, firstFrame: 860, lastFrame: 1008},
  {characterId: 161, term: 'Linear equation', depth: 64, firstFrame: 908, lastFrame: 1008},
  {characterId: 162, term: 'Linear function', depth: 66, firstFrame: 908, lastFrame: 1008},
] as const;
export type P003GlossaryButton = (typeof P003_GLOSSARY_BUTTONS)[number];
export type P003Transport = 'playing' | 'paused' | 'stopped';
export interface P003GlossaryState {
  readonly frame: number;
  readonly transport: P003Transport;
  readonly pendingGlossary: null | {
    readonly term: P003GlossaryButton['term'];
    readonly sourceCharacterId: P003GlossaryButton['characterId'];
    readonly requestedAtFrame: number;
    readonly priorTransport: P003Transport;
  };
}
export const P003_CLOSE_POLICY = 'modern-restore-prior-transport; original-host-parity-unverified';
export function initialP003GlossaryState(): P003GlossaryState {
  return {frame: 1, transport: 'playing', pendingGlossary: null};
}
/** Inclusive display-list presence unions, not visual occlusion or hit-test evidence. */
export function retainedP003GlossaryButtons(frame: number): readonly P003GlossaryButton[] {
  return Number.isInteger(frame) && frame >= 1 && frame <= P003_MAIN_FRAME_COUNT
    ? P003_GLOSSARY_BUTTONS.filter(button => frame >= button.firstFrame && frame <= button.lastFrame) : [];
}
export function advanceP003Glossary(state: P003GlossaryState, frames = 1): P003GlossaryState {
  if (!Number.isSafeInteger(frames) || frames < 1) throw new RangeError('frames must be a positive safe integer');
  if (state.transport !== 'playing' || state.pendingGlossary) return state;
  const frame = Math.min(P003_MAIN_FRAME_COUNT, state.frame + frames);
  return {...state, frame, transport: frame === P003_MAIN_FRAME_COUNT ? 'stopped' : 'playing'};
}
/** Source release sets KeyAttribute, calls DoHyperLinks, then stops main animation. */
export function requestP003Glossary(state: P003GlossaryState, characterId: number): P003GlossaryState {
  if (state.pendingGlossary) return state;
  const button = retainedP003GlossaryButtons(state.frame).find(item => item.characterId === characterId);
  if (!button) return state;
  return {...state, transport: state.frame === P003_MAIN_FRAME_COUNT ? 'stopped' : 'paused',
    pendingGlossary: {term: button.term, sourceCharacterId: button.characterId,
      requestedAtFrame: state.frame, priorTransport: state.transport}};
}
/** Call only after the matching modern host dialog has actually closed. Denial is not closure. */
export function closeP003Glossary(state: P003GlossaryState): P003GlossaryState {
  if (!state.pendingGlossary) return state;
  return {...state, transport: state.frame === P003_MAIN_FRAME_COUNT ? 'stopped' : state.pendingGlossary.priorTransport, pendingGlossary: null};
}
/** Explicit user/host pause or play never releases a pending glossary request. */
export function setP003Paused(state: P003GlossaryState, paused: boolean): P003GlossaryState {
  if (state.pendingGlossary || state.frame === P003_MAIN_FRAME_COUNT) return state;
  return {...state, transport: paused ? 'paused' : 'playing'};
}
export function replayP003Glossary(): P003GlossaryState {
  return initialP003GlossaryState();
}
