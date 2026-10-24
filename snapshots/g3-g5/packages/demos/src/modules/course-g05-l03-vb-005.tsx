"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_005_CONFIG,
  COURSE_G05_L03_VB_005_SOURCE,
} from "../timelines/course-g05-l03-vb-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_005_CONFIG);

export {COURSE_G05_L03_VB_005_SOURCE};
export const COURSE_G05_L03_VB_005_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_005_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb005Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb005FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb005Renderer = candidate.Renderer;

export default candidate.module;
