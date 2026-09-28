import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G03_L06_FQ_002_REVIEW_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf',
  swfSha256: 'fadffa9df169b4c3417066431f8bfbc16a923778ec17a213b21a7ba2d0a51563',
  rootFrameCount: 10,
  spriteObjectId: 1168,
  rootBeginFrame: 6,
  rootBeginLabel: 'Begin',
  localTimelineId: 'sprite-1168',
  localFrameCount: 82,
  firstQuestionFrame: 2,
  reviewEntryFrame: 34,
  reviewStopFrame: 50,
  firstReviewQuestionFrame: 51
});

export type CourseG03L06Fq002ReviewAnswerOption = 1 | 2 | 3 | 4;

export interface CourseG03L06Fq002ReviewQuestionSourceFact {
  readonly questionNumber: number;
  readonly questionLabel: string;
  readonly questionFrame: number;
  readonly reviewLabel: string;
  readonly reviewFrame: number;
  readonly correctOption: CourseG03L06Fq002ReviewAnswerOption;
}

const COURSE_G03_L06_FQ_002_REVIEW_CORRECT_OPTIONS = Object.freeze([
  3, 2, 4, 1, 2, 1, 2, 4, 2, 1, 2, 3, 2, 2, 3, 1,
  2, 1, 3, 3, 4, 3, 2, 1, 4, 4, 4, 4, 1, 3, 3
] as const);

/**
 * Static source facts recovered from DefineSprite_1168/frame_1/DoAction.as.
 * They specify the complete authored question pool and answer key, but do not
 * claim which random ten-question ordering was reached in an original host.
 */
export const COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK = Object.freeze(
  COURSE_G03_L06_FQ_002_REVIEW_CORRECT_OPTIONS.map(
    (correctOption, index): CourseG03L06Fq002ReviewQuestionSourceFact =>
      Object.freeze({
        questionNumber: index + 1,
        questionLabel: `Q${index + 1}`,
        questionFrame: index + 2,
        reviewLabel: `R${index + 1}`,
        reviewFrame: index + 51,
        correctOption
      })
  )
);

export const COURSE_G03_L06_FQ_002_REVIEW_QUIZ_DRAW_COUNT = 10;

export type CourseG03L06Fq002ReviewGrade =
  | 'Unsatisfactory'
  | 'Partially Proficient'
  | 'Proficient'
  | 'Advanced';

export function getCourseG03L06Fq002ReviewSourceGrade(
  correctCount: number
): CourseG03L06Fq002ReviewGrade | null {
  if (
    !Number.isSafeInteger(correctCount) ||
    correctCount < 0 ||
    correctCount > COURSE_G03_L06_FQ_002_REVIEW_QUIZ_DRAW_COUNT
  ) {
    return null;
  }
  if (correctCount <= 3) return 'Unsatisfactory';
  if (correctCount <= 6) return 'Partially Proficient';
  if (correctCount <= 8) return 'Proficient';
  return 'Advanced';
}

export interface CourseG03L06Fq002ReviewSourceInitializationVector {
  readonly totalQuestionsCount: 10;
  readonly totQuizCount: 0;
  readonly reviewCount: 0;
  readonly quizSection: true;
  readonly finishVisible: false;
  readonly finishFrame: 1;
  readonly resultVisible: false;
  readonly correctAnswers: readonly string[];
  readonly wrongAnswers: readonly string[];
  readonly responseAnswers: readonly string[];
  readonly reviewOrder: readonly string[];
  readonly quizLabels: readonly string[];
  readonly reviewLabels: readonly string[];
  readonly answerIds: readonly string[];
}

/**
 * Child state immediately before the source calls doGetRandomQuiz(). A host
 * Replay reload must recreate this whole vector; resetting only a playhead or
 * question counter is not equivalent to the authored initialization.
 */
export function createCourseG03L06Fq002ReviewSourceInitializationVector():
  CourseG03L06Fq002ReviewSourceInitializationVector {
  return Object.freeze({
    totalQuestionsCount: COURSE_G03_L06_FQ_002_REVIEW_QUIZ_DRAW_COUNT,
    totQuizCount: 0,
    reviewCount: 0,
    quizSection: true,
    finishVisible: false,
    finishFrame: 1,
    resultVisible: false,
    correctAnswers: Object.freeze([]),
    wrongAnswers: Object.freeze([]),
    responseAnswers: Object.freeze([]),
    reviewOrder: Object.freeze([]),
    quizLabels: Object.freeze(
      COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.map(({questionLabel}) => questionLabel)
    ),
    reviewLabels: Object.freeze(
      COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.map(({reviewLabel}) => reviewLabel)
    ),
    answerIds: Object.freeze(
      COURSE_G03_L06_FQ_002_REVIEW_QUESTION_BANK.map(
        ({questionNumber, correctOption}) => `A${questionNumber}Opt${correctOption}`
      )
    )
  });
}

