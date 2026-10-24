"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_007_CONFIG,
  COURSE_G05_L03_VB_007_SOURCE,
} from "../timelines/course-g05-l03-vb-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_007_CONFIG);

export {COURSE_G05_L03_VB_007_SOURCE};
export const COURSE_G05_L03_VB_007_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb007Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb007FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb007Renderer = candidate.Renderer;

export default candidate.module;
