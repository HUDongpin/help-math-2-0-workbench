"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IR_001_CONFIG, COURSE_G04_L11_IR_001_SOURCE} from "../timelines/course-g04-l11-ir-001";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IR_001_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_IR_001_SOURCE};
export const COURSE_G04_L11_IR_001_MOVIE = candidate.movie;
export const COURSE_G04_L11_IR_001_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_IR_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IR_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Ir001Frame = candidate.normalizeFrame;
export const getCourseG04L11Ir001FrameState = candidate.getFrameState;
export const buildCourseG04L11Ir001CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Ir001Renderer = candidate.Renderer;

export default privateCurrentJsModule;
