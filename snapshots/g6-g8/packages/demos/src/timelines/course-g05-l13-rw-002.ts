import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G05_L13_RW_002_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf',
  swfSha256: 'bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6',
  rootFrameCount: 10,
  spriteObjectId: 334,
  rootBeginFrame: 6,
  localTimelineId: 'sprite-334',
  localFrameCount: 1873,
  firstStopFrame: 673,
  terminalStopFrame: 1873
});

export const COURSE_G05_L13_RW_002_EN_TRACE_SPEC = Object.freeze({
  path: 'migrations/course-g05-l13-rw-002/audit/trace-specs/req-sprite-334-default-en.json',
  sha256: '83b5389ebdba20cc292e578f94a93ea6ef62384531021a5500d5ee7847009ca0',
  status: 'source-schedule-ready-for-authoritative-execution'
} as const);

export const COURSE_G05_L13_RW_002_ES_TRACE_SPEC = Object.freeze({
  path: 'migrations/course-g05-l13-rw-002/audit/trace-specs/req-sprite-334-default-es.json',
  sha256: 'a75f3a4928744f9935774c01de1e77a91e6b435da745267998013a1bd44bb298',
  status: 'source-schedule-ready-for-authoritative-execution'
} as const);

const ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g05-l13-rw-002/root-frames';

export const COURSE_G05_L13_RW_002_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: 'b836aab921b6ef25695f8303139d3864d0a5ef9c76bb0813e35cc726b06e9982'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: '47e6c04d20f87e8cccf3cf6e127e61508792ce0b86df52e9806b53655ba46ff0'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: '10b1ae357b2262250da8404c20df04b994b0b1cc4a5f6e75eb28552beb426e6a'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: '76f9bc6967da195432420eed81918914b4883b7d02e16193781e1607aa51a817'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: '099c5dc507391e2fdfce788e00f0d58b07b834ad662620e3e03428d0b4dd4b0c'})
] as const);

export const COURSE_G05_L13_RW_002_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G05_L13_RW_002_SOURCE.rootFrameCount,
  durationMs: (COURSE_G05_L13_RW_002_SOURCE.rootFrameCount * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G05_L13_RW_002_SOURCE.localTimelineId,
      frameCount: COURSE_G05_L13_RW_002_SOURCE.localFrameCount,
      rootFrame: COURSE_G05_L13_RW_002_SOURCE.rootBeginFrame
    })
  ]),
  defaultFrameDomain: COURSE_G05_L13_RW_002_SOURCE.localTimelineId
});

// Compatibility metadata for the FFDec sprite-334 Canvas adapter. The source
// root timeline remains the ten-frame runtime declared above.
export const COURSE_G05_L13_RW_002_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G05_L13_RW_002_SOURCE.localFrameCount,
  durationMs: (COURSE_G05_L13_RW_002_SOURCE.localFrameCount * 1_000) / 12
});

export const COURSE_G05_L13_RW_002_SCENARIOS = Object.freeze([
  'root-standalone',
  'default'
] as const);

export const COURSE_G05_L13_RW_002_VISUAL_LOCALIZATION =
  'source-shared-untranslated-visual' as const;

export type CourseG05L13Rw002StrictAcceptanceBlocker =
  | 'authoritative-original-runtime-execution-pending'
  | 'source-replay-unresolved'
  | 'audio-not-rendered'
  | 'human-and-owner-acceptance-pending';

export type CourseG05L13Rw002SourceSchedulePhase =
  | 'frames-1-672-natural-play'
  | 'frame-673-source-stop-awaiting-press'
  | 'frames-674-1872-resumed-play'
  | 'frame-1873-terminal-source-stop';

interface CourseG05L13Rw002BaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly scenario: 'root-standalone' | 'default';
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready';
  readonly blocker: null;
  readonly visualLocalizationStatus:
    typeof COURSE_G05_L13_RW_002_VISUAL_LOCALIZATION;
  readonly audioLocalizationStatus: 'unresolved';
  readonly audioStatus: 'blocked-not-rendered';
  readonly hostIntegrationStatus: 'blocked-not-authoritatively-executed';
  readonly interactionResolved: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G05_L13_RW_002_SOURCE.swfSha256;
}

