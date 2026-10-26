import {P051_AUDIO_PLANS} from './generated/nms-l02-p051-audio-plan-v1';
import type {P051AudioDomain} from './nms-l02-p051-audio-pcm-v1';
import type {P051State} from './nms-l02-p051-practice-v1';
export interface P051Window {readonly domain: P051AudioDomain; readonly start: number; readonly end: number;}
export function p051FrameSample(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 503) throw Error('P051_FRAME');
  const x = (frame - 1) * 22050 / 12, lo = Math.floor(x);
  return x - lo === .5 ? lo + lo % 2 : Math.round(x);
}
export function p051WindowOffset(window: P051Window, elapsed: number): number {
  if (!Number.isFinite(elapsed) || elapsed < 0) throw Error('P051_AUDIO_ELAPSED');
  if (!Object.hasOwn(P051_AUDIO_PLANS, window.domain) || !Number.isSafeInteger(window.start)
    || !Number.isSafeInteger(window.end) || window.start < 0 || window.end <= window.start
    || window.end > P051_AUDIO_PLANS[window.domain].totalSamples) throw Error('P051_WINDOW');
  return Math.min(window.end, window.start + Math.floor(elapsed * 22050 + 1e-7));
}
export function p051PhaseWindow(state: P051State): P051Window | null {
  switch (state.phase) {
    case 'intro': return {domain: '257', start: 0, end: p051FrameSample(485)};
    // Continue at the exact paused sample; the first resumed display is frame486.
    case 'outro': return {domain: '257', start: p051FrameSample(485), end: p051FrameSample(503)};
    case 'correct-feedback': return {domain: '250', start: p051FrameSample(2), end: P051_AUDIO_PLANS['250'].totalSamples};
    // Source gotoAndPlay(2); the skipped prepared frame1 head is measured silence.
    case 'wrong-feedback': return {domain: '248', start: p051FrameSample(2), end: P051_AUDIO_PLANS['248'].totalSamples};
    default: return null;
  }
}
