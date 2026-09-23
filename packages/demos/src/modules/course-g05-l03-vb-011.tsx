"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_VB_011_CONFIG,
  COURSE_G05_L03_VB_011_SOURCE,
} from "../timelines/course-g05-l03-vb-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_VB_011_CONFIG);

export {COURSE_G05_L03_VB_011_SOURCE};
export const COURSE_G05_L03_VB_011_MOVIE = candidate.movie;
export const COURSE_G05_L03_VB_011_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_VB_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_VB_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Vb011Frame = candidate.normalizeFrame;
export const getCourseG05L03Vb011FrameState = candidate.getFrameState;
export const buildCourseG05L03Vb011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Vb011Renderer = candidate.Renderer;

export default candidate.module;
