"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_VB_014_CONFIG, COURSE_G05_L01_VB_014_SOURCE} from "../timelines/course-g05-l01-vb-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_VB_014_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_VB_014_SOURCE};
export const COURSE_G05_L01_VB_014_MOVIE = candidate.movie;
export const COURSE_G05_L01_VB_014_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_VB_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_VB_014_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01Vb014Frame = candidate.normalizeFrame;
export const getCourseG05L01Vb014FrameState = candidate.getFrameState;
export const buildCourseG05L01Vb014CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01Vb014Renderer = candidate.Renderer;
export default module;
