import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G03_L08_RE_001_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf',
  swfSha256: 'e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b',
  avm1Scripts: 'migrations/course-g03-l08-re-001/audit/machine/ffdec-scripts.txt.gz',
  avm1ScriptsSha256: '81546d70e37dee258ff2f79f4eda7da861460f50e781ea4027c249d6754209b6',
  scenarioInventorySha256: '340e14373517cd77beade8e426f991fe445b7c8c6be900b18b713bcc7ca51c7a',
  strictReadinessSha256: 'c8f827436c8e7e95b7556b2e8ead065ab3c38ff28ae571b1cb52b1f4d2172e68',
  audioAuditSha256: 'b69447ee9cd6098b3ab5a191d91f2e291fe78cfc6fb0ee294a269ae9070debcf',
  adobeStandaloneManifestSha256:
    '22e0feea207c14bc457489d121d6dc2f3079eee0c6f7262ac2693bb327491393',
  adobeStandaloneFrameSha256:
    'b5ca7ce7ed2805be4b0afe8309d26f0fa215abfe35efbc4d0f96bd32db5c3183',
  controlledLocalFrame2FailureSha256:
    '2036f290c26f207542dc5abfdd7bbec568c82d9fbf48406e65d69944c8a86005',
  rootBeginFrame: 51,
  rootBeginLabel: 'Begin',
  localPlacementName: 'animation',
  localObjectId: 621,
  localFrameCount: 27
});

export const COURSE_G03_L08_RE_001_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 55,
  durationMs: (55 * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: 'sprite-621',
      frameCount: COURSE_G03_L08_RE_001_SOURCE.localFrameCount,
      rootFrame: COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame
    })
  ]),
  defaultFrameDomain: 'root'
});

export const COURSE_G03_L08_RE_001_MOVIE: MovieMetadata = Object.freeze({
  stage: COURSE_G03_L08_RE_001_RUNTIME.stage,
  fps: COURSE_G03_L08_RE_001_RUNTIME.fps,
  frameCount: COURSE_G03_L08_RE_001_RUNTIME.frameCount,
  durationMs: COURSE_G03_L08_RE_001_RUNTIME.durationMs
});

export const COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME = 51;

export const COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN = 1;
export const COURSE_G03_L08_RE_001_REVIEW_COUNT_MAX = 10;
export const COURSE_G03_L08_RE_001_REVIEWANS_DELIMITER = 'SPL';
export const COURSE_G03_L08_RE_001_REVIEWANS_SEGMENT_COUNT = 7;
export const COURSE_G03_L08_RE_001_FEEDBACK_RGB = Object.freeze({
  correct: 39270,
  wrong: 16711680
});

export type CourseG03L08Re001ReviewLabel = `R${number}`;
export type CourseG03L08Re001AnswerOption = 1 | 2 | 3 | 4;
export type CourseG03L08Re001AnswerLetter = 'A' | 'B' | 'C' | 'D';

export interface CourseG03L08Re001ReviewLabelMapping {
  readonly label: CourseG03L08Re001ReviewLabel;
  readonly questionNumber: number;
  readonly localFrame: number;
}

export const COURSE_G03_L08_RE_001_REVIEW_LABEL_MAP: readonly CourseG03L08Re001ReviewLabelMapping[] =
  Object.freeze(
    Array.from({length: 25}, (_, index) =>
      Object.freeze({
        label: `R${index + 1}` as CourseG03L08Re001ReviewLabel,
        questionNumber: index + 1,
        localFrame: index + 2
      })
    )
  );

export const COURSE_G03_L08_RE_001_LOCAL_FRAME_LABELS = Object.freeze([
  Object.freeze({frame: 1, label: 'FirstSection'}),
  ...COURSE_G03_L08_RE_001_REVIEW_LABEL_MAP.map(({label, localFrame}) =>
    Object.freeze({frame: localFrame, label})
  )
]);

export type CourseG03L08Re001ReviewAnsSegments = readonly [
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[]
];

export interface CourseG03L08Re001ReviewAnsPayload {
  readonly raw: string;
  readonly segments: CourseG03L08Re001ReviewAnsSegments;
  readonly correctAnswers: readonly string[];
  readonly wrongAnswers: readonly string[];
  readonly responseAnswers: readonly string[];
  readonly quizLabels: readonly string[];
  readonly reviewLabels: readonly string[];
  readonly answers: readonly string[];
  readonly reviewOrder: readonly string[];
}

