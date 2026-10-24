"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_VB_024_CONFIG, COURSE_G05_L01_VB_024_SOURCE} from "../timelines/course-g05-l01-vb-024";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_VB_024_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_VB_024_SOURCE};
export const COURSE_G05_L01_VB_024_MOVIE = candidate.movie;
export const COURSE_G05_L01_VB_024_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_VB_024_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_VB_024_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01Vb024Frame = candidate.normalizeFrame;
export const getCourseG05L01Vb024FrameState = candidate.getFrameState;
export const buildCourseG05L01Vb024CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01Vb024Renderer = candidate.Renderer;
export default module;
