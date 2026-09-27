"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_TI_004_CONFIG, COURSE_G05_L01_TI_004_SOURCE} from "../timelines/course-g05-l01-ti-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_TI_004_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_TI_004_SOURCE};
export const COURSE_G05_L01_TI_004_MOVIE = candidate.movie;
export const COURSE_G05_L01_TI_004_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_TI_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_TI_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01Ti004Frame = candidate.normalizeFrame;
export const getCourseG05L01Ti004FrameState = candidate.getFrameState;
export const buildCourseG05L01Ti004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01Ti004Renderer = candidate.Renderer;
export default module;
