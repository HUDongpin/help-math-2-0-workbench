"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_IN_007_CONFIG, COURSE_G03_L09_IN_007_SOURCE} from "../timelines/course-g03-l09-in-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_IN_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_IN_007_SOURCE};
export const COURSE_G03_L09_IN_007_MOVIE = candidate.movie;
export const COURSE_G03_L09_IN_007_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_IN_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_IN_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09In007Frame = candidate.normalizeFrame;
export const getCourseG03L09In007FrameState = candidate.getFrameState;
export const buildCourseG03L09In007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09In007Renderer = candidate.Renderer;
export default module;
