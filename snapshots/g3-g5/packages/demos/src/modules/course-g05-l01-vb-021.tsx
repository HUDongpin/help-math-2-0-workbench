"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_VB_021_CONFIG, COURSE_G05_L01_VB_021_SOURCE} from "../timelines/course-g05-l01-vb-021";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_VB_021_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_VB_021_SOURCE};
export const COURSE_G05_L01_VB_021_MOVIE = candidate.movie;
export const COURSE_G05_L01_VB_021_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_VB_021_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_VB_021_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01Vb021Frame = candidate.normalizeFrame;
export const getCourseG05L01Vb021FrameState = candidate.getFrameState;
export const buildCourseG05L01Vb021CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01Vb021Renderer = candidate.Renderer;
export default module;
