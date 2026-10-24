"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_VB_015_CONFIG, COURSE_G05_L13_VB_015_SOURCE} from "../timelines/course-g05-l13-vb-015";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_VB_015_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_VB_015_SOURCE};
export const COURSE_G05_L13_VB_015_MOVIE = candidate.movie;
export const COURSE_G05_L13_VB_015_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_VB_015_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_VB_015_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13Vb015Frame = candidate.normalizeFrame;
export const getCourseG05L13Vb015FrameState = candidate.getFrameState;
export const buildCourseG05L13Vb015CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13Vb015Renderer = candidate.Renderer;
export default module;