export interface CourseG05L13Rw002RootFrameState
  extends CourseG05L13Rw002BaseFrameState {
  readonly frameDomain: 'root';
  readonly rootFrame: number;
  readonly scenario: 'root-standalone';
  readonly structuralDrawingOnly: false;
  readonly rootFrameAsset: Readonly<{source: string; sha256: string}>;
  readonly captureAuthority: 'adobe-standalone-deterministic-step-root-only';
  readonly naturalPlaybackStopFrame: 1;
  readonly originalHostStateResolved: false;
}

export interface CourseG05L13Rw002LocalFrameState
  extends CourseG05L13Rw002BaseFrameState {
  readonly frameDomain: 'sprite-334';
  readonly rootFrame: 6;
  readonly scenario: 'default';
  readonly structuralDrawingOnly: true;
  readonly staticAddressableRange: Readonly<{firstFrame: 1; lastFrame: 1873}>;
  readonly sourceSchedulePhase: CourseG05L13Rw002SourceSchedulePhase;
  readonly sourceScheduleStatus: typeof COURSE_G05_L13_RW_002_EN_TRACE_SPEC.status;
  readonly sourceScheduleSha256:
    | typeof COURSE_G05_L13_RW_002_EN_TRACE_SPEC.sha256
    | typeof COURSE_G05_L13_RW_002_ES_TRACE_SPEC.sha256;
  readonly sourceScheduleStepRequired: boolean;
  readonly sourceScheduleStepExecutionClaimed: false;
  readonly localPlayState: 'playing' | 'stopped';
  readonly quizSection: boolean | null;
  readonly postStopSegmentReached: boolean;
  readonly postStopTransitionSourceEvidenced: true;
  readonly terminalStateSourceEvidenced: true;
  readonly authoritativeRuntimeExecutionComplete: false;
  readonly replayResolved: false;
  readonly strictAcceptanceBlockers: readonly CourseG05L13Rw002StrictAcceptanceBlocker[];
  readonly sourceDrawingAuthority: 'ffdec-static-drawing-bound-to-source-schedule-not-runtime-capture';
}

export type CourseG05L13Rw002FrameState =
  | CourseG05L13Rw002RootFrameState
  | CourseG05L13Rw002LocalFrameState;

export function normalizeCourseG05L13Rw002Frame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_G05_L13_RW_002_MOVIE.frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG05L13Rw002RootFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G05_L13_RW_002_SOURCE.rootFrameCount,
    Math.max(1, Math.floor(frame))
  );
}

type CourseG05L13Rw002FrameContext = Pick<RuntimeContext, 'lang' | 'seed'> &
  Partial<Pick<RuntimeContext, 'scenario' | 'frameDomain' | 'rootFrame'>>;
type CourseG05L13Rw002RootFrameContext = Omit<
  CourseG05L13Rw002FrameContext,
  'frameDomain'
> & {readonly frameDomain: 'root'};
type CourseG05L13Rw002LocalFrameContext = Omit<
  CourseG05L13Rw002FrameContext,
  'frameDomain'
> & {readonly frameDomain?: 'sprite-334'};

export function getCourseG05L13Rw002FrameState(
  frame: number,
  context: CourseG05L13Rw002RootFrameContext
): CourseG05L13Rw002RootFrameState;
export function getCourseG05L13Rw002FrameState(
  frame: number,
  context: CourseG05L13Rw002LocalFrameContext
): CourseG05L13Rw002LocalFrameState;
export function getCourseG05L13Rw002FrameState(
  frame: number,
  context: CourseG05L13Rw002FrameContext
): CourseG05L13Rw002FrameState;

