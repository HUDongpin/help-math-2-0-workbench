"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_FQ_002_CONFIG,
  COURSE_G04_L10_FQ_002_SOURCE,
} from "../timelines/course-g04-l10-fq-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_FQ_002_CONFIG,
);

export {COURSE_G04_L10_FQ_002_SOURCE};
export const COURSE_G04_L10_FQ_002_MOVIE = candidate.movie;
export const COURSE_G04_L10_FQ_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_FQ_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_FQ_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Fq002Frame = candidate.normalizeFrame;
export const getCourseG04L10Fq002FrameState = candidate.getFrameState;
export const buildCourseG04L10Fq002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Fq002Renderer = candidate.Renderer;

export default candidate.module;
