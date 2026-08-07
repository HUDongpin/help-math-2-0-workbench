"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_VB_008_CONFIG,
  COURSE_G04_L10_VB_008_SOURCE,
} from "../timelines/course-g04-l10-vb-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_VB_008_CONFIG,
);

export {COURSE_G04_L10_VB_008_SOURCE};
export const COURSE_G04_L10_VB_008_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb008Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb008FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb008Renderer = candidate.Renderer;

export default candidate.module;
