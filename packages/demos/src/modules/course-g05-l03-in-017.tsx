"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_017_CONFIG,
  COURSE_G05_L03_IN_017_SOURCE,
} from "../timelines/course-g05-l03-in-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_017_CONFIG);

export {COURSE_G05_L03_IN_017_SOURCE};
export const COURSE_G05_L03_IN_017_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_017_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_017_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In017Frame = candidate.normalizeFrame;
export const getCourseG05L03In017FrameState = candidate.getFrameState;
export const buildCourseG05L03In017CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In017Renderer = candidate.Renderer;

export default candidate.module;
