"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TS_008_CONFIG,
  COURSE_G04_L10_TS_008_SOURCE,
} from "../timelines/course-g04-l10-ts-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TS_008_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_TS_008_SOURCE};
export const COURSE_G04_L10_TS_008_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts008Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts008FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts008Renderer = candidate.Renderer;

export default privateCurrentJsModule;
