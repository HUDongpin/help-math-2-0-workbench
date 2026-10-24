import type {ComponentType} from 'react';
import type {
  LessonHostCapabilityDescriptor,
  LessonHostDecision,
  LessonHostNavigationHandoff,
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
 * Source-bound page audio candidate used by the shared middle-school
 * adapter.  This is deliberately broader than `AudioCue`: a candidate may
 * still need host-trigger, language, timing, and human listening decisions.
 * `candidate-index-only` is the only status produced by source intake; the
 * accepted states are reserved for an independently reviewed downstream
 * evidence package.
 */
export type PageAudioCandidateBinding = 'FQ/EA' | 'FQ/SA' | 'lesson-SA';

export type PageAudioCandidateAcceptance =
  | 'candidate-index-only'
  | 'accepted'
  | 'accepted-not-required';

export interface PageAudioCandidate {
  readonly id: string;
  readonly source: string;
  readonly sha256: string;
  readonly language: AnimationLanguage | 'shared' | 'undetermined';
  readonly durationMs?: number | null;
  readonly frameDomain?: string | null;
  readonly startSemantics: string;
  readonly hostTrigger: string;
  readonly stopOrCompleteSemantics: string;
  readonly replayBehavior: string;
  readonly binding: PageAudioCandidateBinding;
  /** null means source intake has not yet established whether the cue is required. */
  readonly required: boolean | null;
  readonly acceptance: PageAudioCandidateAcceptance;
}

const PAGE_AUDIO_SHA256 = /^[a-f0-9]{64}$/u;

/** Structural-only guard for data arriving from a source/catalog adapter. */
export function isPageAudioCandidate(value: unknown): value is PageAudioCandidate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<PageAudioCandidate>;
  const text = (entry: unknown) => typeof entry === 'string' && entry.trim().length > 0;
  const language = candidate.language === 'en' || candidate.language === 'es' ||
    candidate.language === 'shared' || candidate.language === 'undetermined';
  const binding = candidate.binding === 'FQ/EA' || candidate.binding === 'FQ/SA' ||
    candidate.binding === 'lesson-SA';
  const acceptance = candidate.acceptance === 'candidate-index-only' ||
    candidate.acceptance === 'accepted' || candidate.acceptance === 'accepted-not-required';
  return text(candidate.id) && text(candidate.source) &&
    typeof candidate.sha256 === 'string' && PAGE_AUDIO_SHA256.test(candidate.sha256) &&
    language && text(candidate.startSemantics) && text(candidate.hostTrigger) &&
    text(candidate.stopOrCompleteSemantics) && text(candidate.replayBehavior) &&
    binding && (candidate.required === null || typeof candidate.required === 'boolean') && acceptance &&
    (candidate.durationMs === undefined || candidate.durationMs === null ||
      (typeof candidate.durationMs === 'number' && Number.isFinite(candidate.durationMs) && candidate.durationMs >= 0)) &&
    (candidate.frameDomain === undefined || candidate.frameDomain === null || text(candidate.frameDomain));
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

/**
 * A source-authored child-timeline stop whose continuation depends on an
 * interaction result that the outer product runtime must resolve explicitly.
 * Merely reaching `stopFrame` is never page completion. A host that does not
 * consume this contract must fail closed and keep the module unregistered.
 */
export interface AnimationInteractiveStop {
  readonly id: string;
  readonly frameDomain: string;
  readonly stopFrame: number;
  readonly resumeFrame: number;
  readonly resolution:
    | 'explicit-source-feedback-finished'
    | 'explicit-source-drag-set-finished'
    | 'explicit-source-control-finished';
  readonly completionDisposition: 'blocked-while-unresolved';
  /** Preserve a completed source interaction's score/review state when its
   * declared stop resumes. Omission retains the established renderer reset. */
  readonly rendererStateOnResume?: 'preserve';
  readonly requiresHostInteractiveStop: true;
  readonly strictAcceptanceEffect: 'none';
}

export interface AnimationInteractiveSeekCapability {
  readonly id: string;
  readonly frameDomain: string;
  readonly minimumFrame: number;
  readonly maximumFrame: number;
  readonly terminalFrame: number;
  readonly resumeDisposition: 'resume-only-when-nonterminal';
  readonly requiresHostSeekConsumer: true;
  readonly strictAcceptanceEffect: 'none';
}

export interface AnimationSeekIntent {
  readonly capabilityId: string;
  readonly frameDomain: string;
  readonly targetFrame: number;
  readonly input: 'native-range-change';
  readonly source: 'maintained-source-derived-range';
}

/** Exact authored buttons such as Repeat Directions and Skip Directions.
 * Targets belong to the module declaration, never to the incoming intent. */
export interface AnimationAuthoredTimelineControl {
  readonly id: string;
  readonly frameDomain: string;
  readonly sourceFrameRanges: readonly Readonly<{first: number; last: number}>[];
  readonly targetFrame: number;
  readonly playback: 'play' | 'stop';
  readonly sourceLabel: string;
}

export interface AnimationAuthoredTimelineControlIntent {
  readonly controlId: string;
  readonly frameDomain: string;
  readonly input: 'mouse' | 'keyboard';
  readonly source: 'maintained-source-authored-control';
}

export interface AnimationAuthoredTimelineControlDecision {
  readonly accepted: boolean;
  readonly reason: string;
}

/**
 * A maintained renderer may publish this intent only after its source-bound
 * interaction reducer reaches the exact resolution named by the matching
 * {@link AnimationInteractiveStop}. The outer runtime remains authoritative:
 * it validates the active stop and owns both the resolved-stop ledger and the
 * playhead resume.
 */
export interface AnimationInteractiveStopResolutionIntent {
  readonly stopId: string;
  readonly frameDomain: string;
  readonly resolution: AnimationInteractiveStop['resolution'];
  readonly source: 'maintained-source-derived-interaction';
}

/** Identity of one mounted lesson host; shared by its pages, isolated from other hosts. */
export interface RendererLessonSessionScope {readonly id: string}

/** Renderer-owned clock state; a report never grants admission or fidelity. */
export interface RendererPlaybackReport {
  readonly frame: number;
  readonly frameCount: number;
  readonly frameDomain: string;
  readonly fps: number;
  readonly settled: boolean;
  readonly complete: boolean;
  readonly lessonFinished: boolean;
  readonly narration: 'unavailable' | 'idle' | 'playing' | 'blocked';
}

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
  /** Live product-runtime state for an exact typed interactive audio asset. */
  readonly activeInteractiveAudioId?: string | null;
  readonly onReplay?: () => void;
  /**
   * Typed playhead intent for maintained source-derived seek controls. Absence
   * means the outer host has not implemented seeking; the renderer may show a
   * local engineering preview but must not claim playhead seek/resume.
   */
  readonly onSeekIntent?: (intent: AnimationSeekIntent) => void;
  readonly onAuthoredTimelineControl?: (
    intent: AnimationAuthoredTimelineControlIntent,
  ) => AnimationAuthoredTimelineControlDecision;
  /**
   * Typed source-interaction resolution intent. Absence means the outer host
   * cannot release an authored interactive stop, so the renderer must remain
   * held and page completion must stay blocked.
   */
  readonly onInteractiveStopResolved?: (
    intent: AnimationInteractiveStopResolutionIntent,
  ) => void;
  /**
   * Typed modern host intent. The optional trigger stays outside the serializable
   * request so the product shell can restore focus after closing a support tool.
   * No legacy global, URL, storage, or ActionScript operation is executed here.
   */
  readonly onLessonHostRequest?: (
    request: LessonHostRequest,
    context?: Readonly<{trigger?: HTMLElement}>,
  ) => LessonHostDecision | void;
  /**
   * Exact memory-only state carried by a reviewed typed navigation request.
   * It is neither persisted nor exposed to a renderer whose animationId is
   * not the handoff target.
   */
  readonly lessonHostNavigationHandoff?: LessonHostNavigationHandoff | null;
  /** Modern host pause state; this is not evidence of a legacy pause control. */
  readonly paused?: boolean;
  /** Raw modern host pause before hidden/reduced-motion clock holds; absent keeps the effective pause. */
  readonly hostPaused?: boolean;
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
  /** Renderer clocks only: playback volume, independent from visual language. */
  readonly volume?: number;
  readonly audioLanguage?: AnimationLanguage;
  readonly rendererLessonSession?: RendererLessonSessionScope;
  readonly narrationRequest?: Readonly<{action: 'play' | 'stop'; requestId: number}> | null;
  /** Source-owned progress; the host never advances this clock with frame props. */
  readonly onRendererPlayback?: (report: RendererPlaybackReport) => void;
}

export interface AnimationModule<State = unknown> {
  readonly key: string;
  /** Host-clocked unless explicitly declared; renderer clocks report progress. */
  readonly clock?: 'host' | 'renderer';
  readonly textPresentation?: import('./lesson-text-contract').LessonTextPresentationCapability<State>;
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
  /** Exact, user-triggered audio assets addressable by typed lesson-host ID. */
  readonly interactiveAudioAssets?: readonly InteractiveAudioAsset[];
  /** Explicit source-bound page-audio candidates for shared adapters. */
  readonly pageAudioCandidates?: readonly PageAudioCandidate[];
  /** Explicit, fail-closed modern transport capability. Absence disables seeking. */
  readonly transport?: AnimationTransportCapability;
  /**
   * Fail-closed authored stops. The generic host must clamp playback and block
   * page completion until the matching stop ID has been explicitly resolved.
   */
  readonly interactiveStops?: readonly AnimationInteractiveStop[];
  /** Fail-closed source-derived seek contract requiring an outer host consumer. */
  readonly interactiveSeek?: AnimationInteractiveSeekCapability;
  readonly authoredTimelineControls?: readonly AnimationAuthoredTimelineControl[];
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
