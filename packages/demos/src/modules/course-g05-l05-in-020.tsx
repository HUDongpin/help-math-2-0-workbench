"use client";

import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";
import {COURSE_G05_L05_IN_020_CONFIG, COURSE_G05_L05_IN_020_SOURCE} from "../timelines/course-g05-l05-in-020";

const candidate = createG5L5PrivateCurrentJsCandidate(COURSE_G05_L05_IN_020_CONFIG, Object.freeze({
  calibrationId: "g5-l5-page-only-current-js-56-v1",
  complexityLane: "behavior-heavy",
  sourceBehaviorDecisionIds: Object.freeze(["drag-drop-feedback-opcode","randomized-source-branch"]),
  sourceUserEventPcodeFileCount: 28,
}));

export {COURSE_G05_L05_IN_020_SOURCE};
export const COURSE_G05_L05_IN_020_MOVIE = candidate.movie;
export const COURSE_G05_L05_IN_020_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_IN_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_IN_020_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_IN_020_RENDERER = candidate.Renderer;
export default candidate.module;
