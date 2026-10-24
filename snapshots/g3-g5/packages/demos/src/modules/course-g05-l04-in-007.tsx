"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_007_CONFIG,
  COURSE_G05_L04_IN_007_SOURCE,
} from "../timelines/course-g05-l04-in-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_007_CONFIG,
);

export {COURSE_G05_L04_IN_007_SOURCE};
export const COURSE_G05_L04_IN_007_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In007Frame = candidate.normalizeFrame;
export const getCourseG05L04In007FrameState = candidate.getFrameState;
export const buildCourseG05L04In007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In007Renderer = candidate.Renderer;

export default candidate.module;
