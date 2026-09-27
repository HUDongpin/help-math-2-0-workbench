"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_VB_021_CONFIG, COURSE_G03_L09_VB_021_SOURCE} from "../timelines/course-g03-l09-vb-021";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_VB_021_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_VB_021_SOURCE};
export const COURSE_G03_L09_VB_021_MOVIE = candidate.movie;
export const COURSE_G03_L09_VB_021_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_VB_021_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_VB_021_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09Vb021Frame = candidate.normalizeFrame;
export const getCourseG03L09Vb021FrameState = candidate.getFrameState;
export const buildCourseG03L09Vb021CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09Vb021Renderer = candidate.Renderer;
export default module;
