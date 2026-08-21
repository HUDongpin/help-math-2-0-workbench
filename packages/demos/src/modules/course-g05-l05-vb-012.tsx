"use client";

import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";
import {COURSE_G05_L05_VB_012_CONFIG, COURSE_G05_L05_VB_012_SOURCE} from "../timelines/course-g05-l05-vb-012";

const candidate = createG5L5PrivateCurrentJsCandidate(COURSE_G05_L05_VB_012_CONFIG, Object.freeze({
  calibrationId: "g5-l5-page-only-current-js-56-v1",
  complexityLane: "interactive-understood",
  sourceBehaviorDecisionIds: Object.freeze(["legacy-shell-animation-transport-hooks","fixed-choice-feedback"]),
  sourceUserEventPcodeFileCount: 3,
}));

export {COURSE_G05_L05_VB_012_SOURCE};
export const COURSE_G05_L05_VB_012_MOVIE = candidate.movie;
export const COURSE_G05_L05_VB_012_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_VB_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_VB_012_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_VB_012_RENDERER = candidate.Renderer;
export default candidate.module;
