"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_TS_006_CONFIG,
  COURSE_G05_L03_TS_006_SOURCE,
} from "../timelines/course-g05-l03-ts-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_TS_006_CONFIG);

export {COURSE_G05_L03_TS_006_SOURCE};
export const COURSE_G05_L03_TS_006_MOVIE = candidate.movie;
export const COURSE_G05_L03_TS_006_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_TS_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ts006Frame = candidate.normalizeFrame;
export const getCourseG05L03Ts006FrameState = candidate.getFrameState;
export const buildCourseG05L03Ts006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ts006Renderer = candidate.Renderer;

export default candidate.module;
