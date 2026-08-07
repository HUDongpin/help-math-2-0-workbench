"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TS_002_CONFIG,
  COURSE_G04_L10_TS_002_SOURCE,
} from "../timelines/course-g04-l10-ts-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TS_002_CONFIG,
);

export {COURSE_G04_L10_TS_002_SOURCE};
export const COURSE_G04_L10_TS_002_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts002Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts002FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts002Renderer = candidate.Renderer;

export default candidate.module;