export type CourseG03L08Re001ReviewAnsParseResult =
  | Readonly<{ok: true; payload: CourseG03L08Re001ReviewAnsPayload}>
  | Readonly<{
      ok: false;
      reason: 'payload-not-string' | 'payload-empty' | 'segment-count-not-seven';
      actualSegmentCount: number | null;
    }>;

export type CourseG03L08Re001ReviewDirection = 'next' | 'previous';

export interface CourseG03L08Re001BackNavigationIntent {
  readonly kind: 'request-history-back';
  readonly historyDelta: -1;
  readonly legacyJavascriptExecutionAllowed: false;
  readonly requiresReviewedHostHandler: true;
}

export interface CourseG03L08Re001OptionFeedback {
  readonly option: CourseG03L08Re001AnswerOption;
  readonly letter: CourseG03L08Re001AnswerLetter;
  readonly instanceName: `R${number}Opt${CourseG03L08Re001AnswerOption}`;
  readonly selected: boolean;
  readonly correct: boolean;
  readonly text: 'Correct' | 'Incorrect' | null;
  readonly colorRgb: number | null;
}

export interface CourseG03L08Re001ReviewFeedbackState {
  readonly reviewCount: number;
  readonly reviewLabel: CourseG03L08Re001ReviewLabel;
  readonly localFrame: number;
  readonly questionNumber: number;
  readonly selectedToken: string;
  readonly selectedOption: CourseG03L08Re001AnswerOption;
  readonly selectedLetter: CourseG03L08Re001AnswerLetter;
  readonly correctToken: string;
  readonly correctOption: CourseG03L08Re001AnswerOption;
  readonly correctLetter: CourseG03L08Re001AnswerLetter;
  readonly selectedIsCorrect: boolean;
  readonly recordedOutcome: 'correct' | 'wrong' | 'conflicting' | 'unrecorded';
  readonly legacyOrdinalComparisonMatched: boolean;
  readonly optionFeedback: readonly CourseG03L08Re001OptionFeedback[];
}

export type CourseG03L08Re001ReviewFeedbackResult =
  | Readonly<{ok: true; state: CourseG03L08Re001ReviewFeedbackState}>
  | Readonly<{
      ok: false;
      reason:
        | 'review-item-missing'
        | 'review-label-invalid'
        | 'selected-answer-token-invalid'
        | 'correct-answer-token-invalid'
        | 'selected-answer-question-mismatch'
        | 'correct-answer-question-mismatch';
    }>;

const COURSE_G03_L08_RE_001_ANSWER_LETTERS = Object.freeze({
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D'
} satisfies Record<CourseG03L08Re001AnswerOption, CourseG03L08Re001AnswerLetter>);

const COURSE_G03_L08_RE_001_BACK_NAVIGATION_INTENT = Object.freeze({
  kind: 'request-history-back',
  historyDelta: -1,
  legacyJavascriptExecutionAllowed: false,
  requiresReviewedHostHandler: true
} satisfies CourseG03L08Re001BackNavigationIntent);

function reviewAnsParseFailure(
  reason: 'payload-not-string' | 'payload-empty' | 'segment-count-not-seven',
  actualSegmentCount: number | null
): CourseG03L08Re001ReviewAnsParseResult {
  return Object.freeze({ok: false, reason, actualSegmentCount});
}

/**
 * Mirrors sprite-621 frame 1: split the host text by the exact `SPL` token,
 * then split each of the seven source arrays by commas. No trimming,
 * normalization, decoding, or host-state inference is performed.
 */
export function parseCourseG03L08Re001ReviewAnsPayload(
  value: unknown
): CourseG03L08Re001ReviewAnsParseResult {
  if (typeof value !== 'string') return reviewAnsParseFailure('payload-not-string', null);
  if (value.length === 0) return reviewAnsParseFailure('payload-empty', 1);

  const rawSegments = value.split(COURSE_G03_L08_RE_001_REVIEWANS_DELIMITER);
  if (rawSegments.length !== COURSE_G03_L08_RE_001_REVIEWANS_SEGMENT_COUNT) {
    return reviewAnsParseFailure('segment-count-not-seven', rawSegments.length);
  }

  const segments = Object.freeze(
    rawSegments.map((segment) => Object.freeze(segment.split(',')))
  ) as CourseG03L08Re001ReviewAnsSegments;
  const payload = Object.freeze({
    raw: value,
    segments,
    correctAnswers: segments[0],
    wrongAnswers: segments[1],
    responseAnswers: segments[2],
    quizLabels: segments[3],
    reviewLabels: segments[4],
    answers: segments[5],
    reviewOrder: segments[6]
  });
  return Object.freeze({ok: true, payload});
}

