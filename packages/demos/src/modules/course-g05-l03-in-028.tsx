"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_028_CONFIG,
  COURSE_G05_L03_IN_028_SOURCE,
} from "../timelines/course-g05-l03-in-028";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_028_CONFIG);

export {COURSE_G05_L03_IN_028_SOURCE};
export const COURSE_G05_L03_IN_028_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_028_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_028_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_028_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In028Frame = candidate.normalizeFrame;
export const getCourseG05L03In028FrameState = candidate.getFrameState;
export const buildCourseG05L03In028CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In028Renderer = candidate.Renderer;

export default candidate.module;
