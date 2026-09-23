import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G03_L01_TS_008_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf',
  swfSha256: '9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b',
  externalAudio:
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/SA/L1TS08.mp3',
  externalAudioSha256:
    'e81753a65c066c3b0112abf7dda689712a15aa022c8cc5ee7b4e38724c9fb734',
  rootFrameCount: 10,
  rootBeginFrame: 6,
  localObjectId: 348,
  localTimelineId: 'sprite-348',
  localFrameCount: 747,
  firstAuthoredStopFrame: 295
});

const ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g03-l01-ts-008/root-frames';

export const COURSE_G03_L01_TS_008_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: 'bec70ee0a3b8e9b8cafbf2c2a266a46bd21112305d16f241427c2ce26ddae511'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: 'ef821b3f9df3d6983fef9c11206ebc7f9e3e924ce969bb7f654a9fbe9bb171ed'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: 'ef821b3f9df3d6983fef9c11206ebc7f9e3e924ce969bb7f654a9fbe9bb171ed'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: 'ef821b3f9df3d6983fef9c11206ebc7f9e3e924ce969bb7f654a9fbe9bb171ed'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: 'ef821b3f9df3d6983fef9c11206ebc7f9e3e924ce969bb7f654a9fbe9bb171ed'})
] as const);

export const COURSE_G03_L01_TS_008_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G03_L01_TS_008_SOURCE.rootFrameCount,
  durationMs: (COURSE_G03_L01_TS_008_SOURCE.rootFrameCount * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G03_L01_TS_008_SOURCE.localTimelineId,
      frameCount: COURSE_G03_L01_TS_008_SOURCE.localFrameCount,
      rootFrame: COURSE_G03_L01_TS_008_SOURCE.rootBeginFrame
    })
  ]),
  defaultFrameDomain: COURSE_G03_L01_TS_008_SOURCE.localTimelineId
});

// Compatibility metadata for the existing local-sprite Canvas renderer. The
// shipped SWF root timeline remains COURSE_G03_L01_TS_008_RUNTIME above.
export const COURSE_G03_L01_TS_008_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G03_L01_TS_008_SOURCE.localFrameCount,
  durationMs: (COURSE_G03_L01_TS_008_SOURCE.localFrameCount * 1_000) / 12
});

export const COURSE_G03_L01_TS_008_LOCAL_SCENARIOS = Object.freeze([
  'source-drawing-default',
  'answer-correct-unavailable',
  'answer-first-wrong-unavailable',
  'answer-second-wrong-unavailable',
  'glossary-popup-unavailable',
  'completion-scoring-replay-unavailable'
] as const);

export const COURSE_G03_L01_TS_008_SCENARIOS = Object.freeze([
  'root-standalone',
  ...COURSE_G03_L01_TS_008_LOCAL_SCENARIOS
] as const);

export type CourseG03L01Ts008LocalScenario =
  (typeof COURSE_G03_L01_TS_008_LOCAL_SCENARIOS)[number];
export type CourseG03L01Ts008Scenario = (typeof COURSE_G03_L01_TS_008_SCENARIOS)[number];
export type CourseG03L01Ts008Blocker =
  | 'correct-answer-host-state-unresolved'
  | 'first-wrong-answer-host-state-unresolved'
  | 'second-wrong-answer-host-state-unresolved'
  | 'glossary-popup-host-state-unresolved'
  | 'completion-scoring-replay-host-state-unresolved';

interface CourseG03L01Ts008BaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly scenario: CourseG03L01Ts008Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG03L01Ts008Blocker | null;
  readonly interactiveStateResolved: false;
  readonly scoringResolved: false;
  readonly visualLocalizationStatus: 'source-shared-untranslated-visual';
  readonly audioLocalizationStatus: 'unresolved';
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G03_L01_TS_008_SOURCE.swfSha256;
}

export interface CourseG03L01Ts008RootFrameState
  extends CourseG03L01Ts008BaseFrameState {
  readonly frameDomain: 'root';
  readonly rootFrame: number;
  readonly scenario: 'root-standalone';
  readonly sourceDrawingOnly: false;
  readonly rootFrameAsset: Readonly<{source: string; sha256: string}>;
  readonly captureAuthority: 'adobe-standalone-deterministic-step-root-only';
  readonly naturalPlaybackStopFrame: 1;
  readonly originalHostStateResolved: false;
}

export interface CourseG03L01Ts008LocalFrameState
  extends CourseG03L01Ts008BaseFrameState {
  readonly frameDomain: 'sprite-348';
  readonly rootFrame: 6;
  readonly scenario: CourseG03L01Ts008LocalScenario;
  readonly sourceDrawingOnly: true;
  readonly sourceDrawingAuthority: 'ffdec-static-drawing-not-reachable-state';
}

