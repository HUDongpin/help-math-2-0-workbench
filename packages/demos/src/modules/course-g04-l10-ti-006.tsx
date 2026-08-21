"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TI_006_CONFIG,
  COURSE_G04_L10_TI_006_SOURCE,
} from "../timelines/course-g04-l10-ti-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TI_006_CONFIG,
);
const privateCurrentJsModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
});

export {COURSE_G04_L10_TI_006_SOURCE};
export const COURSE_G04_L10_TI_006_MOVIE = candidate.movie;
export const COURSE_G04_L10_TI_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TI_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TI_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ti006Frame = candidate.normalizeFrame;
export const getCourseG04L10Ti006FrameState = candidate.getFrameState;
export const buildCourseG04L10Ti006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ti006Renderer = candidate.Renderer;

export default privateCurrentJsModule;
