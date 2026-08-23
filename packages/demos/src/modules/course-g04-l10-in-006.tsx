"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_006_CONFIG,
  COURSE_G04_L10_IN_006_SOURCE,
} from "../timelines/course-g04-l10-in-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_006_CONFIG,
);

export {COURSE_G04_L10_IN_006_SOURCE};
export const COURSE_G04_L10_IN_006_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In006Frame = candidate.normalizeFrame;
export const getCourseG04L10In006FrameState = candidate.getFrameState;
export const buildCourseG04L10In006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In006Renderer = candidate.Renderer;

export default candidate.module;
