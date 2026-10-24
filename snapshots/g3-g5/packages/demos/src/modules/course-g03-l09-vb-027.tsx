"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_VB_027_CONFIG, COURSE_G03_L09_VB_027_SOURCE} from "../timelines/course-g03-l09-vb-027";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_VB_027_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_VB_027_SOURCE};
export const COURSE_G03_L09_VB_027_MOVIE = candidate.movie;
export const COURSE_G03_L09_VB_027_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_VB_027_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_VB_027_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09Vb027Frame = candidate.normalizeFrame;
export const getCourseG03L09Vb027FrameState = candidate.getFrameState;
export const buildCourseG03L09Vb027CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09Vb027Renderer = candidate.Renderer;
export default module;
