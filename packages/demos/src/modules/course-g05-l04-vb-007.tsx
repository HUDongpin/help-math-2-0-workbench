"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_VB_007_CONFIG,
  COURSE_G05_L04_VB_007_SOURCE,
} from "../timelines/course-g05-l04-vb-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_VB_007_CONFIG,
);

export {COURSE_G05_L04_VB_007_SOURCE};
export const COURSE_G05_L04_VB_007_MOVIE = candidate.movie;
export const COURSE_G05_L04_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Vb007Frame = candidate.normalizeFrame;
export const getCourseG05L04Vb007FrameState = candidate.getFrameState;
export const buildCourseG05L04Vb007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Vb007Renderer = candidate.Renderer;

export default candidate.module;
