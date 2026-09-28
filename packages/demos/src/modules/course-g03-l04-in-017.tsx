"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L04_IN_017_CONFIG, COURSE_G03_L04_IN_017_SOURCE} from "../timelines/course-g03-l04-in-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L04_IN_017_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L04_IN_017_SOURCE};
export const COURSE_G03_L04_IN_017_MOVIE = candidate.movie;
export const COURSE_G03_L04_IN_017_RUNTIME = candidate.runtime;
export const COURSE_G03_L04_IN_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L04_IN_017_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L04In017Frame = candidate.normalizeFrame;
export const getCourseG03L04In017FrameState = candidate.getFrameState;
export const buildCourseG03L04In017CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L04In017Renderer = candidate.Renderer;
export default module;
