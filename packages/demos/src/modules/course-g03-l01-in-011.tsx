"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_IN_011_CONFIG, COURSE_G03_L01_IN_011_SOURCE} from "../timelines/course-g03-l01-in-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_IN_011_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L01_IN_011_SOURCE};
export const COURSE_G03_L01_IN_011_MOVIE = candidate.movie;
export const COURSE_G03_L01_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01In011Frame = candidate.normalizeFrame;
export const getCourseG03L01In011FrameState = candidate.getFrameState;
export const buildCourseG03L01In011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01In011Renderer = candidate.Renderer;
export default module;
