"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L12_VB_008_CONFIG, COURSE_G04_L12_VB_008_SOURCE} from "../timelines/course-g04-l12-vb-008";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L12_VB_008_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L12_VB_008_SOURCE};
export const COURSE_G04_L12_VB_008_MOVIE = candidate.movie;
export const COURSE_G04_L12_VB_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L12_VB_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L12_VB_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L12Vb008Frame = candidate.normalizeFrame;
export const getCourseG04L12Vb008FrameState = candidate.getFrameState;
export const buildCourseG04L12Vb008CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L12Vb008Renderer = candidate.Renderer;
export default module;
