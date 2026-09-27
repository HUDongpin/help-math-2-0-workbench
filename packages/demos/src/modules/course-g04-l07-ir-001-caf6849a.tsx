"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L07_IR_001_CAF6849A_CONFIG, COURSE_G04_L07_IR_001_CAF6849A_SOURCE} from "../timelines/course-g04-l07-ir-001-caf6849a";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L07_IR_001_CAF6849A_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L07_IR_001_CAF6849A_SOURCE};
export const COURSE_G04_L07_IR_001_CAF6849A_MOVIE = candidate.movie;
export const COURSE_G04_L07_IR_001_CAF6849A_RUNTIME = candidate.runtime;
export const COURSE_G04_L07_IR_001_CAF6849A_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L07_IR_001_CAF6849A_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L07Ir001Caf6849aFrame = candidate.normalizeFrame;
export const getCourseG04L07Ir001Caf6849aFrameState = candidate.getFrameState;
export const buildCourseG04L07Ir001Caf6849aCaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L07Ir001Caf6849aRenderer = candidate.Renderer;
export default module;