export function resolveCourseG03L08Re001ReviewLabel(
  label: string
): CourseG03L08Re001ReviewLabelMapping | null {
  return COURSE_G03_L08_RE_001_REVIEW_LABEL_MAP.find((entry) => entry.label === label) ?? null;
}

export function normalizeCourseG03L08Re001ReviewCount(value: number): number {
  if (!Number.isFinite(value)) return COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN;
  return Math.min(
    COURSE_G03_L08_RE_001_REVIEW_COUNT_MAX,
    Math.max(COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN, Math.trunc(value))
  );
}

/** Mirrors the source Next/Previous release handlers and their inclusive clamp. */
export function stepCourseG03L08Re001ReviewCount(
  value: number,
  direction: CourseG03L08Re001ReviewDirection
): number {
  const finiteValue = Number.isFinite(value)
    ? Math.trunc(value)
    : COURSE_G03_L08_RE_001_REVIEW_COUNT_MIN;
  const candidate = finiteValue + (direction === 'next' ? 1 : -1);
  return normalizeCourseG03L08Re001ReviewCount(candidate);
}

export function getCourseG03L08Re001BackNavigationIntent(): CourseG03L08Re001BackNavigationIntent {
  return COURSE_G03_L08_RE_001_BACK_NAVIGATION_INTENT;
}

function parseSourceAnswerToken(value: string): Readonly<{
  questionNumber: number;
  option: CourseG03L08Re001AnswerOption;
}> | null {
  const match = /^.(\d{1,2})Opt([1-4])$/.exec(value);
  if (!match) return null;
  const questionNumber = Number(match[1]);
  if (questionNumber < 1 || questionNumber > 25) return null;
  return Object.freeze({
    questionNumber,
    option: Number(match[2]) as CourseG03L08Re001AnswerOption
  });
}

function feedbackFailure(
  reason: Exclude<CourseG03L08Re001ReviewFeedbackResult, {ok: true}>['reason']
): CourseG03L08Re001ReviewFeedbackResult {
  return Object.freeze({ok: false, reason});
}

/**
 * Derives the final option feedback produced by `doShowReview`. This is a pure
 * source-semantics helper only: it neither proves a historical REVIEWANS value
 * nor makes the unresolved sprite-621 renderer eligible for capture.
 */
export function getCourseG03L08Re001ReviewFeedbackState(
  payload: CourseG03L08Re001ReviewAnsPayload,
  reviewCount: number
): CourseG03L08Re001ReviewFeedbackResult {
  const normalizedCount = normalizeCourseG03L08Re001ReviewCount(reviewCount);
  const reviewIndex = normalizedCount - 1;
  const reviewLabelValue = payload.reviewOrder[reviewIndex];
  const selectedToken = payload.responseAnswers[reviewIndex];
  if (reviewLabelValue === undefined || selectedToken === undefined) {
    return feedbackFailure('review-item-missing');
  }

  const label = resolveCourseG03L08Re001ReviewLabel(reviewLabelValue);
  if (!label) return feedbackFailure('review-label-invalid');

  const selected = parseSourceAnswerToken(selectedToken);
  if (!selected) return feedbackFailure('selected-answer-token-invalid');
  if (selected.questionNumber !== label.questionNumber) {
    return feedbackFailure('selected-answer-question-mismatch');
  }

  const correctToken = payload.answers[label.questionNumber - 1];
  if (correctToken === undefined) return feedbackFailure('correct-answer-token-invalid');
  const correct = parseSourceAnswerToken(correctToken);
  if (!correct) return feedbackFailure('correct-answer-token-invalid');
  if (correct.questionNumber !== label.questionNumber) {
    return feedbackFailure('correct-answer-question-mismatch');
  }

  const selectedIsCorrect = selected.option === correct.option;
  const recordedCorrect = payload.correctAnswers.includes(selectedToken);
  const recordedWrong = payload.wrongAnswers.includes(selectedToken);
  const recordedOutcome = recordedCorrect && recordedWrong
    ? 'conflicting'
    : recordedCorrect
      ? 'correct'
      : recordedWrong
        ? 'wrong'
        : 'unrecorded';
  const legacyOrdinalComparisonMatched = selectedToken === payload.answers[reviewIndex];
  const optionFeedback = Object.freeze(
    ([1, 2, 3, 4] as const).map((option) => {
      const isSelected = option === selected.option;
      const isCorrect = option === correct.option;
      const selectedText = legacyOrdinalComparisonMatched ? 'Correct' : 'Incorrect';
      const selectedColor = legacyOrdinalComparisonMatched
        ? COURSE_G03_L08_RE_001_FEEDBACK_RGB.correct
        : COURSE_G03_L08_RE_001_FEEDBACK_RGB.wrong;
      return Object.freeze({
        option,
        letter: COURSE_G03_L08_RE_001_ANSWER_LETTERS[option],
        instanceName: `R${label.questionNumber}Opt${option}` as const,
        selected: isSelected,
        correct: isCorrect,
        // The source writes the selected feedback first, then overlays the
        // correct answer with green "Correct" feedback.
        text: isCorrect ? 'Correct' : isSelected ? selectedText : null,
        colorRgb: isCorrect
          ? COURSE_G03_L08_RE_001_FEEDBACK_RGB.correct
          : isSelected
            ? selectedColor
            : null
      });
    })
  );

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      reviewCount: normalizedCount,
      reviewLabel: label.label,
      localFrame: label.localFrame,
      questionNumber: label.questionNumber,
      selectedToken,
      selectedOption: selected.option,
      selectedLetter: COURSE_G03_L08_RE_001_ANSWER_LETTERS[selected.option],
      correctToken,
      correctOption: correct.option,
      correctLetter: COURSE_G03_L08_RE_001_ANSWER_LETTERS[correct.option],
      selectedIsCorrect,
      recordedOutcome,
      legacyOrdinalComparisonMatched,
      optionFeedback
    })
  });
}

