import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G03_L01_VB_004_SOURCE = Object.freeze({
  fla: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla',
  flaSha256: '49f1694f1a7ec200d4d3455c1bc29699b83146043b7c0f25165228b32a9e3a1a',
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf',
  swfSha256: '8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e',
  rootFrameCount: 10,
  rootPlacementFrame: 6,
  localTimelineId: 'sprite-231',
  localObjectId: 231,
  localFrameCount: 222,
  quizStopFrame: 56
});

export const COURSE_G03_L01_VB_004_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G03_L01_VB_004_SOURCE.rootFrameCount,
  durationMs: (COURSE_G03_L01_VB_004_SOURCE.rootFrameCount * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G03_L01_VB_004_SOURCE.localTimelineId,
      frameCount: COURSE_G03_L01_VB_004_SOURCE.localFrameCount,
      rootFrame: COURSE_G03_L01_VB_004_SOURCE.rootPlacementFrame
    })
  ]),
  defaultFrameDomain: COURSE_G03_L01_VB_004_SOURCE.localTimelineId
});

// Compatibility metadata for the existing nested CreateJS renderer. The
// shipped SWF root metadata is COURSE_G03_L01_VB_004_RUNTIME above.
export const COURSE_G03_L01_VB_004_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G03_L01_VB_004_SOURCE.localFrameCount,
  durationMs: (COURSE_G03_L01_VB_004_SOURCE.localFrameCount * 1_000) / 12
});

export const COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME =
  COURSE_G03_L01_VB_004_SOURCE.quizStopFrame;

export const COURSE_G03_L01_VB_004_SCENARIOS = Object.freeze([
  'linear-to-quiz-stop',
  'root-standalone',
  'authoring-frame-inspection',
  'quiz-interaction-unavailable'
] as const);

export type CourseG03L01Vb004Scenario = (typeof COURSE_G03_L01_VB_004_SCENARIOS)[number];
export type CourseG03L01Vb004Blocker =
  'quiz-branches-scoring-and-feedback-unresolved';
export type CourseG03L01Vb004FrameDomain = 'root' | 'sprite-231';

interface CourseG03L01Vb004BaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly frameDomain: CourseG03L01Vb004FrameDomain;
  readonly rootFrame: number;
  readonly scenario: CourseG03L01Vb004Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG03L01Vb004Blocker | null;
  readonly visualLocalizationStatus: 'source-shared-untranslated-visual';
  readonly audioLocalizationStatus: 'unresolved';
  readonly audioRendered: false;
  readonly interactionBehaviorImplemented: false;
  readonly sourceSwfSha256: typeof COURSE_G03_L01_VB_004_SOURCE.swfSha256;
}

export interface CourseG03L01Vb004RootFrameState
  extends CourseG03L01Vb004BaseFrameState {
  readonly frameDomain: 'root';
  readonly scenario: 'root-standalone';
  readonly status: 'ready';
  readonly blocker: null;
  readonly localCompositeFrame: number | null;
  readonly runtimeReachability: 'source-standalone-sequential-step';
  readonly renderingAuthority:
    'source-root-structure-and-authoritative-standalone-frame-sequence';
  readonly naturalPlaybackStopFrame: 1;
  readonly interactionBoundary: false;
}

export interface CourseG03L01Vb004LocalFrameState
  extends CourseG03L01Vb004BaseFrameState {
  readonly frameDomain: 'sprite-231';
  readonly rootFrame: 6;
  readonly scenario: Exclude<CourseG03L01Vb004Scenario, 'root-standalone'>;
  readonly naturalPlaybackFrame: number;
  readonly runtimeReachability:
    | 'source-structured-linear-to-stop'
    | 'structural-only-runtime-reachability-unproven'
    | 'blocked';
  readonly renderingAuthority:
    | 'source-structured-linear-renderer-addressability'
    | 'source-structural-renderer-addressability-only'
    | 'unresolved-interaction';
  readonly interactionBoundary: boolean;
}

export type CourseG03L01Vb004FrameState =
  | CourseG03L01Vb004RootFrameState
  | CourseG03L01Vb004LocalFrameState;

