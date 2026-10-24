"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L04_IR_001_A662633D_CONFIG,
  COURSE_G05_L04_IR_001_A662633D_SOURCE,
} from "../timelines/course-g05-l04-ir-001-a662633d";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G05_L04_IR_001_A662633D_CONFIG,
);

export {COURSE_G05_L04_IR_001_A662633D_SOURCE};
export const COURSE_G05_L04_IR_001_A662633D_MOVIE = candidate.movie;
export const COURSE_G05_L04_IR_001_A662633D_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_IR_001_A662633D_SOURCE_CONTRACT =
  candidate.sourceContract;
export const COURSE_G05_L04_IR_001_A662633D_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L04Ir001A662633dFrame = candidate.normalizeFrame;
export const getCourseG05L04Ir001A662633dFrameState = candidate.getFrameState;
export const buildCourseG05L04Ir001A662633dCaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG05L04Ir001A662633dRenderer = candidate.Renderer;

export default candidate.module;
