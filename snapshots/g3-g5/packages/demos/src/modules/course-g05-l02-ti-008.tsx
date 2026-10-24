"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_TI_008_CONFIG, COURSE_G05_L02_TI_008_SOURCE} from "../timelines/course-g05-l02-ti-008";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_TI_008_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_TI_008_SOURCE};
export const COURSE_G05_L02_TI_008_MOVIE = candidate.movie;
export const COURSE_G05_L02_TI_008_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_TI_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_TI_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Ti008Frame = candidate.normalizeFrame;
export const getCourseG05L02Ti008FrameState = candidate.getFrameState;
export const buildCourseG05L02Ti008CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Ti008Renderer = candidate.Renderer;
export default module;
