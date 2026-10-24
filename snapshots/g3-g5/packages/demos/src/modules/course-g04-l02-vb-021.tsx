"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L02_VB_021_CONFIG, COURSE_G04_L02_VB_021_SOURCE} from "../timelines/course-g04-l02-vb-021";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L02_VB_021_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L02_VB_021_SOURCE};
export const COURSE_G04_L02_VB_021_MOVIE = candidate.movie;
export const COURSE_G04_L02_VB_021_RUNTIME = candidate.runtime;
export const COURSE_G04_L02_VB_021_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L02_VB_021_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L02Vb021Frame = candidate.normalizeFrame;
export const getCourseG04L02Vb021FrameState = candidate.getFrameState;
export const buildCourseG04L02Vb021CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L02Vb021Renderer = candidate.Renderer;
export default module;
