import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G04_L09_GS_002_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf',
  swfSha256: '41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15',
  externalSpanishAudio:
    'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/SA/L9GS02.mp3',
  externalSpanishAudioSha256:
    'fc1d611959deedae1d0ac4005b09c416fbd1711536c3190d190795798a4ad9d3',
  rootFrameCount: 10,
  rootBeginFrame: 6,
  rootBeginLabel: 'begin',
  localObjectId: 787,
  localTimelineId: 'sprite-787',
  localFrameCount: 653,
  staticDrawingReadyEndFrame: 641,
  gameBeginStopFrame: 642,
  firstQuestionFrame: 643,
  finalFrame: 653,
  buttonTargetCount: 14,
  embeddedSoundStreamCount: 12
});

export const COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g04-l09-gs-002/root-frames';
export const COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION =
  'source-shared-untranslated-visual' as const;

/**
 * Hashes come from the checked FFDec structural root export. These files make
 * the ten source root drawings directly inspectable; they are not an
 * original-runtime baseline and do not establish natural playback.
 */
export const COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: '6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: '6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: '6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: '6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: '6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: 'd196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: 'd196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: 'd196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: 'd196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: 'd196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a'})
] as const);

export const COURSE_G04_L09_GS_002_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 653,
  durationMs: (653 * 1_000) / 12
});

/**
 * The legacy/default movie metadata above addresses the long nested drawing
 * timeline. The source SWF root remains a separate ten-frame domain.
 */
export const COURSE_G04_L09_GS_002_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: COURSE_G04_L09_GS_002_MOVIE.stage,
  fps: 12,
  frameCount: COURSE_G04_L09_GS_002_SOURCE.rootFrameCount,
  durationMs: (COURSE_G04_L09_GS_002_SOURCE.rootFrameCount * 1_000) / 12,
  defaultFrameDomain: COURSE_G04_L09_GS_002_SOURCE.localTimelineId,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G04_L09_GS_002_SOURCE.localTimelineId,
      frameCount: COURSE_G04_L09_GS_002_SOURCE.localFrameCount,
      fps: 12,
      rootFrame: COURSE_G04_L09_GS_002_SOURCE.rootBeginFrame
    })
  ])
});

export const COURSE_G04_L09_GS_002_SCENARIOS = Object.freeze([
  'source-drawing-lead-in',
  'root-standalone',
  'questions-q1-q10-unavailable',
  'answer-correct-unavailable',
  'answer-wrong-unavailable',
  'random-scoring-unavailable',
  'final-replay-glossary-routing-unavailable'
] as const);

export type CourseG04L09Gs002Scenario = (typeof COURSE_G04_L09_GS_002_SCENARIOS)[number];
export type CourseG04L09Gs002FrameDomain = 'root' | 'sprite-787';
export type CourseG04L09Gs002Blocker =
  | 'spanish-visual-and-audio-not-source-proven'
  | 'question-final-avm1-state-unresolved'
  | 'questions-q1-q10-host-state-unresolved'
  | 'correct-answer-feedback-unresolved'
  | 'wrong-answer-feedback-unresolved'
  | 'random-selection-and-scoring-unresolved'
  | 'final-replay-glossary-and-course-routing-unresolved'
  | 'frame-domain-scenario-mismatch'
  | 'unsupported-runtime-request';

export interface CourseG04L09Gs002FrameState {
  readonly frame: number;
  readonly exportFrame: number | null;
  readonly frameDomain: CourseG04L09Gs002FrameDomain;
  readonly rootFrame: number;
  readonly rootState:
    | 'ffdec-structural-root-inspection-original-runtime-baseline-incomplete'
    | 'stopped-at-begin-while-child-plays';
  readonly scenario: CourseG04L09Gs002Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG04L09Gs002Blocker | null;
  readonly structuralDrawingOnly: true;
  readonly avm1Executed: false;
  readonly questionStateResolved: false;
  readonly randomStateResolved: false;
  readonly scoringResolved: false;
  readonly visualLocalizationStatus:
    | typeof COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION
    | 'english-source-only-spanish-unresolved';
  readonly spanishTranslationSupplied: false;
  readonly audioLocalizationStatus: 'unresolved';
  readonly audioRendered: false;
  readonly rootFrameAsset: Readonly<{source: string; sha256: string}> | null;
  readonly rootVisualAuthority:
    | 'ffdec-static-root-timeline-structural-render-not-original-runtime'
    | null;
  readonly originalRuntimeBaselineComplete: false;
  readonly naturalPlaybackStopFrame: 1;
  readonly strictAcceptanceEffect: 'none';
  readonly sourceSwfSha256: typeof COURSE_G04_L09_GS_002_SOURCE.swfSha256;
}

