"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_008_CONFIG,
  COURSE_G04_L10_IN_008_SOURCE,
} from "../timelines/course-g04-l10-in-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_008_CONFIG,
);

export {COURSE_G04_L10_IN_008_SOURCE};
export const COURSE_G04_L10_IN_008_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In008Frame = candidate.normalizeFrame;
export const getCourseG04L10In008FrameState = candidate.getFrameState;
export const buildCourseG04L10In008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In008Renderer = candidate.Renderer;

export default candidate.module;
