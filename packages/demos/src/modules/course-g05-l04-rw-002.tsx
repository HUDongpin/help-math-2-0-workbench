"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_RW_002_CONFIG,
  COURSE_G05_L04_RW_002_SOURCE,
} from "../timelines/course-g05-l04-rw-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_RW_002_CONFIG,
);

export {COURSE_G05_L04_RW_002_SOURCE};
export const COURSE_G05_L04_RW_002_MOVIE = candidate.movie;
export const COURSE_G05_L04_RW_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_RW_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_RW_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Rw002Frame = candidate.normalizeFrame;
export const getCourseG05L04Rw002FrameState = candidate.getFrameState;
export const buildCourseG05L04Rw002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Rw002Renderer = candidate.Renderer;

export default candidate.module;
