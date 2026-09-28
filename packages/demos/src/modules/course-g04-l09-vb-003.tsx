"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_VB_003_CONFIG, COURSE_G04_L09_VB_003_SOURCE} from "../timelines/course-g04-l09-vb-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_VB_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L09_VB_003_SOURCE};
export const COURSE_G04_L09_VB_003_MOVIE = candidate.movie;
export const COURSE_G04_L09_VB_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_VB_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_VB_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Vb003Frame = candidate.normalizeFrame;
export const getCourseG04L09Vb003FrameState = candidate.getFrameState;
export const buildCourseG04L09Vb003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Vb003Renderer = candidate.Renderer;
export default module;
