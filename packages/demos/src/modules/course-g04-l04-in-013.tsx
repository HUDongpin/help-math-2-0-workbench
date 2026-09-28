"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_013_CONFIG, COURSE_G04_L04_IN_013_SOURCE} from "../timelines/course-g04-l04-in-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_013_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_013_SOURCE};
export const COURSE_G04_L04_IN_013_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_013_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_013_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In013Frame = candidate.normalizeFrame;
export const getCourseG04L04In013FrameState = candidate.getFrameState;
export const buildCourseG04L04In013CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In013Renderer = candidate.Renderer;
export default module;
