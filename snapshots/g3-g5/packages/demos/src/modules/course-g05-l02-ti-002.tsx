"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_TI_002_CONFIG, COURSE_G05_L02_TI_002_SOURCE} from "../timelines/course-g05-l02-ti-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_TI_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_TI_002_SOURCE};
export const COURSE_G05_L02_TI_002_MOVIE = candidate.movie;
export const COURSE_G05_L02_TI_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_TI_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Ti002Frame = candidate.normalizeFrame;
export const getCourseG05L02Ti002FrameState = candidate.getFrameState;
export const buildCourseG05L02Ti002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Ti002Renderer = candidate.Renderer;
export default module;
