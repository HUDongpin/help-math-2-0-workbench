/** Silent engineering transport, not an original Flash/audio clock. */
export interface P005VisualClock {frame: number; elapsedMs: number; playing: boolean;}
export const initialP005Clock = (): P005VisualClock => ({frame: 1, elapsedMs: 0, playing: false});
export function pauseP005Clock(state: P005VisualClock, paused: boolean): P005VisualClock {
  return {...state, playing: !paused && state.frame < 968};
}
export function seekP005Clock(frame: number): P005VisualClock {
  if (!Number.isInteger(frame) || frame < 1 || frame > 968) throw Error('P005 frame outside domain');
  return {frame, elapsedMs: (frame - 1) * 1000 / 12, playing: false};
}
export function advanceP005Clock(state: P005VisualClock, deltaMs: number): P005VisualClock {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw Error('P005 invalid elapsed time');
  if (!state.playing) return state;
  const elapsedMs = Math.min(967 * 1000 / 12, state.elapsedMs + deltaMs);
  const frame = Math.min(968, 1 + Math.floor(elapsedMs * 12 / 1000 + 1e-9));
  return {elapsedMs, frame, playing: frame < 968};
}
