"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_008_CONFIG,
  COURSE_G05_L04_IN_008_SOURCE,
} from "../timelines/course-g05-l04-in-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_008_CONFIG,
);

export {COURSE_G05_L04_IN_008_SOURCE};
export const COURSE_G05_L04_IN_008_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_008_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In008Frame = candidate.normalizeFrame;
export const getCourseG05L04In008FrameState = candidate.getFrameState;
export const buildCourseG05L04In008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In008Renderer = candidate.Renderer;

export default candidate.module;