/**
 * Reproduces indexELM.swf's filename construction only. A returned string is
 * a source-derived request candidate, not proof that the file exists or that
 * the Review binary was historically deployed at that loaded path.
 */
export function getCourseG03L06Fq002ReviewHostAudioCandidatePath(
  loadedSwfPath: string,
  localQuestionFrame: number,
  language: AnimationLanguage,
  answerOption?: CourseG03L06Fq002ReviewAnswerOption
): string | null {
  if (
    typeof loadedSwfPath !== 'string' ||
    !loadedSwfPath.endsWith('.swf') ||
    !Number.isSafeInteger(localQuestionFrame) ||
    localQuestionFrame < 2 ||
    localQuestionFrame > 32 ||
    (answerOption !== undefined && ![1, 2, 3, 4].includes(answerOption))
  ) {
    return null;
  }
  const separator = loadedSwfPath.lastIndexOf('/');
  if (separator < 1) return null;
  const parent = loadedSwfPath.slice(0, separator);
  const directory = language === 'es' ? 'SA' : 'EA';
  const optionSuffix = answerOption === undefined
    ? ''
    : String.fromCharCode(64 + answerOption);
  return `${parent}/${directory}/Q${localQuestionFrame - 1}${optionSuffix}.mp3`;
}

export const COURSE_G03_L06_FQ_002_REVIEW_REPLAY_SOURCE_DISPOSITION =
  Object.freeze({
    hostAction: 'loadSWFMovie()',
    childResetMechanism: 'reload-child-swf-and-rerun-frame-1-initialization',
    activeXmlNavigation: 'OFF',
    activeHostReplayControlVisible: false,
    reviewVariantHostPlacementProven: false,
    strictReplayResolved: false
  } as const);

const ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g03-l06-fq-002-review/root-frames';

export const COURSE_G03_L06_FQ_002_REVIEW_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: '804c7c47b8e0b8954b9b142d4601d1a00bae54ecbdfb77a09f357ea25ad94bef'})
] as const);

export const COURSE_G03_L06_FQ_002_REVIEW_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    stage: Object.freeze({width: 800, height: 600}),
    fps: 12,
    frameCount: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.rootFrameCount,
    durationMs: (COURSE_G03_L06_FQ_002_REVIEW_SOURCE.rootFrameCount * 1_000) / 12,
    frameDomains: Object.freeze([
      Object.freeze({
        id: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.localTimelineId,
        frameCount: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.localFrameCount,
        rootFrame: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.rootBeginFrame
      })
    ]),
    defaultFrameDomain: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.localTimelineId
  });

// Compatibility metadata for the existing local-sprite Canvas renderer. The
// shipped root timeline remains COURSE_G03_L06_FQ_002_REVIEW_RUNTIME above.
export const COURSE_G03_L06_FQ_002_REVIEW_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 82,
  durationMs: (82 * 1_000) / 12
});

export type CourseG03L06Fq002ReviewBlocker =
  | 'spanish-visual-and-audio-not-source-proven';

export const COURSE_G03_L06_FQ_002_REVIEW_SCENARIOS = Object.freeze([
  'default',
  'root-standalone'
] as const);

export type CourseG03L06Fq002ReviewScenario =
  (typeof COURSE_G03_L06_FQ_002_REVIEW_SCENARIOS)[number];

interface CourseG03L06Fq002ReviewBaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly scenario: CourseG03L06Fq002ReviewScenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG03L06Fq002ReviewBlocker | null;
  readonly structuralDrawingOnly: true;
  readonly interactionResolved: false;
  readonly scoreResolved: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swfSha256;
}

export interface CourseG03L06Fq002ReviewRootFrameState
  extends CourseG03L06Fq002ReviewBaseFrameState {
  readonly frameDomain: 'root';
  readonly rootFrame: number;
  readonly scenario: 'root-standalone';
  readonly rootFrameAsset: Readonly<{
    source: string;
    sha256: string;
  }>;
  readonly captureAuthority: 'adobe-standalone-deterministic-step-root-only';
  readonly naturalPlaybackStopFrame: 1;
  readonly originalHostStateResolved: false;
}

