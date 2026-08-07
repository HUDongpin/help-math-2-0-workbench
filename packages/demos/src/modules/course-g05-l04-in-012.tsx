"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_012_CONFIG,
  COURSE_G05_L04_IN_012_SOURCE,
} from "../timelines/course-g05-l04-in-012";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_012_CONFIG,
);

export {COURSE_G05_L04_IN_012_SOURCE};
export const COURSE_G05_L04_IN_012_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_012_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In012Frame = candidate.normalizeFrame;
export const getCourseG05L04In012FrameState = candidate.getFrameState;
export const buildCourseG05L04In012CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In012Renderer = candidate.Renderer;

export default candidate.module;
