"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_IN_022_CONFIG, COURSE_G05_L01_IN_022_SOURCE} from "../timelines/course-g05-l01-in-022";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_IN_022_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_IN_022_SOURCE};
export const COURSE_G05_L01_IN_022_MOVIE = candidate.movie;
export const COURSE_G05_L01_IN_022_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_IN_022_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_IN_022_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01In022Frame = candidate.normalizeFrame;
export const getCourseG05L01In022FrameState = candidate.getFrameState;
export const buildCourseG05L01In022CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01In022Renderer = candidate.Renderer;
export default module;
