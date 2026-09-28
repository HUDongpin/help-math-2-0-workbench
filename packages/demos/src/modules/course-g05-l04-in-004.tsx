"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_004_CONFIG,
  COURSE_G05_L04_IN_004_SOURCE,
} from "../timelines/course-g05-l04-in-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_004_CONFIG,
);

export {COURSE_G05_L04_IN_004_SOURCE};
export const COURSE_G05_L04_IN_004_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_004_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In004Frame = candidate.normalizeFrame;
export const getCourseG05L04In004FrameState = candidate.getFrameState;
export const buildCourseG05L04In004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In004Renderer = candidate.Renderer;

export default candidate.module;
