"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L04_VB_013_CONFIG, COURSE_G03_L04_VB_013_SOURCE} from "../timelines/course-g03-l04-vb-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L04_VB_013_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L04_VB_013_SOURCE};
export const COURSE_G03_L04_VB_013_MOVIE = candidate.movie;
export const COURSE_G03_L04_VB_013_RUNTIME = candidate.runtime;
export const COURSE_G03_L04_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L04_VB_013_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L04Vb013Frame = candidate.normalizeFrame;
export const getCourseG03L04Vb013FrameState = candidate.getFrameState;
export const buildCourseG03L04Vb013CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L04Vb013Renderer = candidate.Renderer;
export default module;
