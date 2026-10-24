"use client";

import {createG5L5ProductVerticalSliceCandidate} from "../g5-l5-four-page-product-vertical-slice";
import {COURSE_G05_L05_VB_013_CONFIG, COURSE_G05_L05_VB_013_SOURCE} from "../timelines/course-g05-l05-vb-013";

const candidate = createG5L5ProductVerticalSliceCandidate(COURSE_G05_L05_VB_013_CONFIG, Object.freeze({
  calibrationId: "g5-l5-p4-three-page-product-calibration-v1",
  complexityLane: "interactive-understood",
  sourceBehaviorDecisionIds: Object.freeze(["legacy-shell-animation-transport-hooks","fixed-choice-feedback"]),
  sourceUserEventPcodeFileCount: 3,
}), "fixed-choice");

export {COURSE_G05_L05_VB_013_SOURCE};
export const COURSE_G05_L05_VB_013_MOVIE = candidate.movie;
export const COURSE_G05_L05_VB_013_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_VB_013_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_VB_013_RENDERER = candidate.Renderer;
export default candidate.module;