export type CourseG03L01Ts008FrameState =
  | CourseG03L01Ts008RootFrameState
  | CourseG03L01Ts008LocalFrameState;

export function normalizeCourseG03L01Ts008Frame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_G03_L01_TS_008_MOVIE.frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG03L01Ts008RootFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G03_L01_TS_008_SOURCE.rootFrameCount,
    Math.max(1, Math.floor(frame))
  );
}

function normalizeLocalScenario(value: string | undefined): CourseG03L01Ts008LocalScenario {
  return COURSE_G03_L01_TS_008_LOCAL_SCENARIOS.includes(
    value as CourseG03L01Ts008LocalScenario
  )
    ? (value as CourseG03L01Ts008LocalScenario)
    : 'source-drawing-default';
}

function blockerFor(
  scenario: CourseG03L01Ts008LocalScenario
): CourseG03L01Ts008Blocker | null {
  if (scenario === 'answer-correct-unavailable') return 'correct-answer-host-state-unresolved';
  if (scenario === 'answer-first-wrong-unavailable') {
    return 'first-wrong-answer-host-state-unresolved';
  }
  if (scenario === 'answer-second-wrong-unavailable') {
    return 'second-wrong-answer-host-state-unresolved';
  }
  if (scenario === 'glossary-popup-unavailable') return 'glossary-popup-host-state-unresolved';
  if (scenario === 'completion-scoring-replay-unavailable') {
    return 'completion-scoring-replay-host-state-unresolved';
  }
  return null;
}

type CourseG03L01Ts008FrameContext = Pick<RuntimeContext, 'lang' | 'seed'> &
  Partial<Pick<RuntimeContext, 'scenario' | 'frameDomain' | 'rootFrame'>>;
type CourseG03L01Ts008RootFrameContext = Omit<
  CourseG03L01Ts008FrameContext,
  'frameDomain'
> & {readonly frameDomain: 'root'};
type CourseG03L01Ts008LocalFrameContext = Omit<
  CourseG03L01Ts008FrameContext,
  'frameDomain'
> & {readonly frameDomain?: 'sprite-348'};

export function getCourseG03L01Ts008FrameState(
  frame: number,
  context: CourseG03L01Ts008RootFrameContext
): CourseG03L01Ts008RootFrameState;
export function getCourseG03L01Ts008FrameState(
  frame: number,
  context: CourseG03L01Ts008LocalFrameContext
): CourseG03L01Ts008LocalFrameState;
export function getCourseG03L01Ts008FrameState(
  frame: number,
  context: CourseG03L01Ts008FrameContext
): CourseG03L01Ts008FrameState;

export function getCourseG03L01Ts008FrameState(
  frame: number,
  context: CourseG03L01Ts008FrameContext
): CourseG03L01Ts008FrameState {
  const frameDomain = context.frameDomain === 'root' ? 'root' : 'sprite-348';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG03L01Ts008RootFrame(frame)
    : normalizeCourseG03L01Ts008Frame(frame);
  const language = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;

  if (frameDomain === 'root') {
    const asset = COURSE_G03_L01_TS_008_ROOT_FRAME_ASSETS[normalizedFrame - 1];
    return Object.freeze({
      frame: normalizedFrame,
      exportFrame: normalizedFrame - 1,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario: 'root-standalone',
      language,
      seed,
      status: 'ready',
      blocker: null,
      sourceDrawingOnly: false,
      interactiveStateResolved: false,
      scoringResolved: false,
      visualLocalizationStatus: 'source-shared-untranslated-visual',
      audioLocalizationStatus: 'unresolved',
      audioRendered: false,
      rootFrameAsset: Object.freeze({
        source: `${ROOT_FRAME_ASSET_BASE}/${asset.file}`,
        sha256: asset.sha256
      }),
      captureAuthority: 'adobe-standalone-deterministic-step-root-only',
      naturalPlaybackStopFrame: 1,
      originalHostStateResolved: false,
      sourceSwfSha256: COURSE_G03_L01_TS_008_SOURCE.swfSha256
    });
  }

  const scenario = normalizeLocalScenario(context.scenario);
  const blocker = blockerFor(scenario);
  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    frameDomain: 'sprite-348',
    rootFrame: 6,
    scenario,
    language,
    seed,
    status: blocker ? 'blocked' : 'ready',
    blocker,
    sourceDrawingOnly: true,
    interactiveStateResolved: false,
    scoringResolved: false,
    visualLocalizationStatus: 'source-shared-untranslated-visual',
    audioLocalizationStatus: 'unresolved',
    audioRendered: false,
    sourceDrawingAuthority: 'ffdec-static-drawing-not-reachable-state',
    sourceSwfSha256: COURSE_G03_L01_TS_008_SOURCE.swfSha256
  });
}
