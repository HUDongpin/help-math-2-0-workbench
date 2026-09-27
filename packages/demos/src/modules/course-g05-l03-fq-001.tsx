"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_FQ_001_CONFIG,
  COURSE_G05_L03_FQ_001_SOURCE,
} from "../timelines/course-g05-l03-fq-001";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_FQ_001_CONFIG);

export {COURSE_G05_L03_FQ_001_SOURCE};
export const COURSE_G05_L03_FQ_001_MOVIE = candidate.movie;
export const COURSE_G05_L03_FQ_001_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_FQ_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_FQ_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Fq001Frame = candidate.normalizeFrame;
export const getCourseG05L03Fq001FrameState = candidate.getFrameState;
export const buildCourseG05L03Fq001CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Fq001Renderer = candidate.Renderer;

export default candidate.module;
