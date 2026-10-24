/** Silent engineering transport, not an original Flash/audio clock. */
export interface P006VisualClock {frame: number; elapsedMs: number; playing: boolean;}
export const initialP006Clock = (): P006VisualClock => ({frame: 1, elapsedMs: 0, playing: false});
export function pauseP006Clock(state: P006VisualClock, paused: boolean): P006VisualClock {
  return {...state, playing: !paused && state.frame < 342};
}
export function seekP006Clock(frame: number): P006VisualClock {
  if (!Number.isInteger(frame) || frame < 1 || frame > 342) throw Error('P006 frame outside domain');
  return {frame, elapsedMs: (frame - 1) * 1000 / 12, playing: false};
}
export function advanceP006Clock(state: P006VisualClock, deltaMs: number): P006VisualClock {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw Error('P006 invalid elapsed time');
  if (!state.playing) return state;
  const elapsedMs = Math.min(341 * 1000 / 12, state.elapsedMs + deltaMs);
  const frame = Math.min(342, 1 + Math.floor(elapsedMs * 12 / 1000 + 1e-9));
  return {elapsedMs, frame, playing: frame < 342};
}