export function getCourseG05L13Rw002FrameState(
  frame: number,
  context: CourseG05L13Rw002FrameContext
): CourseG05L13Rw002FrameState {
  const frameDomain = context.frameDomain === 'root' ? 'root' : 'sprite-334';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG05L13Rw002RootFrame(frame)
    : normalizeCourseG05L13Rw002Frame(frame);
  const language: AnimationLanguage = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const common = {
    language,
    seed,
    status: 'ready' as const,
    blocker: null,
    visualLocalizationStatus: COURSE_G05_L13_RW_002_VISUAL_LOCALIZATION,
    audioLocalizationStatus: 'unresolved' as const,
    audioStatus: 'blocked-not-rendered' as const,
    hostIntegrationStatus: 'blocked-not-authoritatively-executed' as const,
    interactionResolved: false as const,
    audioRendered: false as const,
    sourceSwfSha256: COURSE_G05_L13_RW_002_SOURCE.swfSha256
  };

  if (frameDomain === 'root') {
    const asset = COURSE_G05_L13_RW_002_ROOT_FRAME_ASSETS[normalizedFrame - 1];
    return Object.freeze({
      ...common,
      frame: normalizedFrame,
      exportFrame: normalizedFrame - 1,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario: 'root-standalone',
      structuralDrawingOnly: false,
      rootFrameAsset: Object.freeze({
        source: `${ROOT_FRAME_ASSET_BASE}/${asset.file}`,
        sha256: asset.sha256
      }),
      captureAuthority: 'adobe-standalone-deterministic-step-root-only',
      naturalPlaybackStopFrame: 1,
      originalHostStateResolved: false
    });
  }

  const sourceSchedulePhase: CourseG05L13Rw002SourceSchedulePhase =
    normalizedFrame < COURSE_G05_L13_RW_002_SOURCE.firstStopFrame
      ? 'frames-1-672-natural-play'
      : normalizedFrame === COURSE_G05_L13_RW_002_SOURCE.firstStopFrame
        ? 'frame-673-source-stop-awaiting-press'
        : normalizedFrame < COURSE_G05_L13_RW_002_SOURCE.terminalStopFrame
          ? 'frames-674-1872-resumed-play'
          : 'frame-1873-terminal-source-stop';
  const localPlayState =
    normalizedFrame === COURSE_G05_L13_RW_002_SOURCE.firstStopFrame ||
    normalizedFrame === COURSE_G05_L13_RW_002_SOURCE.terminalStopFrame
      ? 'stopped'
      : 'playing';
  const sourceSchedule = language === 'es'
    ? COURSE_G05_L13_RW_002_ES_TRACE_SPEC
    : COURSE_G05_L13_RW_002_EN_TRACE_SPEC;
  return Object.freeze({
    ...common,
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    frameDomain: 'sprite-334',
    rootFrame: 6,
    scenario: 'default',
    structuralDrawingOnly: true,
    staticAddressableRange: Object.freeze({firstFrame: 1, lastFrame: 1873}),
    sourceSchedulePhase,
    sourceScheduleStatus: sourceSchedule.status,
    sourceScheduleSha256: sourceSchedule.sha256,
    sourceScheduleStepRequired:
      normalizedFrame > COURSE_G05_L13_RW_002_SOURCE.firstStopFrame,
    sourceScheduleStepExecutionClaimed: false,
    localPlayState,
    quizSection:
      normalizedFrame < COURSE_G05_L13_RW_002_SOURCE.firstStopFrame
        ? null
        : normalizedFrame === COURSE_G05_L13_RW_002_SOURCE.firstStopFrame,
    postStopSegmentReached: normalizedFrame > COURSE_G05_L13_RW_002_SOURCE.firstStopFrame,
    postStopTransitionSourceEvidenced: true,
    terminalStateSourceEvidenced: true,
    authoritativeRuntimeExecutionComplete: false,
    replayResolved: false,
    strictAcceptanceBlockers: Object.freeze([
      'authoritative-original-runtime-execution-pending',
      'source-replay-unresolved',
      'audio-not-rendered',
      'human-and-owner-acceptance-pending'
    ] as const),
    sourceDrawingAuthority: 'ffdec-static-drawing-bound-to-source-schedule-not-runtime-capture'
  });
}
