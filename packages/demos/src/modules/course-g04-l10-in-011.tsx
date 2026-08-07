"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_011_CONFIG,
  COURSE_G04_L10_IN_011_SOURCE,
} from "../timelines/course-g04-l10-in-011";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_011_CONFIG,
);

export {COURSE_G04_L10_IN_011_SOURCE};
export const COURSE_G04_L10_IN_011_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In011Frame = candidate.normalizeFrame;
export const getCourseG04L10In011FrameState = candidate.getFrameState;
export const buildCourseG04L10In011CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In011Renderer = candidate.Renderer;

export default candidate.module;
