"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_009_CONFIG,
  COURSE_G04_L10_IN_009_SOURCE,
} from "../timelines/course-g04-l10-in-009";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_009_CONFIG,
);

export {COURSE_G04_L10_IN_009_SOURCE};
export const COURSE_G04_L10_IN_009_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In009Frame = candidate.normalizeFrame;
export const getCourseG04L10In009FrameState = candidate.getFrameState;
export const buildCourseG04L10In009CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In009Renderer = candidate.Renderer;

export default candidate.module;
