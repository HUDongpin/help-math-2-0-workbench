"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_VB_007_CONFIG, COURSE_G04_L09_VB_007_SOURCE} from "../timelines/course-g04-l09-vb-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_VB_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L09_VB_007_SOURCE};
export const COURSE_G04_L09_VB_007_MOVIE = candidate.movie;
export const COURSE_G04_L09_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Vb007Frame = candidate.normalizeFrame;
export const getCourseG04L09Vb007FrameState = candidate.getFrameState;
export const buildCourseG04L09Vb007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Vb007Renderer = candidate.Renderer;
export default module;
