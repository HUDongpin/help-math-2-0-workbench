"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_IR_001_F1EC7620_CONFIG, COURSE_G03_L01_IR_001_F1EC7620_SOURCE} from "../timelines/course-g03-l01-ir-001-f1ec7620";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_IR_001_F1EC7620_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L01_IR_001_F1EC7620_SOURCE};
export const COURSE_G03_L01_IR_001_F1EC7620_MOVIE = candidate.movie;
export const COURSE_G03_L01_IR_001_F1EC7620_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_IR_001_F1EC7620_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_IR_001_F1EC7620_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01Ir001F1ec7620Frame = candidate.normalizeFrame;
export const getCourseG03L01Ir001F1ec7620FrameState = candidate.getFrameState;
export const buildCourseG03L01Ir001F1ec7620CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01Ir001F1ec7620Renderer = candidate.Renderer;
export default module;
