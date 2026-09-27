"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L07_IR_001_CONFIG, COURSE_G05_L07_IR_001_SOURCE} from "../timelines/course-g05-l07-ir-001";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L07_IR_001_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L07_IR_001_SOURCE};
export const COURSE_G05_L07_IR_001_MOVIE = candidate.movie;
export const COURSE_G05_L07_IR_001_RUNTIME = candidate.runtime;
export const COURSE_G05_L07_IR_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L07_IR_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L07Ir001Frame = candidate.normalizeFrame;
export const getCourseG05L07Ir001FrameState = candidate.getFrameState;
export const buildCourseG05L07Ir001CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L07Ir001Renderer = candidate.Renderer;
export default module;
