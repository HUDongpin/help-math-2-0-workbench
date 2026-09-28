"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_GS_002_CONFIG,
  COURSE_G04_L10_GS_002_SOURCE,
} from "../timelines/course-g04-l10-gs-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_GS_002_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_GS_002_SOURCE};
export const COURSE_G04_L10_GS_002_MOVIE = candidate.movie;
export const COURSE_G04_L10_GS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_GS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Gs002Frame = candidate.normalizeFrame;
export const getCourseG04L10Gs002FrameState = candidate.getFrameState;
export const buildCourseG04L10Gs002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Gs002Renderer = candidate.Renderer;

export default privateCurrentJsModule;