export const COURSE_G03_L08_RE_001_SCENARIOS = Object.freeze([
  'root-standalone',
  'default',
  'host-review-unavailable',
  'legacy-back-unavailable'
] as const);

export type CourseG03L08Re001Scenario = (typeof COURSE_G03_L08_RE_001_SCENARIOS)[number];
export type CourseG03L08Re001FrameDomain = 'root' | 'sprite-621';
export const COURSE_G03_L08_RE_001_SCENARIOS_BY_FRAME_DOMAIN = Object.freeze({
  root: Object.freeze(['root-standalone'] as const),
  'sprite-621': Object.freeze([
    'default',
    'host-review-unavailable',
    'legacy-back-unavailable'
  ] as const)
});
export type CourseG03L08Re001Blocker =
  | 'unsupported-runtime-request'
  | 'frame-domain-scenario-mismatch'
  | 'spanish-host-state-not-source-proven'
  | 'reviewans-host-state-unavailable'
  | 'javascript-history-side-effect-disabled';
export type CourseG03L08Re001VisualLocalizationStatus =
  | 'source-shared-untranslated-visual'
  | 'host-dependent-unresolved';

export interface CourseG03L08Re001FrameState {
  readonly frameDomain: CourseG03L08Re001FrameDomain;
  readonly frame: number;
  readonly rootFrame: number;
  readonly naturalPlaybackFrame: number;
  readonly phase:
    | 'pre-begin'
    | 'begin-stopped'
    | 'post-stop-structural-frame'
    | 'local-host-blocked';
  readonly rootBeginFrame: 51;
  readonly rootBeginLabel: 'Begin';
  readonly naturalPlaybackStopped: boolean;
  readonly localTimeline: Readonly<{
    placementName: 'animation';
    objectId: 621;
    frameCount: 27;
    frame: number | null;
    label: 'FirstSection' | `R${number}` | null;
    stopped: boolean;
  }>;
  readonly scenario: CourseG03L08Re001Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG03L08Re001Blocker | null;
  readonly visualLocalizationStatus: CourseG03L08Re001VisualLocalizationStatus;
  readonly title: 'Quiz Review Details for the Student:';
  readonly background: '#b8d8f7';
  readonly reviewDataResolved: false;
  readonly controlledLocalFrame2Proved: false;
  readonly audioRendered: false;
  readonly sourceSwfSha256: typeof COURSE_G03_L08_RE_001_SOURCE.swfSha256;
  readonly authoritativeStandaloneFrameSha256: typeof COURSE_G03_L08_RE_001_SOURCE.adobeStandaloneFrameSha256;
}

export function normalizeCourseG03L08Re001Frame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_G03_L08_RE_001_MOVIE.frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG03L08Re001LocalFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G03_L08_RE_001_SOURCE.localFrameCount,
    Math.max(1, Math.floor(frame))
  );
}

