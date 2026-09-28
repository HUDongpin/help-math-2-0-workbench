"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L01_VB_022_CONFIG, COURSE_G04_L01_VB_022_SOURCE} from "../timelines/course-g04-l01-vb-022";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L01_VB_022_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L01_VB_022_SOURCE};
export const COURSE_G04_L01_VB_022_MOVIE = candidate.movie;
export const COURSE_G04_L01_VB_022_RUNTIME = candidate.runtime;
export const COURSE_G04_L01_VB_022_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L01_VB_022_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L01Vb022Frame = candidate.normalizeFrame;
export const getCourseG04L01Vb022FrameState = candidate.getFrameState;
export const buildCourseG04L01Vb022CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L01Vb022Renderer = candidate.Renderer;
export default module;
