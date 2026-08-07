"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_VB_004_CONFIG,
  COURSE_G04_L10_VB_004_SOURCE,
} from "../timelines/course-g04-l10-vb-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_VB_004_CONFIG,
);

export {COURSE_G04_L10_VB_004_SOURCE};
export const COURSE_G04_L10_VB_004_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb004Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb004FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb004Renderer = candidate.Renderer;

export default candidate.module;
