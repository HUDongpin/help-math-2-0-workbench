"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TS_007_CONFIG,
  COURSE_G04_L10_TS_007_SOURCE,
} from "../timelines/course-g04-l10-ts-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TS_007_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_TS_007_SOURCE};
export const COURSE_G04_L10_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts007Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts007FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts007Renderer = candidate.Renderer;

export default privateCurrentJsModule;
