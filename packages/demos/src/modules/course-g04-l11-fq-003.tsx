"use client";

import {createCourseG04L03FinalQuizFunctionalRenderer} from "./course-g04-l03-fq-002";
import {
  COURSE_G04_L11_FQ_003_SOURCE_STATIC_CANDIDATE,
} from "./course-g04-l11-fq-003-source-static";
import {
  COURSE_G04_L11_FQ_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_FQ_003_INTERACTION_SOURCE,
  createCourseG04L11Fq003InteractionState,
  getCourseG04L11Fq003ReviewItem,
  reduceCourseG04L11Fq003Interaction,
} from "../timelines/course-g04-l11-fq-003-quiz-interaction";
import {COURSE_G04_L11_FQ_003_SOURCE} from "../timelines/course-g04-l11-fq-003";

const candidate = COURSE_G04_L11_FQ_003_SOURCE_STATIC_CANDIDATE;

const FUNCTIONAL_ENTRY_FRAME = 1;
const SOURCE_DOMAIN = "sprite-910";
const SOURCE_SCENARIO = "source-static-frame";

export const CourseG04L11Fq003Renderer =
  createCourseG04L03FinalQuizFunctionalRenderer({
    animationId: "course-g04-l11-fq-003",
    createInteractionState: createCourseG04L11Fq003InteractionState,
    functionalEntryFrame: FUNCTIONAL_ENTRY_FRAME,
    functionalHostFrameEnd: 72,
    functionalScope: "fq003-sequential-twenty-six-source-bound-coordinate-grid-final-quiz",
    getReviewItem: getCourseG04L11Fq003ReviewItem,
    reduceInteraction: reduceCourseG04L11Fq003Interaction,
    resultsDonorFrame: 29,
    resultsGradeLabel: "Legacy source performance level",
    sourceCandidate: candidate,
    sourceDomain: SOURCE_DOMAIN,
    sourceScenario: SOURCE_SCENARIO,
  });

export {COURSE_G04_L11_FQ_003_SOURCE};
export const COURSE_G04_L11_FQ_003_MOVIE = candidate.movie;
export const COURSE_G04_L11_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_FQ_003_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-final-quiz-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: FUNCTIONAL_ENTRY_FRAME,
    scenario: SOURCE_SCENARIO,
    language: "en",
    deterministicCaptureOverlayEnabled: false,
  }),
  currentJavascriptInteractionScope: Object.freeze([
    "twenty-six-source-bound-question-and-review-pairs",
    "source-sequential-Q1-through-Q26",
    "source-shape-atomic-answer-and-immediate-advance",
    "stale-and-double-answer-dispatch-rejected",
    "modern-semantic-answer-review-and-reset-controls",
    "legacy-course-shell-navigation-and-player-chrome-excluded",
    "legacy-absolute-score-bands-preserved",
    "legacy-host-report-get-url-audio-and-spanish-integrations-disabled",
    "source-question-and-review-frame-donor-projection",
  ]),
  interactionAuthority: COURSE_G04_L11_FQ_003_INTERACTION_AUTHORITY,
  interactionSource: COURSE_G04_L11_FQ_003_INTERACTION_SOURCE,
  sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
  sourceQuestionVisualParityEstablished: false,
  sourceReviewVisualParityEstablished: false,
  sourceResultsVisualParityEstablished: false,
  sourceLegacyGradePresentationLabel: "Legacy source performance level",
  sourceAudioEnabled: false,
  sourceSpanishEnabled: false,
  sourceLmsAndGetUrlEnabled: false,
  sourceHostCloseReportEnabled: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  authoritativeOriginalRuntimeAccepted: false,
  naturalRuntimeTraceAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L11_FQ_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Fq003Frame = candidate.normalizeFrame;
export const getCourseG04L11Fq003FrameState = candidate.getFrameState;
export const buildCourseG04L11Fq003CaptureAttributes =
  candidate.buildCaptureAttributes;
export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L11Fq003Renderer,
});
