"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_TI_003_CONFIG, COURSE_G05_L13_TI_003_SOURCE} from "../timelines/course-g05-l13-ti-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_TI_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_TI_003_SOURCE};
export const COURSE_G05_L13_TI_003_MOVIE = candidate.movie;
export const COURSE_G05_L13_TI_003_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_TI_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_TI_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13Ti003Frame = candidate.normalizeFrame;
export const getCourseG05L13Ti003FrameState = candidate.getFrameState;
export const buildCourseG05L13Ti003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13Ti003Renderer = candidate.Renderer;
export default module;
