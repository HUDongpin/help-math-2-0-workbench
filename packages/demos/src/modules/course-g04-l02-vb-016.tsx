"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L02_VB_016_CONFIG, COURSE_G04_L02_VB_016_SOURCE} from "../timelines/course-g04-l02-vb-016";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L02_VB_016_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L02_VB_016_SOURCE};
export const COURSE_G04_L02_VB_016_MOVIE = candidate.movie;
export const COURSE_G04_L02_VB_016_RUNTIME = candidate.runtime;
export const COURSE_G04_L02_VB_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L02_VB_016_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L02Vb016Frame = candidate.normalizeFrame;
export const getCourseG04L02Vb016FrameState = candidate.getFrameState;
export const buildCourseG04L02Vb016CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L02Vb016Renderer = candidate.Renderer;
export default module;
