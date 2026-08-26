"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IR_001_C420D2FF_CONFIG,
  COURSE_G05_L03_IR_001_C420D2FF_SOURCE,
} from "../timelines/course-g05-l03-ir-001-c420d2ff";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IR_001_C420D2FF_CONFIG);

export {COURSE_G05_L03_IR_001_C420D2FF_SOURCE};
export const COURSE_G05_L03_IR_001_C420D2FF_MOVIE = candidate.movie;
export const COURSE_G05_L03_IR_001_C420D2FF_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IR_001_C420D2FF_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IR_001_C420D2FF_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03Ir001C420d2ffFrame = candidate.normalizeFrame;
export const getCourseG05L03Ir001C420d2ffFrameState = candidate.getFrameState;
export const buildCourseG05L03Ir001C420d2ffCaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03Ir001C420d2ffRenderer = candidate.Renderer;

export default candidate.module;
