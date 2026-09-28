"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_TI_011_CONFIG, COURSE_G05_L02_TI_011_SOURCE} from "../timelines/course-g05-l02-ti-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_TI_011_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_TI_011_SOURCE};
export const COURSE_G05_L02_TI_011_MOVIE = candidate.movie;
export const COURSE_G05_L02_TI_011_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_TI_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_TI_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Ti011Frame = candidate.normalizeFrame;
export const getCourseG05L02Ti011FrameState = candidate.getFrameState;
export const buildCourseG05L02Ti011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Ti011Renderer = candidate.Renderer;
export default module;
