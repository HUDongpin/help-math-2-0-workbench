"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_VB_017_CONFIG, COURSE_G03_L01_VB_017_SOURCE} from "../timelines/course-g03-l01-vb-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_VB_017_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L01_VB_017_SOURCE};
export const COURSE_G03_L01_VB_017_MOVIE = candidate.movie;
export const COURSE_G03_L01_VB_017_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_VB_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_VB_017_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01Vb017Frame = candidate.normalizeFrame;
export const getCourseG03L01Vb017FrameState = candidate.getFrameState;
export const buildCourseG03L01Vb017CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01Vb017Renderer = candidate.Renderer;
export default module;
