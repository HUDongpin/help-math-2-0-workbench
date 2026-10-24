"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_VB_009_CONFIG, COURSE_G04_L08_VB_009_SOURCE} from "../timelines/course-g04-l08-vb-009";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_VB_009_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_VB_009_SOURCE};
export const COURSE_G04_L08_VB_009_MOVIE = candidate.movie;
export const COURSE_G04_L08_VB_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_VB_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_VB_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Vb009Frame = candidate.normalizeFrame;
export const getCourseG04L08Vb009FrameState = candidate.getFrameState;
export const buildCourseG04L08Vb009CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Vb009Renderer = candidate.Renderer;
export default module;
