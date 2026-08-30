"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_020_CONFIG,
  COURSE_G05_L04_IN_020_SOURCE,
} from "../timelines/course-g05-l04-in-020";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_020_CONFIG,
);

export {COURSE_G05_L04_IN_020_SOURCE};
export const COURSE_G05_L04_IN_020_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_020_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_020_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In020Frame = candidate.normalizeFrame;
export const getCourseG05L04In020FrameState = candidate.getFrameState;
export const buildCourseG05L04In020CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In020Renderer = candidate.Renderer;

export default candidate.module;