function normalizeFrame(frame: number, frameCount: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG03L01Vb004Frame(frame: number): number {
  return normalizeFrame(frame, COURSE_G03_L01_VB_004_SOURCE.localFrameCount);
}

export function normalizeCourseG03L01Vb004RootFrame(frame: number): number {
  return normalizeFrame(frame, COURSE_G03_L01_VB_004_SOURCE.rootFrameCount);
}

function normalizeScenario(
  value: string,
  frameDomain: CourseG03L01Vb004FrameDomain
): CourseG03L01Vb004Scenario {
  if (frameDomain === 'root') return 'root-standalone';
  return value === 'authoring-frame-inspection' ||
    value === 'quiz-interaction-unavailable' ||
    value === 'linear-to-quiz-stop'
    ? value
    : 'linear-to-quiz-stop';
}

type CourseG03L01Vb004FrameContext = Pick<
  RuntimeContext,
  'scenario' | 'lang' | 'seed' | 'frameDomain' | 'rootFrame'
>;
type CourseG03L01Vb004RootFrameContext = Omit<
  CourseG03L01Vb004FrameContext,
  'frameDomain'
> & {readonly frameDomain: 'root'};
type CourseG03L01Vb004LocalFrameContext = Omit<
  CourseG03L01Vb004FrameContext,
  'frameDomain'
> & {readonly frameDomain?: 'sprite-231'};

export function getCourseG03L01Vb004FrameState(
  frame: number,
  context: CourseG03L01Vb004RootFrameContext
): CourseG03L01Vb004RootFrameState;
export function getCourseG03L01Vb004FrameState(
  frame: number,
  context: CourseG03L01Vb004LocalFrameContext
): CourseG03L01Vb004LocalFrameState;
export function getCourseG03L01Vb004FrameState(
  frame: number,
  context: CourseG03L01Vb004FrameContext
): CourseG03L01Vb004FrameState;
export function getCourseG03L01Vb004FrameState(
  frame: number,
  context: CourseG03L01Vb004FrameContext
): CourseG03L01Vb004FrameState {
  const frameDomain: CourseG03L01Vb004FrameDomain =
    context.frameDomain === 'root' ? 'root' : 'sprite-231';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG03L01Vb004RootFrame(frame)
    : normalizeCourseG03L01Vb004Frame(frame);
  const scenario = normalizeScenario(context.scenario, frameDomain);
  const language: AnimationLanguage = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const common = {
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    language,
    seed,
    visualLocalizationStatus: 'source-shared-untranslated-visual' as const,
    audioLocalizationStatus: 'unresolved' as const,
    audioRendered: false as const,
    interactionBehaviorImplemented: false as const,
    sourceSwfSha256: COURSE_G03_L01_VB_004_SOURCE.swfSha256
  };

  if (frameDomain === 'root') {
    return Object.freeze({
      ...common,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario: 'root-standalone',
      status: 'ready',
      blocker: null,
      localCompositeFrame:
        normalizedFrame >= COURSE_G03_L01_VB_004_SOURCE.rootPlacementFrame
          ? normalizedFrame
          : null,
      runtimeReachability: 'source-standalone-sequential-step',
      renderingAuthority:
        'source-root-structure-and-authoritative-standalone-frame-sequence',
      naturalPlaybackStopFrame: 1,
      interactionBoundary: false
    });
  }

  const localScenario: Exclude<CourseG03L01Vb004Scenario, 'root-standalone'> =
    scenario === 'root-standalone' ? 'linear-to-quiz-stop' : scenario;
  const blocker: CourseG03L01Vb004Blocker | null =
    localScenario === 'quiz-interaction-unavailable'
      ? 'quiz-branches-scoring-and-feedback-unresolved'
      : null;
  const afterNaturalStop =
    normalizedFrame > COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME;
  const runtimeReachability = blocker
    ? 'blocked'
    : afterNaturalStop || localScenario === 'authoring-frame-inspection'
      ? 'structural-only-runtime-reachability-unproven'
      : 'source-structured-linear-to-stop';
  const renderingAuthority = blocker
    ? 'unresolved-interaction'
    : afterNaturalStop || localScenario === 'authoring-frame-inspection'
      ? 'source-structural-renderer-addressability-only'
      : 'source-structured-linear-renderer-addressability';

  return Object.freeze({
    ...common,
    frameDomain: 'sprite-231',
    rootFrame: 6,
    scenario: localScenario,
    status: blocker ? 'blocked' : 'ready',
    blocker,
    naturalPlaybackFrame: Math.min(
      normalizedFrame,
      COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME
    ),
    runtimeReachability,
    renderingAuthority,
    interactionBoundary:
      normalizedFrame === COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME
  });
}
