export interface P042Clock {
  readonly elapsed: number;
  readonly anchor: number | null;
  readonly state: { readonly frame: number; readonly playing: boolean; readonly completed: boolean; readonly replay: number };
}
export const p042ClockInitial = (): P042Clock => Object.freeze({ elapsed: 0, anchor: null, state: Object.freeze({ frame: 1, playing: false, completed: false, replay: 0 }) });
function time(now: number) { if (!Number.isFinite(now) || now < 0) throw Error('P042_CLOCK_TIME'); }
export function p042ClockSync(clock: P042Clock, now: number): P042Clock {
  time(now);
  if (clock.anchor === null) return clock;
  if (now < clock.anchor) throw Error('P042_CLOCK_REVERSED');
  const elapsed = Math.min(52, clock.elapsed + now - clock.anchor);
  const completed = elapsed >= 52;
  return Object.freeze({ elapsed, anchor: completed ? null : now, state: Object.freeze({ ...clock.state, frame: Math.min(625, Math.floor(elapsed * 12 + 1e-9) + 1), playing: !completed, completed }) });
}
export function p042ClockPlay(clock: P042Clock, now: number): P042Clock {
  time(now);
  return clock.state.completed || clock.anchor !== null ? clock : Object.freeze({ ...clock, anchor: now, state: Object.freeze({ ...clock.state, playing: true }) });
}
export function p042ClockPause(clock: P042Clock, now: number): P042Clock {
  const current = p042ClockSync(clock, now);
  return Object.freeze({ ...current, anchor: null, state: Object.freeze({ ...current.state, playing: false }) });
}
export function p042ClockReplay(clock: P042Clock): P042Clock {
  const initial = p042ClockInitial();
  return Object.freeze({ ...initial, state: Object.freeze({ ...initial.state, replay: clock.state.replay + 1 }) });
}
