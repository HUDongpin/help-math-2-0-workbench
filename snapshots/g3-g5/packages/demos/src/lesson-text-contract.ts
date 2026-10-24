import type {ComponentType} from 'react';
import type {AnimationLanguage, AnimationRendererProps, RuntimeContext} from './contract';

/** Structural source evidence is private build input, never a visibility verdict. */
export interface TextSourceCatalog {
  readonly schemaVersion: 1;
  readonly kind: 'lesson-text-source-catalog-v1';
  readonly manifest: Readonly<{path: string; sha256: string}>;
  readonly claimBoundary: Readonly<{
    structuralOnly: true;
    runtimeVisibilityEstablished: false;
    modernizationComplete: false;
  }>;
  readonly placements: readonly Readonly<{
    placementId: string;
    animationId: string;
    assetId: string;
    sourcePath: string;
    sourceSha256: string;
    assetPath: string | null;
    status: string;
  }>[];
}

export type LessonTextRole =
  | 'title' | 'heading' | 'body' | 'question' | 'feedback' | 'answer' | 'label';
export type LessonTextTemplate = 'explanation' | 'exercise' | 'complex-figure';

/** Distinguishes reuse of a character, unnamed instances, and depth replacement. */
export interface LessonTextInstanceSegment {
  readonly timelineId: string;
  readonly depth: number;
  readonly generation: number;
  readonly characterId: number;
}

export interface LessonTextInstance {
  readonly id: string;
  readonly path: readonly LessonTextInstanceSegment[];
}

export interface LessonTextAnchor {
  readonly x: number;
  readonly y: number;
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly align?: 'start' | 'center' | 'end';
}

export interface LessonTextBlockBinding {
  readonly id: string;
  readonly sourceTextIds: readonly string[];
  /** Authored shape symbols require a maintained semantic decision and exact
   * character validation against this SWF's shape catalog at build time. */
  readonly sourceShapeIds?: readonly number[];
  /** Embedded instructional text must bind its exact source bitmap; decoded
   * pixel-region and transcription evidence live in the audited page binding. */
  readonly sourceBitmapIds?: readonly number[];
  readonly role: LessonTextRole;
  readonly language: AnimationLanguage;
  readonly readingOrder: number;
  readonly instance?: LessonTextInstance;
  readonly valueSource: 'source-static' | 'maintained-page-state';
  readonly anchor?: LessonTextAnchor;
}

/** Maintained semantic decisions, separately versioned from source extraction. */
export interface LessonTextBinding {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly placementId: string;
  readonly animationId: string;
  readonly sourceSwfSha256: string;
  readonly template: LessonTextTemplate;
  readonly blocks: readonly LessonTextBlockBinding[];
}

export interface LessonTextPresentationBlock {
  readonly id: string;
  readonly text: string;
  readonly role: LessonTextRole;
  readonly language: AnimationLanguage;
  readonly visible: boolean;
  readonly readingOrder: number;
  readonly anchor?: LessonTextAnchor;
}

/** One state snapshot feeds both modern text and exact old-text suppression. */
export interface TextPresentationSnapshot {
  readonly schemaVersion: 1;
  readonly animationId: string;
  readonly bindingVersion: string;
  readonly sourceSwfSha256: string;
  readonly status: 'ready' | 'blocked';
  readonly blockers: readonly string[];
  readonly identity: Readonly<{
    frame: number;
    frameDomain: string;
    rootFrame: number;
    scenario: string;
    language: AnimationLanguage;
    seed: number;
    replay: number;
  }>;
  readonly blocks: readonly LessonTextPresentationBlock[];
  readonly suppressedInstances: readonly LessonTextInstance[];
}

