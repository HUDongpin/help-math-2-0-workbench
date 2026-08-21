"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_021_CONFIG,
  COURSE_G05_L03_IN_021_SOURCE,
} from "../timelines/course-g05-l03-in-021";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_021_CONFIG);

export {COURSE_G05_L03_IN_021_SOURCE};
export const COURSE_G05_L03_IN_021_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_021_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_021_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_021_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In021Frame = candidate.normalizeFrame;
export const getCourseG05L03In021FrameState = candidate.getFrameState;
export const buildCourseG05L03In021CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In021Renderer = candidate.Renderer;

export default candidate.module;
