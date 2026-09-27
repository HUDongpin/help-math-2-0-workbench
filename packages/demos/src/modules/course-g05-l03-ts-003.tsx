"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_TS_003_CONFIG,
  COURSE_G05_L03_TS_003_SOURCE,
} from "../timelines/course-g05-l03-ts-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_TS_003_CONFIG);

export {COURSE_G05_L03_TS_003_SOURCE};
export const COURSE_G05_L03_TS_003_MOVIE = candidate.movie;
export const COURSE_G05_L03_TS_003_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_TS_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_TS_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ts003Frame = candidate.normalizeFrame;
export const getCourseG05L03Ts003FrameState = candidate.getFrameState;
export const buildCourseG05L03Ts003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ts003Renderer = candidate.Renderer;

export default candidate.module;
