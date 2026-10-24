"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_VB_013_CONFIG, COURSE_G03_L09_VB_013_SOURCE} from "../timelines/course-g03-l09-vb-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_VB_013_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_VB_013_SOURCE};
export const COURSE_G03_L09_VB_013_MOVIE = candidate.movie;
export const COURSE_G03_L09_VB_013_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_VB_013_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09Vb013Frame = candidate.normalizeFrame;
export const getCourseG03L09Vb013FrameState = candidate.getFrameState;
export const buildCourseG03L09Vb013CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09Vb013Renderer = candidate.Renderer;
export default module;
