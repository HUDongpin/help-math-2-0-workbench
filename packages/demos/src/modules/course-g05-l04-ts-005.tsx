"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_TS_005_CONFIG,
  COURSE_G05_L04_TS_005_SOURCE,
} from "../timelines/course-g05-l04-ts-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_TS_005_CONFIG,
);

export {COURSE_G05_L04_TS_005_SOURCE};
export const COURSE_G05_L04_TS_005_MOVIE = candidate.movie;
export const COURSE_G05_L04_TS_005_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_TS_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_TS_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Ts005Frame = candidate.normalizeFrame;
export const getCourseG05L04Ts005FrameState = candidate.getFrameState;
export const buildCourseG05L04Ts005CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Ts005Renderer = candidate.Renderer;

export default candidate.module;
