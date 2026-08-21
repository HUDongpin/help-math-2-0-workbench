"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TS_004_CONFIG,
  COURSE_G04_L10_TS_004_SOURCE,
} from "../timelines/course-g04-l10-ts-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TS_004_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_TS_004_SOURCE};
export const COURSE_G04_L10_TS_004_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts004Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts004FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts004Renderer = candidate.Renderer;

export default privateCurrentJsModule;
