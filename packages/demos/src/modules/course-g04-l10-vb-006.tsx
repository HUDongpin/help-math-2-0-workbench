"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_VB_006_CONFIG,
  COURSE_G04_L10_VB_006_SOURCE,
} from "../timelines/course-g04-l10-vb-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_VB_006_CONFIG,
);

export {COURSE_G04_L10_VB_006_SOURCE};
export const COURSE_G04_L10_VB_006_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb006Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb006FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb006Renderer = candidate.Renderer;

export default candidate.module;
