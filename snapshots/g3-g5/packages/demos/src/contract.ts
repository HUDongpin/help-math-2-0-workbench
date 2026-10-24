import type {ComponentType} from 'react';
import type {
  LessonHostCapabilityDescriptor,
  LessonHostDecision,
  LessonHostRequest,
} from './lesson-host-contract';

export type AnimationLanguage = 'en' | 'es';
export type AnimationPlaybackMode = 'once' | 'loop';

export interface MovieMetadata {
  readonly stage: Readonly<{width: number; height: number}>;
  readonly fps: number;
  readonly frameCount: number;
  readonly durationMs: number;
}

/**
 * A deterministic, one-indexed timeline that the modern renderer can address.
 * `rootFrame` records the source root-timeline frame that hosts a nested
 * MovieClip. It is omitted for the root domain because the root frame moves
 * with `frame`.
 */
export interface FrameDomainMetadata {
  readonly id: string;
  readonly frameCount: number;
  readonly fps?: number;
  readonly rootFrame?: number;
}

/**
 * Source-runtime metadata. `frameCount` is always the root SWF timeline count;
 * a longer nested MovieClip belongs in `frameDomains`, never in frameCount.
 */
export interface AnimationRuntimeMetadata extends MovieMetadata {
  readonly frameDomains?: readonly FrameDomainMetadata[];
  readonly defaultFrameDomain?: string;
}

export interface RuntimeContext {
  readonly frame: number;
  /** Absent only for legacy direct module calls; the product host always resolves it. */
  readonly frameDomain?: string;
  /** Source root-timeline frame corresponding to the active timeline frame. */
  readonly rootFrame?: number;
  readonly scenario: string;
  readonly lang: AnimationLanguage;
  readonly seed: number;
  /** Stable reachable-trace identity used by deterministic capture evidence. */
  readonly traceId?: string;
  /** Stable coverage-requirement identity that owns this trace capture. */
  readonly requirementId?: string;
  /** SHA-256 of the canonical entry-state JSON for that trace. */
  readonly entryStateSha256?: string;
  /** Monotonic host reset sequence. Zero is the initial run. */
  readonly replay?: number;
}

export interface ResolvedRuntimeContext extends RuntimeContext {
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly traceId: string;
  readonly requirementId: string;
  readonly entryStateSha256: string;
  readonly replay: number;
}

