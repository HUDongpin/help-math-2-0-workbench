"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L08_TI_002_CONFIG, COURSE_G05_L08_TI_002_SOURCE} from "../timelines/course-g05-l08-ti-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L08_TI_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L08_TI_002_SOURCE};
export const COURSE_G05_L08_TI_002_MOVIE = candidate.movie;
export const COURSE_G05_L08_TI_002_RUNTIME = candidate.runtime;
export const COURSE_G05_L08_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L08_TI_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L08Ti002Frame = candidate.normalizeFrame;
export const getCourseG05L08Ti002FrameState = candidate.getFrameState;
export const buildCourseG05L08Ti002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L08Ti002Renderer = candidate.Renderer;
export default module;
