import {p050Initial, p050Reduce, type P050State, type P050Event} from './nms-l02-p050-practice-v1';
import {p050PhaseWindow} from './nms-l02-p050-audio-window-v1';
export interface P050Clock {readonly state: P050State; readonly elapsed: number; readonly anchor: number | null;}
export function p050ClockInitial(): P050Clock {return {state: p050Initial(), elapsed: 0, anchor: null};}
export function p050ClockDuration(c: P050Clock): number {
  if (c.state.phase === 'completion-feedback') return (25 - 2) / 12;
  const w = p050PhaseWindow(c.state); return w ? (w.end - w.start) / 22050 : 0;
}
function time(now: number) {if (!Number.isFinite(now) || now < 0) throw Error('P050_CLOCK_TIME');}
export function p050ClockSync(c: P050Clock, now: number, token = c.state.token): P050Clock {
  time(now); if (c.anchor === null || token !== c.state.token) return c;
  if (now < c.anchor) throw Error('P050_CLOCK_REVERSED');
  const elapsed = c.elapsed + now - c.anchor, duration = p050ClockDuration(c);
  if (elapsed + 1e-9 < duration) return {...c, elapsed, anchor: now};
  const state = p050Reduce(c.state, {type: 'finish', token});
  // A delayed callback cannot consume time from audio that has not started yet.
  return {state, elapsed: state === c.state ? duration : 0, anchor: null};
}
export function p050ClockPlay(c: P050Clock, now: number): P050Clock {
  time(now); return c.anchor !== null || c.state.helpOpen || p050ClockDuration(c) <= c.elapsed ? c : {...c, anchor: now};
}
export function p050ClockPause(c: P050Clock, now: number): P050Clock {return {...p050ClockSync(c, now), anchor: null};}
export function p050ClockEvent(c: P050Clock, event: P050Event, now: number): P050Clock {
  const paused = p050ClockPause(c, now), state = p050Reduce(paused.state, event);
  return {state, elapsed: state.token === paused.state.token ? paused.elapsed : 0, anchor: null};
}
export function p050ClockMainFrame(c: P050Clock): number {
  if (c.state.phase === 'complete') return 260;
  if (c.state.phase === 'intro') return Math.min(209, 1 + Math.floor(c.elapsed * 12 + 1e-7));
  if (c.state.phase === 'outro') return Math.min(260, Math.max(210, 209 + Math.floor(c.elapsed * 12 + 1e-7)));
  return 209;
}
