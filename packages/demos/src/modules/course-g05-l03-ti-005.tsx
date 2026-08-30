"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_TI_005_CONFIG,
  COURSE_G05_L03_TI_005_SOURCE,
} from "../timelines/course-g05-l03-ti-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_TI_005_CONFIG);

export {COURSE_G05_L03_TI_005_SOURCE};
export const COURSE_G05_L03_TI_005_MOVIE = candidate.movie;
export const COURSE_G05_L03_TI_005_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_TI_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_TI_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ti005Frame = candidate.normalizeFrame;
export const getCourseG05L03Ti005FrameState = candidate.getFrameState;
export const buildCourseG05L03Ti005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ti005Renderer = candidate.Renderer;

export default candidate.module;
