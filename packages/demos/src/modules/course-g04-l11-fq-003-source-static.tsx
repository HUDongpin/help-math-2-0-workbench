"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_FQ_003_CONFIG,
  COURSE_G04_L11_FQ_003_SOURCE,
} from "../timelines/course-g04-l11-fq-003";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_FQ_003_CONFIG,
);
export const COURSE_G04_L11_FQ_003_SOURCE_STATIC_CANDIDATE = candidate;

export {COURSE_G04_L11_FQ_003_SOURCE};
export const COURSE_G04_L11_FQ_003_MOVIE = candidate.movie;
export const COURSE_G04_L11_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_FQ_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_FQ_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Fq003Frame = candidate.normalizeFrame;
export const getCourseG04L11Fq003FrameState = candidate.getFrameState;
export const buildCourseG04L11Fq003CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L11Fq003Renderer = candidate.Renderer;

export default candidate.module;
