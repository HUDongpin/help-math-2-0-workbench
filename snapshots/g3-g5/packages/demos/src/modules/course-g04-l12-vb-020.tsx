"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L12_VB_020_CONFIG, COURSE_G04_L12_VB_020_SOURCE} from "../timelines/course-g04-l12-vb-020";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L12_VB_020_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L12_VB_020_SOURCE};
export const COURSE_G04_L12_VB_020_MOVIE = candidate.movie;
export const COURSE_G04_L12_VB_020_RUNTIME = candidate.runtime;
export const COURSE_G04_L12_VB_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L12_VB_020_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L12Vb020Frame = candidate.normalizeFrame;
export const getCourseG04L12Vb020FrameState = candidate.getFrameState;
export const buildCourseG04L12Vb020CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L12Vb020Renderer = candidate.Renderer;
export default module;