export interface CourseG03L06Fq002ReviewLocalFrameState
  extends CourseG03L06Fq002ReviewBaseFrameState {
  readonly frameDomain: 'sprite-1168';
  readonly rootFrame: 6;
  readonly scenario: 'default';
  readonly sourceDrawingAuthority: 'ffdec-static-drawing-not-reachable-state';
}

export type CourseG03L06Fq002ReviewFrameState =
  | CourseG03L06Fq002ReviewRootFrameState
  | CourseG03L06Fq002ReviewLocalFrameState;

export function normalizeCourseG03L06Fq002ReviewFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G03_L06_FQ_002_REVIEW_MOVIE.frameCount,
    Math.max(1, Math.floor(frame))
  );
}

export function normalizeCourseG03L06Fq002ReviewRootFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G03_L06_FQ_002_REVIEW_SOURCE.rootFrameCount,
    Math.max(1, Math.floor(frame))
  );
}

type CourseG03L06Fq002ReviewFrameContext = Pick<RuntimeContext, 'lang' | 'seed'> &
  Partial<Pick<RuntimeContext, 'scenario' | 'frameDomain' | 'rootFrame'>>;
type CourseG03L06Fq002ReviewRootFrameContext = Omit<
  CourseG03L06Fq002ReviewFrameContext,
  'frameDomain'
> & {readonly frameDomain: 'root'};
type CourseG03L06Fq002ReviewLocalFrameContext = Omit<
  CourseG03L06Fq002ReviewFrameContext,
  'frameDomain'
> & {readonly frameDomain?: 'sprite-1168'};

export function getCourseG03L06Fq002ReviewFrameState(
  frame: number,
  context: CourseG03L06Fq002ReviewRootFrameContext
): CourseG03L06Fq002ReviewRootFrameState;
export function getCourseG03L06Fq002ReviewFrameState(
  frame: number,
  context: CourseG03L06Fq002ReviewLocalFrameContext
): CourseG03L06Fq002ReviewLocalFrameState;
export function getCourseG03L06Fq002ReviewFrameState(
  frame: number,
  context: CourseG03L06Fq002ReviewFrameContext
): CourseG03L06Fq002ReviewFrameState;

export function getCourseG03L06Fq002ReviewFrameState(
  frame: number,
  context: CourseG03L06Fq002ReviewFrameContext
): CourseG03L06Fq002ReviewFrameState {
  const frameDomain = context.frameDomain === 'root' ? 'root' : 'sprite-1168';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG03L06Fq002ReviewRootFrame(frame)
    : normalizeCourseG03L06Fq002ReviewFrame(frame);
  const language = context.lang === 'es' ? 'es' : 'en';
  const blocker: CourseG03L06Fq002ReviewBlocker | null =
    language === 'es' ? 'spanish-visual-and-audio-not-source-proven' : null;
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;

  if (frameDomain === 'root') {
    const asset = COURSE_G03_L06_FQ_002_REVIEW_ROOT_FRAME_ASSETS[normalizedFrame - 1];
    return Object.freeze({
      frame: normalizedFrame,
      exportFrame: normalizedFrame - 1,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario: 'root-standalone',
      language,
      seed,
      status: blocker ? 'blocked' : 'ready',
      blocker,
      structuralDrawingOnly: true,
      interactionResolved: false,
      scoreResolved: false,
      audioRendered: false,
      rootFrameAsset: Object.freeze({
        source: `${ROOT_FRAME_ASSET_BASE}/${asset.file}`,
        sha256: asset.sha256
      }),
      captureAuthority: 'adobe-standalone-deterministic-step-root-only',
      naturalPlaybackStopFrame: 1,
      originalHostStateResolved: false,
      sourceSwfSha256: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swfSha256
    });
  }

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    frameDomain: 'sprite-1168',
    rootFrame: 6,
    scenario: 'default',
    language,
    seed,
    status: blocker ? 'blocked' : 'ready',
    blocker,
    structuralDrawingOnly: true,
    interactionResolved: false,
    scoreResolved: false,
    audioRendered: false,
    sourceDrawingAuthority: 'ffdec-static-drawing-not-reachable-state',
    sourceSwfSha256: COURSE_G03_L06_FQ_002_REVIEW_SOURCE.swfSha256
  });
}
