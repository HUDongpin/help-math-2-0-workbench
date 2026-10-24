"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L01_VB_017_CONFIG, COURSE_G04_L01_VB_017_SOURCE} from "../timelines/course-g04-l01-vb-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L01_VB_017_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L01_VB_017_SOURCE};
export const COURSE_G04_L01_VB_017_MOVIE = candidate.movie;
export const COURSE_G04_L01_VB_017_RUNTIME = candidate.runtime;
export const COURSE_G04_L01_VB_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L01_VB_017_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L01Vb017Frame = candidate.normalizeFrame;
export const getCourseG04L01Vb017FrameState = candidate.getFrameState;
export const buildCourseG04L01Vb017CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L01Vb017Renderer = candidate.Renderer;
export default module;
