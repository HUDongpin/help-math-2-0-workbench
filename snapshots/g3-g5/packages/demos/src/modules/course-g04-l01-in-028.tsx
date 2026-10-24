"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L01_IN_028_CONFIG, COURSE_G04_L01_IN_028_SOURCE} from "../timelines/course-g04-l01-in-028";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L01_IN_028_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L01_IN_028_SOURCE};
export const COURSE_G04_L01_IN_028_MOVIE = candidate.movie;
export const COURSE_G04_L01_IN_028_RUNTIME = candidate.runtime;
export const COURSE_G04_L01_IN_028_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L01_IN_028_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L01In028Frame = candidate.normalizeFrame;
export const getCourseG04L01In028FrameState = candidate.getFrameState;
export const buildCourseG04L01In028CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L01In028Renderer = candidate.Renderer;
export default module;
