/** Silent engineering transport for the source sprite-62, not an audio clock. */
export interface P009VisualClock {frame: number; elapsedMs: number; playing: boolean;}
export const initialP009Clock = (): P009VisualClock => ({frame: 1, elapsedMs: 0, playing: false});
export function pauseP009Clock(state: P009VisualClock, paused: boolean): P009VisualClock {
  return {...state, playing: !paused && state.frame < 394};
}
export function seekP009Clock(frame: number): P009VisualClock {
  if (!Number.isInteger(frame) || frame < 1 || frame > 394) throw Error('P009 frame outside domain');
  return {frame, elapsedMs: (frame - 1) * 1000 / 12, playing: false};
}
export function advanceP009Clock(state: P009VisualClock, deltaMs: number): P009VisualClock {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw Error('P009 invalid elapsed time');
  if (!state.playing) return state;
  const elapsedMs = Math.min(393 * 1000 / 12, state.elapsedMs + deltaMs);
  const frame = Math.min(394, 1 + Math.floor(elapsedMs * 12 / 1000 + 1e-9));
  return {elapsedMs, frame, playing: frame < 394};
}
