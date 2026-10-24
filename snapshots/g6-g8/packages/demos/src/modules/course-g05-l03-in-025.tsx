"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_025_CONFIG,
  COURSE_G05_L03_IN_025_SOURCE,
} from "../timelines/course-g05-l03-in-025";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_025_CONFIG);

export {COURSE_G05_L03_IN_025_SOURCE};
export const COURSE_G05_L03_IN_025_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_025_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_025_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_025_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In025Frame = candidate.normalizeFrame;
export const getCourseG05L03In025FrameState = candidate.getFrameState;
export const buildCourseG05L03In025CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In025Renderer = candidate.Renderer;

export default candidate.module;
