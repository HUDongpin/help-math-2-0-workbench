"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_TI_005_CONFIG, COURSE_G03_L01_TI_005_SOURCE} from "../timelines/course-g03-l01-ti-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_TI_005_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L01_TI_005_SOURCE};
export const COURSE_G03_L01_TI_005_MOVIE = candidate.movie;
export const COURSE_G03_L01_TI_005_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_TI_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_TI_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01Ti005Frame = candidate.normalizeFrame;
export const getCourseG03L01Ti005FrameState = candidate.getFrameState;
export const buildCourseG03L01Ti005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01Ti005Renderer = candidate.Renderer;
export default module;