export function normalizeCourseG04L09Gs002Frame(
  frame: number,
  frameDomain: CourseG04L09Gs002FrameDomain = 'sprite-787'
): number {
  if (!Number.isFinite(frame)) return 1;
  const frameCount =
    frameDomain === 'root'
      ? COURSE_G04_L09_GS_002_SOURCE.rootFrameCount
      : COURSE_G04_L09_GS_002_SOURCE.localFrameCount;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

function resolveFrameDomain(value: string | undefined): {
  frameDomain: CourseG04L09Gs002FrameDomain;
  supported: boolean;
} {
  if (value === undefined || value === 'sprite-787') {
    return {frameDomain: 'sprite-787', supported: true};
  }
  if (value === 'root') return {frameDomain: 'root', supported: true};
  return {frameDomain: 'sprite-787', supported: false};
}

function resolveScenario(value: string): {
  scenario: CourseG04L09Gs002Scenario;
  supported: boolean;
} {
  if (COURSE_G04_L09_GS_002_SCENARIOS.includes(value as CourseG04L09Gs002Scenario)) {
    return {scenario: value as CourseG04L09Gs002Scenario, supported: true};
  }
  return {scenario: 'source-drawing-lead-in', supported: false};
}

function blockerFor(
  frame: number,
  frameDomain: CourseG04L09Gs002FrameDomain,
  language: AnimationLanguage,
  scenario: CourseG04L09Gs002Scenario,
  domainSupported: boolean,
  scenarioSupported: boolean
): CourseG04L09Gs002Blocker | null {
  if (!domainSupported || !scenarioSupported) return 'unsupported-runtime-request';
  const scenarioMatchesDomain =
    (frameDomain === 'root' && scenario === 'root-standalone') ||
    (frameDomain === 'sprite-787' && scenario !== 'root-standalone');
  if (!scenarioMatchesDomain) return 'frame-domain-scenario-mismatch';
  if (language === 'es' && frameDomain === 'sprite-787') {
    return 'spanish-visual-and-audio-not-source-proven';
  }
  if (scenario === 'questions-q1-q10-unavailable') {
    return 'questions-q1-q10-host-state-unresolved';
  }
  if (scenario === 'answer-correct-unavailable') return 'correct-answer-feedback-unresolved';
  if (scenario === 'answer-wrong-unavailable') return 'wrong-answer-feedback-unresolved';
  if (scenario === 'random-scoring-unavailable') {
    return 'random-selection-and-scoring-unresolved';
  }
  if (scenario === 'final-replay-glossary-routing-unavailable') {
    return 'final-replay-glossary-and-course-routing-unresolved';
  }
  if (frame > COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame) {
    return 'question-final-avm1-state-unresolved';
  }
  return null;
}

export function getCourseG04L09Gs002FrameState(
  frame: number,
  context: Pick<RuntimeContext, 'frameDomain' | 'scenario' | 'lang' | 'seed'>
): CourseG04L09Gs002FrameState {
  const domainResolution = resolveFrameDomain(context.frameDomain);
  const scenarioResolution = resolveScenario(context.scenario);
  const {frameDomain} = domainResolution;
  const {scenario} = scenarioResolution;
  const normalizedFrame = normalizeCourseG04L09Gs002Frame(frame, frameDomain);
  const language = context.lang === 'es' ? 'es' : 'en';
  const blocker = blockerFor(
    normalizedFrame,
    frameDomain,
    language,
    scenario,
    domainResolution.supported,
    scenarioResolution.supported
  );
  const rootFrameAsset =
    frameDomain === 'root'
      ? COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS[normalizedFrame - 1]
      : null;

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    frameDomain,
    rootFrame:
      frameDomain === 'root' ? normalizedFrame : COURSE_G04_L09_GS_002_SOURCE.rootBeginFrame,
    rootState:
      frameDomain === 'root'
        ? 'ffdec-structural-root-inspection-original-runtime-baseline-incomplete'
        : 'stopped-at-begin-while-child-plays',
    scenario,
    language,
    seed: Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0,
    status: blocker ? 'blocked' : 'ready',
    blocker,
    structuralDrawingOnly: true,
    avm1Executed: false,
    questionStateResolved: false,
    randomStateResolved: false,
    scoringResolved: false,
    visualLocalizationStatus:
      frameDomain === 'root'
        ? COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION
        : 'english-source-only-spanish-unresolved',
    spanishTranslationSupplied: false,
    audioLocalizationStatus: 'unresolved',
    audioRendered: false,
    rootFrameAsset: rootFrameAsset
      ? Object.freeze({
          source: `${COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE}/${rootFrameAsset.file}`,
          sha256: rootFrameAsset.sha256
        })
      : null,
    rootVisualAuthority:
      frameDomain === 'root'
        ? 'ffdec-static-root-timeline-structural-render-not-original-runtime'
        : null,
    originalRuntimeBaselineComplete: false,
    naturalPlaybackStopFrame: 1,
    strictAcceptanceEffect: 'none',
    sourceSwfSha256: COURSE_G04_L09_GS_002_SOURCE.swfSha256
  });
}
