"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_TI_007_CONFIG,
  COURSE_G05_L03_TI_007_SOURCE,
} from "../timelines/course-g05-l03-ti-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_TI_007_CONFIG);

export {COURSE_G05_L03_TI_007_SOURCE};
export const COURSE_G05_L03_TI_007_MOVIE = candidate.movie;
export const COURSE_G05_L03_TI_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_TI_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_TI_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ti007Frame = candidate.normalizeFrame;
export const getCourseG05L03Ti007FrameState = candidate.getFrameState;
export const buildCourseG05L03Ti007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ti007Renderer = candidate.Renderer;

export default candidate.module;
