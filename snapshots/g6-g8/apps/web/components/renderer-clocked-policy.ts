import type {AnimationModule, RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {AnimationRuntimePlaybackState, AnimationRuntimeQuery} from './animation-runtime-types';

/** HFR does not implement host seeking, deterministic captures or host stop predicates. */
export function rendererClockedBlocker(
  module: AnimationModule,
  query: AnimationRuntimeQuery,
  loadedSwfHostAsset: unknown,
): string | null {
  if (module.clock !== 'renderer') return 'wrong-clock';
  if (query.capture === '1' || query.frame !== undefined || query.entryStateSha256 !== undefined ||
      query.requirementId !== undefined || query.trace !== undefined || query.duplicateCaptureIdentity) {
    return 'deterministic-capture-not-supported';
  }
  if (query.frameDomain !== undefined && query.frameDomain !== 'root' &&
      !module.runtime?.frameDomains?.some((domain) => domain.id === query.frameDomain)) return 'requested-domain-not-supported';
  if (module.interactiveStops?.length || module.interactiveSeek || module.authoredTimelineControls?.length) {
    return 'host-timeline-contract-not-supported';
  }
  const presentation = module.textPresentation;
  if (presentation && (presentation.schemaVersion !== 1 || presentation.binding?.animationId !== module.key ||
      !presentation.Renderer || typeof presentation.getSnapshot !== 'function' || presentation.frameControl ||
      presentation.activityTimelines?.length || presentation.completion || presentation.keyTerms || presentation.sourceTimelineAudioCues?.length)) {
    return 'typography-clock-contract-not-supported';
  }
  if (loadedSwfHostAsset) return 'loaded-swf-composition-not-supported';
  return null;
}

/** Until preferences are known, hold the clock. A motion hold is not completion. */
export function rendererClockPaused(paused: boolean, hidden: boolean | undefined, reduced: boolean | undefined): boolean {
  return paused || hidden !== false || reduced !== false;
}

/** A narration gesture may ask the controlled host to resume, but never clears
 * a visibility/motion/audio hold or queues a hidden gesture for later autoplay. */
export function rendererNarrationDisposition(action: 'play' | 'stop', controls: {
  paused: boolean; hidden: boolean | undefined; reduced: boolean | undefined;
  audioEnabled: boolean; blocker: string | null; canResumeHost: boolean;
}): 'forward' | 'resume-host' | 'discard' {
  if (action === 'stop') return 'forward';
  if (!controls.audioEnabled || controls.blocker || controls.hidden !== false || controls.reduced !== false) return 'discard';
  return controls.paused ? controls.canResumeHost ? 'resume-host' : 'discard' : 'forward';
}

export function playbackStateFromReport(report: RendererPlaybackReport, audioEnabled: boolean, module: AnimationModule): AnimationRuntimePlaybackState | null {
  if (!Number.isSafeInteger(report.frame) || !Number.isSafeInteger(report.frameCount) ||
      report.frame < 1 || report.frameCount < report.frame || !Number.isFinite(report.fps) || report.fps <= 0 ||
      typeof report.frameDomain !== 'string' || report.frameDomain.length === 0 || report.frameDomain.length > 128 ||
      typeof report.settled !== 'boolean' || typeof report.complete !== 'boolean' || typeof report.lessonFinished !== 'boolean' ||
      !['unavailable', 'idle', 'playing', 'blocked'].includes(report.narration)) return null;
  const runtime = module.runtime ?? module.movie;
  const domain = report.frameDomain === 'root' ? runtime : module.runtime?.frameDomains?.find((item) => item.id === report.frameDomain);
  if (!domain || report.frameCount !== domain.frameCount || report.fps !== (domain.fps ?? runtime.fps)) return null;
  const narration = audioEnabled ? report.narration : 'unavailable';
  return {
    audioAvailable: narration !== 'unavailable',
    frame: report.frame,
    frameCount: report.frameCount,
    frameDomain: report.frameDomain,
    fps: report.fps,
    narration,
    playbackProgress: report.frameCount > 1 ? (report.frame - 1) / (report.frameCount - 1) : 1,
    seekAvailable: false,
    stepFrames: 0,
    transportMode: 'none',
  };
}

export interface RendererCompletionLedger {
  readonly complete: boolean;
  readonly lessonFinished: boolean;
}
export const EMPTY_RENDERER_COMPLETION: RendererCompletionLedger = Object.freeze({complete: false, lessonFinished: false});

export function consumeRendererReport(
  report: RendererPlaybackReport,
  audioEnabled: boolean,
  paused: boolean,
  previous: RendererCompletionLedger,
  module: AnimationModule,
) {
  const playbackState = playbackStateFromReport(report, audioEnabled, module);
  if (!playbackState) return null;
  const complete = !paused && report.complete;
  const lessonFinished = !paused && report.lessonFinished;
  return {
    playbackState,
    emitComplete: complete && !previous.complete,
    emitLessonFinished: lessonFinished && !previous.lessonFinished,
    ledger: {complete: previous.complete || complete, lessonFinished: previous.lessonFinished || lessonFinished},
  };
}
