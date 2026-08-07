"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_VB_005_CONFIG,
  COURSE_G04_L10_VB_005_SOURCE,
} from "../timelines/course-g04-l10-vb-005";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_VB_005_CONFIG,
);

export {COURSE_G04_L10_VB_005_SOURCE};
export const COURSE_G04_L10_VB_005_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb005Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb005FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb005CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb005Renderer = candidate.Renderer;

export default candidate.module;
