"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_TS_006_CONFIG,
  COURSE_G04_L11_TS_006_SOURCE,
} from "../timelines/course-g04-l11-ts-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_TS_006_CONFIG,
);

export {COURSE_G04_L11_TS_006_SOURCE};
export const COURSE_G04_L11_TS_006_MOVIE = candidate.movie;
export const COURSE_G04_L11_TS_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TS_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Ts006Frame = candidate.normalizeFrame;
export const getCourseG04L11Ts006FrameState = candidate.getFrameState;
export const buildCourseG04L11Ts006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L11Ts006Renderer = candidate.Renderer;

export default candidate.module;
