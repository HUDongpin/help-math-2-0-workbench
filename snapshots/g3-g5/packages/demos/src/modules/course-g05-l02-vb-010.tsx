"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_VB_010_CONFIG, COURSE_G05_L02_VB_010_SOURCE} from "../timelines/course-g05-l02-vb-010";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_VB_010_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_VB_010_SOURCE};
export const COURSE_G05_L02_VB_010_MOVIE = candidate.movie;
export const COURSE_G05_L02_VB_010_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_VB_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_VB_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02Vb010Frame = candidate.normalizeFrame;
export const getCourseG05L02Vb010FrameState = candidate.getFrameState;
export const buildCourseG05L02Vb010CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02Vb010Renderer = candidate.Renderer;
export default module;
