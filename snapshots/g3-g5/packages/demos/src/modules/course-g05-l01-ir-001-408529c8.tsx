"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_IR_001_408529C8_CONFIG, COURSE_G05_L01_IR_001_408529C8_SOURCE} from "../timelines/course-g05-l01-ir-001-408529c8";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_IR_001_408529C8_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_IR_001_408529C8_SOURCE};
export const COURSE_G05_L01_IR_001_408529C8_MOVIE = candidate.movie;
export const COURSE_G05_L01_IR_001_408529C8_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_IR_001_408529C8_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_IR_001_408529C8_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01Ir001408529c8Frame = candidate.normalizeFrame;
export const getCourseG05L01Ir001408529c8FrameState = candidate.getFrameState;
export const buildCourseG05L01Ir001408529c8CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01Ir001408529c8Renderer = candidate.Renderer;
export default module;
