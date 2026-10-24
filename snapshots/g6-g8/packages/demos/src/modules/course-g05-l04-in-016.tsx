"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_016_CONFIG,
  COURSE_G05_L04_IN_016_SOURCE,
} from "../timelines/course-g05-l04-in-016";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_016_CONFIG,
);

export {COURSE_G05_L04_IN_016_SOURCE};
export const COURSE_G05_L04_IN_016_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_016_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_016_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In016Frame = candidate.normalizeFrame;
export const getCourseG05L04In016FrameState = candidate.getFrameState;
export const buildCourseG05L04In016CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In016Renderer = candidate.Renderer;

export default candidate.module;
