"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_IR_001_BD24965E_CONFIG, COURSE_G05_L02_IR_001_BD24965E_SOURCE} from "../timelines/course-g05-l02-ir-001-bd24965e";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_IR_001_BD24965E_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_IR_001_BD24965E_SOURCE};
export const COURSE_G05_L02_IR_001_BD24965E_MOVIE = candidate.movie;
export const COURSE_G05_L02_IR_001_BD24965E_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_IR_001_BD24965E_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_IR_001_BD24965E_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Ir001Bd24965eFrame = candidate.normalizeFrame;
export const getCourseG05L02Ir001Bd24965eFrameState = candidate.getFrameState;
export const buildCourseG05L02Ir001Bd24965eCaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Ir001Bd24965eRenderer = candidate.Renderer;
export default module;
