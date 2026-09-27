"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L12_VB_030_CONFIG, COURSE_G04_L12_VB_030_SOURCE} from "../timelines/course-g04-l12-vb-030";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L12_VB_030_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L12_VB_030_SOURCE};
export const COURSE_G04_L12_VB_030_MOVIE = candidate.movie;
export const COURSE_G04_L12_VB_030_RUNTIME = candidate.runtime;
export const COURSE_G04_L12_VB_030_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L12_VB_030_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L12Vb030Frame = candidate.normalizeFrame;
export const getCourseG04L12Vb030FrameState = candidate.getFrameState;
export const buildCourseG04L12Vb030CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L12Vb030Renderer = candidate.Renderer;
export default module;
