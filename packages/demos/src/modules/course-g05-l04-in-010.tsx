"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_010_CONFIG,
  COURSE_G05_L04_IN_010_SOURCE,
} from "../timelines/course-g05-l04-in-010";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_010_CONFIG,
);

export {COURSE_G05_L04_IN_010_SOURCE};
export const COURSE_G05_L04_IN_010_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_010_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In010Frame = candidate.normalizeFrame;
export const getCourseG05L04In010FrameState = candidate.getFrameState;
export const buildCourseG05L04In010CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In010Renderer = candidate.Renderer;

export default candidate.module;
