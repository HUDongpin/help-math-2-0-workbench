"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_022_CONFIG,
  COURSE_G05_L04_IN_022_SOURCE,
} from "../timelines/course-g05-l04-in-022";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_022_CONFIG,
);

export {COURSE_G05_L04_IN_022_SOURCE};
export const COURSE_G05_L04_IN_022_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_022_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_022_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_022_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In022Frame = candidate.normalizeFrame;
export const getCourseG05L04In022FrameState = candidate.getFrameState;
export const buildCourseG05L04In022CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In022Renderer = candidate.Renderer;

export default candidate.module;
