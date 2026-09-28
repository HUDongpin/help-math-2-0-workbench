"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IR_001_4CFDC375_CONFIG, COURSE_G04_L04_IR_001_4CFDC375_SOURCE} from "../timelines/course-g04-l04-ir-001-4cfdc375";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IR_001_4CFDC375_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IR_001_4CFDC375_SOURCE};
export const COURSE_G04_L04_IR_001_4CFDC375_MOVIE = candidate.movie;
export const COURSE_G04_L04_IR_001_4CFDC375_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IR_001_4CFDC375_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IR_001_4CFDC375_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04Ir0014cfdc375Frame = candidate.normalizeFrame;
export const getCourseG04L04Ir0014cfdc375FrameState = candidate.getFrameState;
export const buildCourseG04L04Ir0014cfdc375CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04Ir0014cfdc375Renderer = candidate.Renderer;
export default module;
