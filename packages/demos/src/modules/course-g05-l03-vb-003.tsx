"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_003_CONFIG,
  COURSE_G05_L03_VB_003_SOURCE,
} from "../timelines/course-g05-l03-vb-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_003_CONFIG);

export {COURSE_G05_L03_VB_003_SOURCE};
export const COURSE_G05_L03_VB_003_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_003_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb003Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb003FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb003Renderer = candidate.Renderer;

export default candidate.module;
