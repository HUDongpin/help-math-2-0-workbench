"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_016_CONFIG,
  COURSE_G04_L10_IN_016_SOURCE,
} from "../timelines/course-g04-l10-in-016";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_016_CONFIG,
);

export {COURSE_G04_L10_IN_016_SOURCE};
export const COURSE_G04_L10_IN_016_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_016_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_016_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In016Frame = candidate.normalizeFrame;
export const getCourseG04L10In016FrameState = candidate.getFrameState;
export const buildCourseG04L10In016CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In016Renderer = candidate.Renderer;

export default candidate.module;
