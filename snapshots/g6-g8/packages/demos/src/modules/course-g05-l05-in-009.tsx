"use client";

import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";
import {COURSE_G05_L05_IN_009_CONFIG, COURSE_G05_L05_IN_009_SOURCE} from "../timelines/course-g05-l05-in-009";

const candidate = createG5L5PrivateCurrentJsCandidate(COURSE_G05_L05_IN_009_CONFIG, Object.freeze({
  calibrationId: "g5-l5-page-only-current-js-56-v1",
  complexityLane: "behavior-heavy",
  sourceBehaviorDecisionIds: Object.freeze(["legacy-shell-animation-transport-hooks","sequence-choice-feedback"]),
  sourceUserEventPcodeFileCount: 12,
}));

export {COURSE_G05_L05_IN_009_SOURCE};
export const COURSE_G05_L05_IN_009_MOVIE = candidate.movie;
export const COURSE_G05_L05_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G05_L05_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L05_IN_009_SCENARIOS = candidate.scenarios;
export const COURSE_G05_L05_IN_009_RENDERER = candidate.Renderer;
export default candidate.module;
