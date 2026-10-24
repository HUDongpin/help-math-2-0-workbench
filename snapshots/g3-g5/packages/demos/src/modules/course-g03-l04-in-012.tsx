"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L04_IN_012_CONFIG, COURSE_G03_L04_IN_012_SOURCE} from "../timelines/course-g03-l04-in-012";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L04_IN_012_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L04_IN_012_SOURCE};
export const COURSE_G03_L04_IN_012_MOVIE = candidate.movie;
export const COURSE_G03_L04_IN_012_RUNTIME = candidate.runtime;
export const COURSE_G03_L04_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L04_IN_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L04In012Frame = candidate.normalizeFrame;
export const getCourseG03L04In012FrameState = candidate.getFrameState;
export const buildCourseG03L04In012CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L04In012Renderer = candidate.Renderer;
export default module;
