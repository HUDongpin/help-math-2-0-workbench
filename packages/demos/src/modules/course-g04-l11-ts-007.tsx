"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TS_007_CONFIG, COURSE_G04_L11_TS_007_SOURCE} from "../timelines/course-g04-l11-ts-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TS_007_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_TS_007_SOURCE};
export const COURSE_G04_L11_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L11_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TS_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Ts007Frame = candidate.normalizeFrame;
export const getCourseG04L11Ts007FrameState = candidate.getFrameState;
export const buildCourseG04L11Ts007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Ts007Renderer = candidate.Renderer;

export default privateCurrentJsModule;
