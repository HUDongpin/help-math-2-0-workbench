"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L03_IR_001_CONFIG, COURSE_G03_L03_IR_001_SOURCE} from "../timelines/course-g03-l03-ir-001";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L03_IR_001_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L03_IR_001_SOURCE};
export const COURSE_G03_L03_IR_001_MOVIE = candidate.movie;
export const COURSE_G03_L03_IR_001_RUNTIME = candidate.runtime;
export const COURSE_G03_L03_IR_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L03_IR_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L03Ir001Frame = candidate.normalizeFrame;
export const getCourseG03L03Ir001FrameState = candidate.getFrameState;
export const buildCourseG03L03Ir001CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L03Ir001Renderer = candidate.Renderer;
export default module;
