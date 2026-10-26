import {P050_AUDIO_PLANS} from './generated/nms-l02-p050-audio-plan-v1';
import type {P050AudioDomain} from './nms-l02-p050-audio-pcm-v1';
import type {P050State} from './nms-l02-p050-practice-v1';
export interface P050Window {readonly domain: P050AudioDomain; readonly start: number; readonly end: number;}
export function p050FrameSample(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 260) throw Error('P050_FRAME');
  const x = (frame - 1) * 22050 / 12, lo = Math.floor(x);
  return x - lo === .5 ? lo + lo % 2 : Math.round(x);
}
export function p050WindowOffset(window: P050Window, elapsed: number): number {
  if (!Number.isFinite(elapsed) || elapsed < 0) throw Error('P050_AUDIO_ELAPSED');
  if (!Object.hasOwn(P050_AUDIO_PLANS, window.domain) || !Number.isSafeInteger(window.start)
    || !Number.isSafeInteger(window.end) || window.start < 0 || window.end <= window.start
    || window.end > P050_AUDIO_PLANS[window.domain].totalSamples) throw Error('P050_WINDOW');
  return Math.min(window.end, window.start + Math.floor(elapsed * 22050 + 1e-7));
}
export function p050PhaseWindow(state: P050State): P050Window | null {
  switch (state.phase) {
    case 'intro': return {domain: '94', start: 0, end: p050FrameSample(209)};
    // Continue at the exact paused sample; the first resumed display is frame210.
    case 'outro': return {domain: '94', start: p050FrameSample(209), end: p050FrameSample(260)};
    case 'correct-feedback': return {domain: '91', start: p050FrameSample(2), end: P050_AUDIO_PLANS['91'].totalSamples};
    // Source gotoAndPlay(2); the skipped prepared frame1 head is measured silence.
    case 'wrong-feedback': return {domain: '88', start: p050FrameSample(2), end: P050_AUDIO_PLANS['88'].totalSamples};
    default: return null;
  }
}
