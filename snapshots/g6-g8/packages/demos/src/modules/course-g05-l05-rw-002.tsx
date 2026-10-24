"use client";

import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";
import {COURSE_G05_L05_RW_002_CONFIG, COURSE_G05_L05_RW_002_SOURCE} from "../timelines/course-g05-l05-rw-002";

const candidate = createG5L5PrivateCurrentJsCandidate(COURSE_G05_L05_RW_002_CONFIG, Object.freeze({
  calibrationId: "g5-l5-page-only-current-js-56-v1",
  complexityLane: "low",
  sourceBehaviorDecisionIds: Object.freeze([]),
  sourceUserEventPcodeFileCount: 0,
}));

export {COURSE_G05_L05_RW_002_SOURCE};
export const COURSE_G05_L05_RW_002_MOVIE = candidate.movie;
export const COURSE_G05_L05_RW_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_RW_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_RW_002_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_RW_002_RENDERER = candidate.Renderer;
export default candidate.module;
