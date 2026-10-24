"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IN_014_CONFIG,
  COURSE_G04_L10_IN_014_SOURCE,
} from "../timelines/course-g04-l10-in-014";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IN_014_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_IN_014_SOURCE};
export const COURSE_G04_L10_IN_014_MOVIE = candidate.movie;
export const COURSE_G04_L10_IN_014_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IN_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IN_014_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10In014Frame = candidate.normalizeFrame;
export const getCourseG04L10In014FrameState = candidate.getFrameState;
export const buildCourseG04L10In014CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10In014Renderer = candidate.Renderer;

export default privateCurrentJsModule;
