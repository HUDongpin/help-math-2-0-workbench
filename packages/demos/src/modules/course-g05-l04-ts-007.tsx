"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_TS_007_CONFIG,
  COURSE_G05_L04_TS_007_SOURCE,
} from "../timelines/course-g05-l04-ts-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_TS_007_CONFIG,
);

export {COURSE_G05_L04_TS_007_SOURCE};
export const COURSE_G05_L04_TS_007_MOVIE = candidate.movie;
export const COURSE_G05_L04_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_TS_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Ts007Frame = candidate.normalizeFrame;
export const getCourseG05L04Ts007FrameState = candidate.getFrameState;
export const buildCourseG05L04Ts007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Ts007Renderer = candidate.Renderer;

export default candidate.module;
