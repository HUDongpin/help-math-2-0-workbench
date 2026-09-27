"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L01_IN_020_CONFIG, COURSE_G04_L01_IN_020_SOURCE} from "../timelines/course-g04-l01-in-020";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L01_IN_020_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L01_IN_020_SOURCE};
export const COURSE_G04_L01_IN_020_MOVIE = candidate.movie;
export const COURSE_G04_L01_IN_020_RUNTIME = candidate.runtime;
export const COURSE_G04_L01_IN_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L01_IN_020_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L01In020Frame = candidate.normalizeFrame;
export const getCourseG04L01In020FrameState = candidate.getFrameState;
export const buildCourseG04L01In020CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L01In020Renderer = candidate.Renderer;
export default module;