export interface LessonTextPresentationCapability<State> {
  readonly schemaVersion: 1;
  readonly binding: LessonTextBinding;
  /** Explicit opt-in renderer. Absence never changes a registered legacy view. */
  readonly Renderer?: ComponentType<AnimationRendererProps>;
  /** Only this opted-in view may adopt an authored interaction hold. */
  readonly playbackEndFrameByDomain?: Readonly<Record<string, number>>;
  /** Explicit readable source state for this modern view's reduced-motion path. */
  readonly reducedMotionFrameByDomain?: Readonly<Record<string, number>>;
  /** Exact authored stop/continue edges, executed by the existing host clock. */
  readonly frameControl?: Readonly<{
    frameDomain: string;
    completionFrame: number;
    transitions: readonly LessonTextFrameTransition[];
  }>;
  /** Explicit modern-only playback policy. Legacy module behavior is unchanged. */
  readonly playbackMode?: 'once';
  /** Opt-in terminal-frame audio consumption; never an authored-stop claim. */
  readonly terminalTimelineAudio?: Readonly<{
    frameDomain: string; holdFrame: number; endFrameExclusive: number;
    cueId: string; sourceSha256: string; pcmSha256: string;
    /** Allow an already-started cue whose nominal end is within one frame before the hold to finish despite clock drift. */
    allowClockDriftTail?: true;
  }>;
  readonly activityTimelines?: readonly LessonTextActivityDefinition[];
  /** Source-bound main timeline audio, projected by the existing frame clock. */
  readonly sourceTimelineAudioCues?: readonly (import('./contract').AudioCue & {readonly sha256: string; readonly manualNarration?: false})[];
  /** Await hash-bound graph assets before starting this presentation's clock. */
  readonly prepare?: (signal?: AbortSignal) => Promise<void>;
  /** Exact source glossary index and page-authored hyperlink targets. */
  readonly keyTerms?: LessonTextKeyTermsCapability;
  /** Learner completion for a maintained interaction held at an authored frame. */
  readonly completion?: LessonTextCompletionCapability;
  /** Called with this module's own state, preserving heterogeneous registries. */
  getSnapshot(
    state: State,
    context: RuntimeContext,
  ): TextPresentationSnapshot;
}

export interface LessonTextKeyTermsCapability {
  readonly indexLanguage: 'en' | 'es';
  readonly sourceAssetId: string;
  readonly sourceSha256: string;
  readonly entryIds: readonly string[];
  /** Raw ActionScript keys and the authored controls/windows that issue them. */
  readonly sourceKeyBindings?: readonly Readonly<{
    sourceButtonId: number;
    sourceKey: string;
    frameDomain: string;
    startFrame: number;
    endFrame: number;
  }>[];
}

export interface LessonTextCompletionCapability {
  readonly id: string;
  readonly frameDomain: string;
  readonly frames: readonly number[];
}
export interface LessonTextCompletionRequest {
  readonly id: string;
  readonly frameDomain: string;
  readonly frame: number;
  readonly seed: number;
  readonly replay: number;
}

export interface LessonTextFrameTransition {
  readonly fromFrame: number;
  readonly toFrame: number;
  readonly stopFrame: number;
}

export interface LessonTextActivityDefinition {
  readonly id: string;
  /** Exact placed MovieClip path. Opts into source child concurrency; a new
   * gotoAndPlay replaces only this instance, never its sibling or parent. */
  readonly sourceInstanceId?: string;
  /** Parent placement/removal lifetime, required for a concurrent instance. */
  readonly parentLifetime?: Readonly<{firstFrame: number; lastFrameExclusive: number}>;
  /** This child exists in the declared source button's down state only. */
  readonly buttonPress?: Readonly<{sourceButtonId: number}>;
  readonly frameDomain: string;
  readonly startFrame: number;
  readonly endFrame: number;
  /** A source jump can display one frame before a subsequent wrap/stop event.
   * Opt in only for startFrame === endFrame; default completion is unchanged. */
  readonly holdEndFrame?: true;
  readonly fps: number;
  readonly parentFrames: readonly number[];
  /** Authored gotoAndPlay edge from one exact active child segment. */
  readonly entryFromActivity?: Readonly<{id: string; firstFrame: number; lastFrame: number}>;
  readonly audio?: Readonly<{
    source: string;
    sha256: string;
    language: 'en' | 'es' | 'shared';
    spokenLanguage?: 'undetermined';
    firstFrame: number;
    lastFrame: number;
    /** Explicit media time at firstFrame; omitted means the unchanged zero origin.
     * A source-bound native projection may retain fractional sample positions. */
    offsetSeconds?: number;
  }>;
}

export interface LessonTextActivitySnapshot {
  /** Opaque clock-issued token bound to playback, seek and activity revision. */
  readonly cancellationToken?: string;
  readonly id: string;
  readonly sourceInstanceId?: string;
  readonly frameDomain: string;
  readonly frame: number;
  readonly revision: number;
  readonly status: 'playing' | 'completed';
}

export interface LessonTextActivityRequest {
  readonly id: string;
  readonly parentFrame: number;
  /** Bound to the activity the user actually saw; stale Close events fail. */
  readonly fromActivity?: Readonly<{id: string; revision: number}>;
}

/** Cancel exactly the observed child; never all media or a later replacement. */
export interface LessonTextActivityCancellation {
  readonly id: string;
  readonly sourceInstanceId?: string;
  readonly revision: number;
  readonly cancellationToken: string;
  readonly parentFrame: number;
}

export interface LessonTextButtonActivityRequest {
  readonly id: string;
  readonly parentFrame: number;
  readonly phase: 'press' | 'release';
  /** Locally unique press identity; a stale release cannot cancel a new press. */
  readonly token: string;
}
