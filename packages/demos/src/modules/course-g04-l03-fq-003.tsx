"use client";

import {
  COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT,
  createCourseG04L03FinalQuizFunctionalRenderer,
} from "./course-g04-l03-fq-002";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_FQ_003_INTERACTION_AUTHORITY,
  COURSE_G04_L03_FQ_003_INTERACTION_SOURCE,
  createCourseG04L03Fq003InteractionState,
  getCourseG04L03Fq003ReviewItem,
  reduceCourseG04L03Fq003Interaction,
} from "../timelines/course-g04-l03-fq-003-quiz-interaction";
import {
  COURSE_G04_L03_FQ_003_CONFIG,
  COURSE_G04_L03_FQ_003_SOURCE,
} from "../timelines/course-g04-l03-fq-003";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_FQ_003_CONFIG,
);

const FUNCTIONAL_ENTRY_FRAME = 1;
const SOURCE_DOMAIN = "sprite-899";
const SOURCE_SCENARIO = "source-static-frame";

export const CourseG04L03Fq003Renderer =
  createCourseG04L03FinalQuizFunctionalRenderer({
    animationId: "course-g04-l03-fq-003",
    createInteractionState: createCourseG04L03Fq003InteractionState,
    functionalHostFrameEnd: 43,
    functionalScope: "fq003-sequential-twenty-five-source-bound-final-quiz",
    getReviewItem: getCourseG04L03Fq003ReviewItem,
    reduceInteraction: reduceCourseG04L03Fq003Interaction,
    resultsGradeLabel: "Legacy source performance level",
    sourceCandidate: candidate,
  });

export {COURSE_G04_L03_FQ_003_SOURCE};
export const COURSE_G04_L03_FQ_003_MOVIE = candidate.movie;
export const COURSE_G04_L03_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_FQ_003_SOURCE_CONTRACT = Object.freeze({
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
    "twenty-five-source-bound-question-and-review-pairs",
    "source-sequential-twenty-five-of-twenty-five",
    "source-shape-atomic-answer-and-immediate-advance",
    "stale-and-double-answer-dispatch-rejected",
    "physical-double-click-answer-transition-lock",
    "Q7-and-Q9-Q12-source-canvas-pixel-bound-target-and-choice-projection",
    "Q8-owner-directed-current-javascript-cross-placement-from-course-g04-l03-ts-007",
    "Q8-cross-placement-does-not-establish-final-quiz-source-visual-parity",
    "source-legacy-raw-score-bands-preserved-with-documented-total-mismatch",
    "current-javascript-text-review-previous-next-enhancement",
    "source-question-and-review-frame-donor-projection",
    "deterministic-capture-preserves-unmodified-source-static-drawing-with-zero-overlay",
    "whole-state-replay-reset",
    "pause-disables-actions",
    "reduced-motion-static-interaction",
    "responsive-mobile-and-coarse-pointer-companion-surface",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration",
    "functional-source-canvas-aria-inert-and-pointer-event-isolated",
    "controls-fail-closed-until-source-canvas-ready",
  ]),
  interactionAuthority: COURSE_G04_L03_FQ_003_INTERACTION_AUTHORITY,
  interactionSource: COURSE_G04_L03_FQ_003_INTERACTION_SOURCE,
  ownerDirectedCrossPlacement: COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT,
  sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
  sourceQuestionSelectionParityEstablished: false,
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
export const COURSE_G04_L03_FQ_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Fq003Frame = candidate.normalizeFrame;
export const getCourseG04L03Fq003FrameState = candidate.getFrameState;
export const buildCourseG04L03Fq003CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Fq003Renderer,
});
