"use client";

import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";
import {COURSE_G05_L05_IR_001_664AB764_CONFIG, COURSE_G05_L05_IR_001_664AB764_SOURCE} from "../timelines/course-g05-l05-ir-001-664ab764";

const candidate = createG5L5PrivateCurrentJsCandidate(COURSE_G05_L05_IR_001_664AB764_CONFIG, Object.freeze({
  calibrationId: "g5-l5-page-only-current-js-56-v1",
  complexityLane: "low",
  sourceBehaviorDecisionIds: Object.freeze(["randomized-source-branch"]),
  sourceUserEventPcodeFileCount: 0,
}));

export {COURSE_G05_L05_IR_001_664AB764_SOURCE};
export const COURSE_G05_L05_IR_001_664AB764_MOVIE = candidate.movie;
export const COURSE_G05_L05_IR_001_664AB764_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_IR_001_664AB764_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_IR_001_664AB764_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_IR_001_664AB764_RENDERER = candidate.Renderer;
export default candidate.module;
