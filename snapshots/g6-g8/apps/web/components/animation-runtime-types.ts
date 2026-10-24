import type {AnimationRendererProps} from '../../../packages/demos/src/contract';

export type AnimationRuntimeQuery = {frame?: string; frameDomain?: string; scenario?: string; lang?: string; seed?: string; requirementId?: string; trace?: string; entryStateSha256?: string; capture?: string; duplicateCaptureIdentity?: boolean};
/**
 * Narration is the lesson for a language learner, so the host renders a
 * permanent control for it instead of surfacing a button only when a browser
 * refuses autoplay. These are every state that control has to read back:
 *
 * - `unavailable`: this page carries no narration at all.
 * - `waiting`: narration exists but is bound to the timeline, so there is
 *   nothing the learner can start on demand right now.
 * - `idle`: narration exists and a track can be started on demand.
 * - `playing`: narration is sounding, from a timeline cue, track, or explicit
 *   in-page interaction.
 * - `interactive`: exact audio exists behind in-page controls rather than the
 *   shell's general narration button.
 * - `blocked`: the browser refused autoplay and is waiting for a gesture.
 */
export type AnimationRuntimeNarrationStatus =
  'unavailable' | 'waiting' | 'idle' | 'interactive' | 'playing' | 'blocked';
export interface AnimationRuntimePlaybackState {
  readonly audioAvailable: boolean;
  readonly frame: number;
  readonly frameCount: number;
  readonly frameDomain: string;
  readonly fps: number;
  readonly narration: AnimationRuntimeNarrationStatus;
  /**
   * Current playhead within the authored playback span, from 0 to 1.
   * This is intentionally separate from lesson/page completion. `null` keeps
   * capture, loading and unsupported renderer states fail-closed.
   */
  readonly playbackProgress: number | null;
  readonly seekAvailable: boolean;
  readonly stepFrames: number;
  readonly transportMode: 'none' | 'visual-frame-inspector';
}
export interface AnimationRuntimeSeekRequest {
  readonly frame: number;
  readonly requestId: number;
}
/**
 * Host to runtime narration command. It mirrors `AnimationRuntimeSeekRequest`:
 * the host owns the control, the runtime owns the audio elements, and a
 * monotonic `requestId` keeps a repeated action from replaying on re-render.
 */
export interface AnimationRuntimeNarrationRequest {
  readonly action: 'play' | 'stop';
  readonly requestId: number;
}
export const INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE:
AnimationRuntimePlaybackState = Object.freeze({
  audioAvailable: false,
  frame: 1,
  frameCount: 1,
  frameDomain: 'root',
  fps: 0,
  narration: 'unavailable',
  playbackProgress: null,
  seekAvailable: false,
  stepFrames: 0,
  transportMode: 'none',
});