function resolveFrameDomain(value: string | undefined): Readonly<{
  frameDomain: CourseG03L08Re001FrameDomain;
  supported: boolean;
}> {
  if (value === undefined || value === 'root') {
    return Object.freeze({frameDomain: 'root', supported: true});
  }
  if (value === 'sprite-621') {
    return Object.freeze({frameDomain: 'sprite-621', supported: true});
  }
  return Object.freeze({frameDomain: 'root', supported: false});
}

function resolveScenario(
  value: string,
  frameDomain: CourseG03L08Re001FrameDomain
): Readonly<{scenario: CourseG03L08Re001Scenario; supported: boolean}> {
  if (COURSE_G03_L08_RE_001_SCENARIOS.includes(value as CourseG03L08Re001Scenario)) {
    return Object.freeze({scenario: value as CourseG03L08Re001Scenario, supported: true});
  }
  return Object.freeze({
    scenario: frameDomain === 'root' ? 'root-standalone' : 'default',
    supported: false
  });
}

export function getCourseG03L08Re001FrameState(
  frame: number,
  context: Pick<RuntimeContext, 'scenario' | 'lang' | 'seed'> &
    Partial<Pick<RuntimeContext, 'frameDomain' | 'rootFrame'>>
): CourseG03L08Re001FrameState {
  const frameDomainResolution = resolveFrameDomain(context.frameDomain);
  const frameDomain = frameDomainResolution.frameDomain;
  const normalizedFrame = frameDomain === 'sprite-621'
    ? normalizeCourseG03L08Re001LocalFrame(frame)
    : normalizeCourseG03L08Re001Frame(frame);
  const scenarioResolution = resolveScenario(context.scenario, frameDomain);
  const scenario = scenarioResolution.scenario;
  const scenarioMatchesFrameDomain = (
    COURSE_G03_L08_RE_001_SCENARIOS_BY_FRAME_DOMAIN[frameDomain] as readonly string[]
  ).includes(scenario);
  const language = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const blocker: CourseG03L08Re001Blocker | null =
    !frameDomainResolution.supported || !scenarioResolution.supported
      ? 'unsupported-runtime-request'
      : !scenarioMatchesFrameDomain
        ? 'frame-domain-scenario-mismatch'
        : frameDomain === 'sprite-621'
          ? language === 'es'
            ? 'spanish-host-state-not-source-proven'
            : scenario === 'legacy-back-unavailable'
              ? 'javascript-history-side-effect-disabled'
              : 'reviewans-host-state-unavailable'
          : null;
  const rootFrame = frameDomain === 'sprite-621'
    ? COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame
    : normalizedFrame;
  const localPlaced = frameDomain === 'sprite-621' ||
    rootFrame >= COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame;
  const phase = frameDomain === 'sprite-621'
    ? 'local-host-blocked'
    : normalizedFrame < COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame
      ? 'pre-begin'
      : normalizedFrame === COURSE_G03_L08_RE_001_SOURCE.rootBeginFrame
        ? 'begin-stopped'
        : 'post-stop-structural-frame';
  const structuralLocalFrame = frameDomain === 'sprite-621'
    ? normalizedFrame
    : localPlaced
      ? 1
      : null;
  const structuralLocalLabel = structuralLocalFrame === null
    ? null
    : COURSE_G03_L08_RE_001_LOCAL_FRAME_LABELS.find(
        (entry) => entry.frame === structuralLocalFrame
      )?.label ?? null;

  return Object.freeze({
    frameDomain,
    frame: normalizedFrame,
    rootFrame,
    naturalPlaybackFrame: frameDomain === 'sprite-621'
      ? 1
      : Math.min(normalizedFrame, COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME),
    phase,
    rootBeginFrame: 51,
    rootBeginLabel: 'Begin',
    naturalPlaybackStopped: localPlaced,
    localTimeline: Object.freeze({
      placementName: 'animation',
      objectId: 621,
      frameCount: 27,
      frame: structuralLocalFrame,
      label: structuralLocalLabel,
      stopped: localPlaced
    }),
    scenario,
    language,
    seed,
    status: blocker ? 'blocked' : 'ready',
    blocker,
    visualLocalizationStatus:
      frameDomain === 'root'
        ? 'source-shared-untranslated-visual'
        : 'host-dependent-unresolved',
    title: 'Quiz Review Details for the Student:',
    background: '#b8d8f7',
    reviewDataResolved: false,
    controlledLocalFrame2Proved: false,
    audioRendered: false,
    sourceSwfSha256: COURSE_G03_L08_RE_001_SOURCE.swfSha256,
    authoritativeStandaloneFrameSha256:
      COURSE_G03_L08_RE_001_SOURCE.adobeStandaloneFrameSha256
  });
}
