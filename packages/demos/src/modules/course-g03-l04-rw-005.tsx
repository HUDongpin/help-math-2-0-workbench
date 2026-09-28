"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L04_RW_005_CONFIG, COURSE_G03_L04_RW_005_SOURCE} from "../timelines/course-g03-l04-rw-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L04_RW_005_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L04_RW_005_SOURCE};
export const COURSE_G03_L04_RW_005_MOVIE = candidate.movie;
export const COURSE_G03_L04_RW_005_RUNTIME = candidate.runtime;
export const COURSE_G03_L04_RW_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L04_RW_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L04Rw005Frame = candidate.normalizeFrame;
export const getCourseG03L04Rw005FrameState = candidate.getFrameState;
export const buildCourseG03L04Rw005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L04Rw005Renderer = candidate.Renderer;
export default module;
