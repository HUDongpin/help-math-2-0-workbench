"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_TS_002_CONFIG,
  COURSE_G05_L03_TS_002_SOURCE,
} from "../timelines/course-g05-l03-ts-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_TS_002_CONFIG);

export {COURSE_G05_L03_TS_002_SOURCE};
export const COURSE_G05_L03_TS_002_MOVIE = candidate.movie;
export const COURSE_G05_L03_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_TS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ts002Frame = candidate.normalizeFrame;
export const getCourseG05L03Ts002FrameState = candidate.getFrameState;
export const buildCourseG05L03Ts002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ts002Renderer = candidate.Renderer;

export default candidate.module;
