"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L04_TS_007_CONFIG, COURSE_G03_L04_TS_007_SOURCE} from "../timelines/course-g03-l04-ts-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L04_TS_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L04_TS_007_SOURCE};
export const COURSE_G03_L04_TS_007_MOVIE = candidate.movie;
export const COURSE_G03_L04_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G03_L04_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L04_TS_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L04Ts007Frame = candidate.normalizeFrame;
export const getCourseG03L04Ts007FrameState = candidate.getFrameState;
export const buildCourseG03L04Ts007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L04Ts007Renderer = candidate.Renderer;
export default module;
