"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_TI_012_CONFIG, COURSE_G05_L02_TI_012_SOURCE} from "../timelines/course-g05-l02-ti-012";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_TI_012_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_TI_012_SOURCE};
export const COURSE_G05_L02_TI_012_MOVIE = candidate.movie;
export const COURSE_G05_L02_TI_012_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_TI_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_TI_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Ti012Frame = candidate.normalizeFrame;
export const getCourseG05L02Ti012FrameState = candidate.getFrameState;
export const buildCourseG05L02Ti012CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Ti012Renderer = candidate.Renderer;
export default module;