export interface RuntimeScenario {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface AudioCue {
  readonly id: string;
  /** Source audit cue identity when one recovered stream has multiple runtime projections. */
  readonly sourceCueId?: string;
  readonly frame: number;
  /** Source removal/stop boundary; playback is active only before this one-indexed frame. */
  readonly endFrame?: number;
  readonly frameDomain?: string;
  readonly language: AnimationLanguage | 'shared';
  readonly scenario?: string;
  readonly seedModulo?: Readonly<{divisor: number; remainder: number}>;
  readonly source: string;
  readonly durationMs?: number;
  readonly sha256?: string;
  readonly spokenLanguage?: 'undetermined';
}

export interface LessonPlaybackIdentity {
  readonly playbackIdentity: string;
  readonly replay: number;
  readonly seekRevision: number;
}

/** A start owns one sequence for its whole lifecycle. Start and public Play
 * share one runtime counter, so same-turn commands have an explicit order. */
export interface HostAudioTrackEvent {
  readonly kind: 'accepted-start' | 'ended' | 'stop' | 'error' | 'cancelled';
  readonly sequence: number;
  readonly identity: LessonPlaybackIdentity;
  readonly trackId: string;
  readonly trackSha256: string;
  readonly frameDomain: string;
  readonly sourceFrame: number;
  readonly cancellationReason?: 'replaced' | 'identity-change' | 'public-play' | 'replay' | 'seek' | 'host-stop';
}

export interface LessonPlayCommand {
  readonly kind: 'play';
  readonly sequence: number;
  readonly identity: LessonPlaybackIdentity;
  readonly frameDomain: string;
  readonly sourceFrame: number;
}

export interface AudioTrack {
  readonly id: string;
  /**
   * `shared` exposes one exact source asset in both locale views without
   * claiming that its spoken language has been established.
   */
  readonly language: AnimationLanguage | 'shared';
  readonly spokenLanguage?: 'undetermined';
  readonly label: string;
  readonly source: string;
  readonly durationMs: number;
  readonly sha256: string;
  readonly activation: 'user';
  readonly visibleWhen: readonly AnimationLanguage[];
  /** Optional source frame domains in which the legacy host exposed this track. */
  readonly frameDomains?: readonly string[];
  /** Legacy host effect on the active source timeline while this track plays. */
  readonly timelineBehavior?: 'none' | 'pause-while-playing';
  /** Exact placed children reset by this source-selected track. Their current
   * clock tokens and media owners are retired before accepted-start. */
  readonly interruptSourceInstances?: readonly string[];
}

/**
 * A source-bound audio file that a renderer may request only through the
 * typed lesson-host contract. Unlike a timeline cue or the shell narration
 * track, this asset belongs to an explicit in-page interaction such as a
 * question or answer speaker button.
 */
export interface InteractiveAudioAsset {
  readonly id: string;
  /**
   * One exact source file may be available to both locale views while its
   * spoken language remains unestablished. This exposes byte identity only;
   * it does not grant language or listening acceptance.
   */
  readonly language: AnimationLanguage | 'shared';
  readonly spokenLanguage?: 'undetermined';
  readonly source: string;
  readonly sha256: string;
}

/**
 * A modern, acceptance-neutral transport may be exposed only when a renderer
 * declares how seeking reconstructs state. This is intentionally separate
 * from source-host behavior: direct frame inspection does not establish
 * legacy Rewind/Forward, scrub-resume, audio, or cross-page parity.
 */
export interface AnimationTransportCapability {
  readonly mode: 'visual-frame-inspector';
  readonly frameDomains: readonly string[];
  readonly stepFrames: number;
  readonly stateReconstruction: 'renderer-remount-on-seek';
  readonly audioDisposition: 'disabled-while-inspecting';
  readonly legacyBehaviorParity: false;
  readonly strictAcceptanceEffect: 'none';
}

/** Exact source035 Start intent; the modern lesson host owns the one-page handoff. */
export type Gs002GameStart = Readonly<{
  sourceAnimationId: 'course-g04-l08-gs-002';
  sourcePlacementId: 'g04-l08-placement-035';
  targetAnimationId: 'course-g04-l08-gs-003';
  targetPlacementId: 'g04-l08-placement-036';
  level: 1 | 2;
  startGame: true;
  sourceFrame: number;
  rootEntryFrame: 6;
}>;

export interface AnimationRendererProps {
  /** Product publication gate; false/absent means no audio may be advertised or requested. */
  readonly audioEnabled?: boolean;
  /** The runtime-owned, one-indexed Flash frame. */
  readonly frame: number;
  /** Optional only for backward-compatible direct renderer tests. */
  readonly frameDomain?: string;
  readonly rootFrame?: number;
  readonly replay?: number;
  readonly traceId?: string;
  readonly requirementId?: string;
  readonly entryStateSha256?: string;
  readonly scenario: string;
  readonly lang: AnimationLanguage;
  /**
   * Optional language for app-owned responsive controls and accessibility
   * copy. This never changes the source-runtime language, capture identity,
   * or visual evidence represented by `lang`. A module may use it only for
   * explicitly declared, exact product-audio routing that stays independent
   * from the fixed visual runtime language.
   */
  readonly uiLanguage?: AnimationLanguage;
  readonly seed: number;
  readonly state?: unknown;
  /** Identity shared by typed source clock and host narration signals. */
  readonly lessonPlaybackIdentity?: LessonPlaybackIdentity;
  /** Retained separately: an immediate error must not erase the source reset. */
  readonly hostAudioTrackStart?: HostAudioTrackEvent;
  readonly hostAudioTrackEvent?: HostAudioTrackEvent;
  /** Only a user pressing ordinary Play; never a generic unpause edge. */
  readonly lessonPlayCommand?: LessonPlayCommand;
  /** Live product-runtime state for an exact typed interactive audio asset. */
  readonly activeInteractiveAudioId?: string | null;
  readonly pausedInteractiveAudioId?: string | null;
  readonly onReplay?: () => void;
  /** Current source035 Start only; strict true acknowledges actual lesson navigation. */
  readonly onGs002GameStart?: (request: Gs002GameStart) => boolean;
  /** Source level for the current036 page visit; no value means source defaultLevel1. */
  readonly gs003EntryLevel?: 1 | 2;
  /** Source-bound modern-page continuation through the existing host clock.
   * Only declared exact stop/continue edges are accepted; capture is excluded. */
  readonly onLessonFrameRequest?: (
    request: import('./lesson-text-contract').LessonTextFrameTransition,
  ) => boolean;
  /** Temporary source child timeline, advanced by the same host clock while
   * the parent holds. Completion is a source-frame event, not an audio guess. */
  readonly onLessonActivityRequest?: (
    request: import('./lesson-text-contract').LessonTextActivityRequest,
  ) => boolean;
  /** One authored event may start several placed children atomically. */
  readonly onLessonActivitiesRequest?: (
    requests: readonly import('./lesson-text-contract').LessonTextActivityRequest[],
  ) => boolean;
  readonly onLessonButtonActivityRequest?: (
    request: import('./lesson-text-contract').LessonTextButtonActivityRequest,
  ) => boolean;
  readonly lessonActivity?: import('./lesson-text-contract').LessonTextActivitySnapshot;
  readonly onLessonActivityCancel?: (
    request: import('./lesson-text-contract').LessonTextActivityCancellation,
  ) => boolean;
  readonly lessonActivities?: readonly import('./lesson-text-contract').LessonTextActivitySnapshot[];
  readonly onLessonCompletionRequest?: (request: import('./lesson-text-contract').LessonTextCompletionRequest) => boolean;
  /**
   * Typed modern host intent. The optional trigger stays outside the serializable
   * request so the product shell can restore focus after closing a support tool.
   * No legacy global, URL, storage, or ActionScript operation is executed here.
   */
  readonly onLessonHostRequest?: (
    request: LessonHostRequest,
    context?: Readonly<{trigger?: HTMLElement; keyTermIndexLanguage?: 'en' | 'es'}>,
  ) => LessonHostDecision | void;
  /** Modern host pause state; this is not evidence of a legacy pause control. */
  readonly paused?: boolean;
  /** Device motion preference for functional overlays owned by the renderer. */
  readonly reducedMotion?: boolean;
  /**
   * Optional DOM target outside the fixed Flash stage for a responsive,
   * functionally equivalent page-interaction surface. Renderers retain their
   * standalone in-stage fallback when this host is absent.
   */
  readonly pageInteractionCompanionTargetId?: string;
  /**
   * Optional host-owned overlay target inside the authored stage plane. This
   * is for responsive current-JS controls that must remain inside the visible
   * animation rectangle; it is separate from the below-stage companion host.
   */
  readonly pageInteractionStageTargetId?: string;
}

export interface AnimationModule<State = unknown> {
  /** Optional, source-bound modern presentation; never a publication verdict. */
  readonly textPresentation?: import('./lesson-text-contract').LessonTextPresentationCapability<State>;
  /** Source-held interaction completion, independent of typography admission. */
  readonly interactionCompletion?: import('./lesson-text-contract').LessonTextCompletionCapability;
  readonly key: string;
  /**
   * Legacy playback metadata. New multi-domain modules should also declare
   * `runtime`, whose frameCount remains the source root SWF frame count.
   */
  readonly movie: MovieMetadata;
  readonly runtime?: AnimationRuntimeMetadata;
  /** Normal playback behavior after the active frame domain reaches its frameCount. */
  readonly playbackMode?: AnimationPlaybackMode;
  /** Source-authored natural stop within the active/default frame domain. */
  readonly playbackEndFrame?: number;
  /**
   * Optional source-authored stop overrides for multi-domain movies. This
   * prevents a structural root domain from being autoplayed merely because a
   * nested content domain has a longer natural run.
   */
  readonly playbackEndFrameByDomain?: Readonly<Record<string, number>>;
  /** Static frame shown when reduced motion disables live timeline playback. */
  readonly reducedMotionFrame?: number;
  readonly scenarios: readonly RuntimeScenario[];
  /**
   * Domain-specific fallback used when the URL omits or supplies an unknown
   * scenario. Multi-domain movies must not borrow the first scenario from a
   * different source timeline.
   */
  readonly defaultScenarioByFrameDomain?: Readonly<Record<string, string>>;
  readonly audioCues: readonly AudioCue[];
  /** Host-level audio buttons that were user-triggered rather than timeline cues. */
  readonly audioTracks?: readonly AudioTrack[];
  /** Optional source-backed public Play effect, separate from narration end. */
  readonly sourcePlayControl?: Readonly<{
    frameDomain: string;
    interruptSourceInstances: readonly string[];
  }>;
  /** Exact, user-triggered audio assets addressable by typed lesson-host ID. */
  readonly interactiveAudioAssets?: readonly InteractiveAudioAsset[];
  /** Source-backed language choices for interactive controls only. If omitted,
   * interactive assets remain restricted to the current interface audio language.
   * Does not grant audio capability or bypass exact-asset/publication checks. */
  readonly interactiveAudioLanguages?: readonly AnimationLanguage[];
  /** Explicit, fail-closed modern transport capability. Absence disables seeking. */
  readonly transport?: AnimationTransportCapability;
  /**
   * Explicit modern host capabilities. Absence means no lesson-host action is
   * enabled; it never implies permission to execute legacy ActionScript host
   * calls or external endpoints.
   */
  readonly lessonHost?: LessonHostCapabilityDescriptor;
  /**
   * `private-current-js` is an engineering registration admitted only to a
   * private/local product surface. It is implementation availability, never
   * fidelity, strict-completion, release, or publication authority.
   */
  readonly maturity:
    | 'legacy-prototype'
    | 'private-current-js'
    | 'strict-complete';
  readonly Renderer: ComponentType<AnimationRendererProps>;
  readonly getFrameState: (frame: number, context: RuntimeContext) => State;
}
