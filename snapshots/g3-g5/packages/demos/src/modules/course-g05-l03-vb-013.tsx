"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_013_CONFIG,
  COURSE_G05_L03_VB_013_SOURCE,
} from "../timelines/course-g05-l03-vb-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_013_CONFIG);

export {COURSE_G05_L03_VB_013_SOURCE};
export const COURSE_G05_L03_VB_013_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_013_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_013_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb013Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb013FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb013CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb013Renderer = candidate.Renderer;

export default candidate.module;
