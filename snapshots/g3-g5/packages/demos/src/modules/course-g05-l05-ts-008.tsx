"use client";

import {createG5L5ProductVerticalSliceCandidate} from "../g5-l5-four-page-product-vertical-slice";
import {COURSE_G05_L05_TS_008_CONFIG, COURSE_G05_L05_TS_008_SOURCE} from "../timelines/course-g05-l05-ts-008";

const candidate = createG5L5ProductVerticalSliceCandidate(COURSE_G05_L05_TS_008_CONFIG, Object.freeze({
  calibrationId: "g5-l5-p4-three-page-product-calibration-v1",
  complexityLane: "behavior-heavy",
  sourceBehaviorDecisionIds: Object.freeze(["legacy-shell-animation-transport-hooks","multi-section-choice-feedback-lifecycle"]),
  sourceUserEventPcodeFileCount: 34,
}), "multi-section");

export {COURSE_G05_L05_TS_008_SOURCE};
export const COURSE_G05_L05_TS_008_MOVIE = candidate.movie;
export const COURSE_G05_L05_TS_008_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_TS_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_TS_008_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_TS_008_RENDERER = candidate.Renderer;
export default candidate.module;
