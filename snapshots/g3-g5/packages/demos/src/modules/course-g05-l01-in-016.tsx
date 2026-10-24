"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_IN_016_CONFIG, COURSE_G05_L01_IN_016_SOURCE} from "../timelines/course-g05-l01-in-016";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_IN_016_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_IN_016_SOURCE};
export const COURSE_G05_L01_IN_016_MOVIE = candidate.movie;
export const COURSE_G05_L01_IN_016_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_IN_016_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01In016Frame = candidate.normalizeFrame;
export const getCourseG05L01In016FrameState = candidate.getFrameState;
export const buildCourseG05L01In016CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01In016Renderer = candidate.Renderer;
export default module;
