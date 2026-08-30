"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_TS_006_CONFIG,
  COURSE_G05_L04_TS_006_SOURCE,
} from "../timelines/course-g05-l04-ts-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_TS_006_CONFIG,
);

export {COURSE_G05_L04_TS_006_SOURCE};
export const COURSE_G05_L04_TS_006_MOVIE = candidate.movie;
export const COURSE_G05_L04_TS_006_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_TS_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Ts006Frame = candidate.normalizeFrame;
export const getCourseG05L04Ts006FrameState = candidate.getFrameState;
export const buildCourseG05L04Ts006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Ts006Renderer = candidate.Renderer;

export default candidate.module;
