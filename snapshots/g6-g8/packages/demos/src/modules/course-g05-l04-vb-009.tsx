"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_VB_009_CONFIG,
  COURSE_G05_L04_VB_009_SOURCE,
} from "../timelines/course-g05-l04-vb-009";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_VB_009_CONFIG,
);

export {COURSE_G05_L04_VB_009_SOURCE};
export const COURSE_G05_L04_VB_009_MOVIE = candidate.movie;
export const COURSE_G05_L04_VB_009_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_VB_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_VB_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Vb009Frame = candidate.normalizeFrame;
export const getCourseG05L04Vb009FrameState = candidate.getFrameState;
export const buildCourseG05L04Vb009CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Vb009Renderer = candidate.Renderer;

export default candidate.module;
