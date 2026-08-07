"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_FQ_001_CONFIG,
  COURSE_G04_L03_FQ_001_SOURCE,
} from "../timelines/course-g04-l03-fq-001";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_FQ_001_CONFIG,
);

export {COURSE_G04_L03_FQ_001_SOURCE};
export const COURSE_G04_L03_FQ_001_MOVIE = candidate.movie;
export const COURSE_G04_L03_FQ_001_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_FQ_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L03_FQ_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Fq001Frame = candidate.normalizeFrame;
export const getCourseG04L03Fq001FrameState = candidate.getFrameState;
export const buildCourseG04L03Fq001CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Fq001Renderer = candidate.Renderer;

export default candidate.module;
