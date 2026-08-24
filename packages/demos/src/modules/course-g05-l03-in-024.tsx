"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_024_CONFIG,
  COURSE_G05_L03_IN_024_SOURCE,
} from "../timelines/course-g05-l03-in-024";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_024_CONFIG);

export {COURSE_G05_L03_IN_024_SOURCE};
export const COURSE_G05_L03_IN_024_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_024_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_024_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_024_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In024Frame = candidate.normalizeFrame;
export const getCourseG05L03In024FrameState = candidate.getFrameState;
export const buildCourseG05L03In024CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In024Renderer = candidate.Renderer;

export default candidate.module;
