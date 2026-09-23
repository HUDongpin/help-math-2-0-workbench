"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IN_018_CONFIG,
  COURSE_G05_L04_IN_018_SOURCE,
} from "../timelines/course-g05-l04-in-018";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IN_018_CONFIG,
);

export {COURSE_G05_L04_IN_018_SOURCE};
export const COURSE_G05_L04_IN_018_MOVIE = candidate.movie;
export const COURSE_G05_L04_IN_018_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IN_018_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_IN_018_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04In018Frame = candidate.normalizeFrame;
export const getCourseG05L04In018FrameState = candidate.getFrameState;
export const buildCourseG05L04In018CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04In018Renderer = candidate.Renderer;

export default candidate.module;
