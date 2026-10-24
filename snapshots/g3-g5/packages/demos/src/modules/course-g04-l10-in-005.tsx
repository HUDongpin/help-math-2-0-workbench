"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_005_CONFIG,
  COURSE_G04_L10_IN_005_SOURCE,
} from "../timelines/course-g04-l10-in-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_005_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_IN_005_SOURCE};
export const COURSE_G04_L10_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In005Frame = candidate.normalizeFrame;
export const getCourseG04L10In005FrameState = candidate.getFrameState;
export const buildCourseG04L10In005CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In005Renderer = candidate.Renderer;

export default privateCurrentJsModule;
