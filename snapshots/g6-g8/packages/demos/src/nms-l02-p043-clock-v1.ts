import { P043_AUDIO_PLANS } from './generated/nms-l02-p043-audio-plan-v1';
import { p043InitialMatching, p043EnterMatching, p043Match, p043CloseWrongFeedback, p043FinishCorrectFeedback, p043FinishCompletion, p043ReplayMatching, type P043MatchingState, type P043Term, type P043Row } from './nms-l02-p043-matching-v1';
import type { P043AudioDomain } from './nms-l02-p043-audio-pcm-v1';
const completionDomains = ['143', '171', '183', '204', '232'] as const;
export type P043CompletionDomain = typeof completionDomains[number];
export function p043CompletionDomain(seed: number): P043CompletionDomain {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('P043_SEED');
  return completionDomains[seed % completionDomains.length];
}
export interface P043Clock {
  readonly state: P043MatchingState;
  readonly seed: number;
  readonly elapsed: number;
  readonly anchor: number | null;
}
function time(value: number) { if (!Number.isFinite(value) || value < 0) throw Error('P043_CLOCK_TIME'); }
export function p043ClockInitial(seed = 0): P043Clock {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('P043_SEED');
  return Object.freeze({ state: p043InitialMatching(), seed, elapsed: 0, anchor: null });
}
/** Seeded modern host adapter; original showRightFeed selection is unverified. */
export function p043ClockDomain(clock: P043Clock): P043AudioDomain | null {
  switch (clock.state.phase) {
    case 'intro': return '250';
    case 'wrong-feedback': return '245';
    case 'correct-feedback': return '249';
    case 'completion-feedback': return p043CompletionDomain(clock.seed);
    default: return null;
  }
}
export function p043ClockDuration(clock: P043Clock): number {
  const domain = p043ClockDomain(clock);
  if (!domain) return 0;
  const plan = P043_AUDIO_PLANS[domain];
  // Retain the main223->225 completion continuation after final feedback.
  return plan.totalSamples / plan.sampleRate + (clock.state.phase === 'completion-feedback' ? 2 / 12 : 0);
}
export function p043ClockSync(clock: P043Clock, now: number): P043Clock {
  time(now); if (clock.anchor === null) return clock;
  if (now < clock.anchor) throw Error('P043_CLOCK_REVERSED');
  const duration = p043ClockDuration(clock), elapsed = Math.min(duration, clock.elapsed + now - clock.anchor);
  if (elapsed < duration) return Object.freeze({ ...clock, elapsed, anchor: now });
  let state = clock.state;
  if (state.phase === 'intro') state = p043EnterMatching(state);
  else if (state.phase === 'correct-feedback') state = p043FinishCorrectFeedback(state);
  else if (state.phase === 'completion-feedback') state = p043FinishCompletion(state);
  // A new media stage starts paused until the transport has its buffer ready.
  return Object.freeze({ ...clock, state, elapsed: state === clock.state ? elapsed : 0, anchor: null });
}
export function p043ClockPlay(clock: P043Clock, now: number): P043Clock {
  time(now);
  return clock.anchor !== null || !p043ClockDomain(clock) || clock.elapsed >= p043ClockDuration(clock) ? clock : Object.freeze({ ...clock, anchor: now });
}
export function p043ClockPause(clock: P043Clock, now: number): P043Clock {
  return Object.freeze({ ...p043ClockSync(clock, now), anchor: null });
}
export function p043ClockMatch(clock: P043Clock, term: P043Term, row: P043Row): P043Clock {
  const state = p043Match(clock.state, term, row);
  return state === clock.state ? clock : Object.freeze({ ...clock, state, elapsed: 0, anchor: null });
}
export function p043ClockCloseWrong(clock: P043Clock): P043Clock {
  const state = p043CloseWrongFeedback(clock.state);
  return state === clock.state ? clock : Object.freeze({ ...clock, state, elapsed: 0, anchor: null });
}
export function p043ClockReplay(clock: P043Clock): P043Clock {
  return Object.freeze({ ...clock, state: p043ReplayMatching(clock.state), elapsed: 0, anchor: null });
}
export function p043ClockMainFrame(clock: P043Clock): number {
  if (clock.state.phase === 'intro') return Math.min(223, Math.floor(clock.elapsed * 12 + 1e-9) + 1);
  return clock.state.phase === 'complete' ? 225 : 223;
}
