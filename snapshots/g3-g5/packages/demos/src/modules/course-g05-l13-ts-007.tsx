"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_TS_007_CONFIG, COURSE_G05_L13_TS_007_SOURCE} from "../timelines/course-g05-l13-ts-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_TS_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_TS_007_SOURCE};
export const COURSE_G05_L13_TS_007_MOVIE = candidate.movie;
export const COURSE_G05_L13_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_TS_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13Ts007Frame = candidate.normalizeFrame;
export const getCourseG05L13Ts007FrameState = candidate.getFrameState;
export const buildCourseG05L13Ts007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13Ts007Renderer = candidate.Renderer;
export default module;
