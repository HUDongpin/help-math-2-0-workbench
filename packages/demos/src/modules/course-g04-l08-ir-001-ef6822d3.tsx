"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_IR_001_EF6822D3_CONFIG, COURSE_G04_L08_IR_001_EF6822D3_SOURCE} from "../timelines/course-g04-l08-ir-001-ef6822d3";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_IR_001_EF6822D3_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_IR_001_EF6822D3_SOURCE};
export const COURSE_G04_L08_IR_001_EF6822D3_MOVIE = candidate.movie;
export const COURSE_G04_L08_IR_001_EF6822D3_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_IR_001_EF6822D3_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_IR_001_EF6822D3_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Ir001Ef6822d3Frame = candidate.normalizeFrame;
export const getCourseG04L08Ir001Ef6822d3FrameState = candidate.getFrameState;
export const buildCourseG04L08Ir001Ef6822d3CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Ir001Ef6822d3Renderer = candidate.Renderer;
export default module;
