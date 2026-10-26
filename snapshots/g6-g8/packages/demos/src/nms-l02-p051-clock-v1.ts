import {p051Initial, p051Reduce, type P051State, type P051Event} from './nms-l02-p051-practice-v1';
import {p051PhaseWindow} from './nms-l02-p051-audio-window-v1';
export interface P051Clock {readonly state: P051State; readonly elapsed: number; readonly anchor: number | null;}
export function p051ClockInitial(): P051Clock {return {state: p051Initial(), elapsed: 0, anchor: null};}
export function p051ClockDuration(c: P051Clock): number {
  if (c.state.phase === 'completion-feedback') return (25 - 2) / 12;
  const w = p051PhaseWindow(c.state); return w ? (w.end - w.start) / 22050 : 0;
}
function time(now: number) {if (!Number.isFinite(now) || now < 0) throw Error('P051_CLOCK_TIME');}
export function p051ClockSync(c: P051Clock, now: number, token = c.state.token): P051Clock {
  time(now); if (c.anchor === null || token !== c.state.token) return c;
  if (now < c.anchor) throw Error('P051_CLOCK_REVERSED');
  const elapsed = c.elapsed + now - c.anchor, duration = p051ClockDuration(c);
  if (elapsed + 1e-9 < duration) return {...c, elapsed, anchor: now};
  const state = p051Reduce(c.state, {type: 'finish', token});
  // A delayed callback cannot consume time from audio that has not started yet.
  return {state, elapsed: state === c.state ? duration : 0, anchor: null};
}
export function p051ClockPlay(c: P051Clock, now: number): P051Clock {
  time(now); return c.anchor !== null || p051ClockDuration(c) <= c.elapsed ? c : {...c, anchor: now};
}
export function p051ClockPause(c: P051Clock, now: number): P051Clock {return {...p051ClockSync(c, now), anchor: null};}
export function p051ClockEvent(c: P051Clock, event: P051Event, now: number): P051Clock {
  const paused = p051ClockPause(c, now), state = p051Reduce(paused.state, event);
  return {state, elapsed: state.token === paused.state.token ? paused.elapsed : 0, anchor: null};
}
export function p051ClockMainFrame(c: P051Clock): number {
  if (c.state.phase === 'complete') return 503;
  if (c.state.phase === 'intro') return Math.min(485, 1 + Math.floor(c.elapsed * 12 + 1e-7));
  if (c.state.phase === 'outro') return Math.min(503, Math.max(486, 485 + Math.floor(c.elapsed * 12 + 1e-7)));
  return 485;
}
