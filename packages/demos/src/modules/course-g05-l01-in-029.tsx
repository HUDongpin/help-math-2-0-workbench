"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L01_IN_029_CONFIG, COURSE_G05_L01_IN_029_SOURCE} from "../timelines/course-g05-l01-in-029";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L01_IN_029_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L01_IN_029_SOURCE};
export const COURSE_G05_L01_IN_029_MOVIE = candidate.movie;
export const COURSE_G05_L01_IN_029_RUNTIME = candidate.runtime;
export const COURSE_G05_L01_IN_029_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L01_IN_029_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L01In029Frame = candidate.normalizeFrame;
export const getCourseG05L01In029FrameState = candidate.getFrameState;
export const buildCourseG05L01In029CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L01In029Renderer = candidate.Renderer;
export default module;
