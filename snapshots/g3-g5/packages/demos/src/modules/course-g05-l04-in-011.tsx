"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_011_CONFIG,
  COURSE_G05_L04_IN_011_SOURCE,
} from "../timelines/course-g05-l04-in-011";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_011_CONFIG,
);

export {COURSE_G05_L04_IN_011_SOURCE};
export const COURSE_G05_L04_IN_011_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In011Frame = candidate.normalizeFrame;
export const getCourseG05L04In011FrameState = candidate.getFrameState;
export const buildCourseG05L04In011CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In011Renderer = candidate.Renderer;

export default candidate.module;
