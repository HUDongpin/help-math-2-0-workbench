"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_IN_012_CONFIG, COURSE_G05_L01_IN_012_SOURCE} from "../timelines/course-g05-l01-in-012";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_IN_012_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_IN_012_SOURCE};
export const COURSE_G05_L01_IN_012_MOVIE = candidate.movie;
export const COURSE_G05_L01_IN_012_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_IN_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01In012Frame = candidate.normalizeFrame;
export const getCourseG05L01In012FrameState = candidate.getFrameState;
export const buildCourseG05L01In012CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01In012Renderer = candidate.Renderer;
export default module;
