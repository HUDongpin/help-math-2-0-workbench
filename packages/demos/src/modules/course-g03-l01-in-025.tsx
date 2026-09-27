"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_IN_025_CONFIG, COURSE_G03_L01_IN_025_SOURCE} from "../timelines/course-g03-l01-in-025";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_IN_025_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L01_IN_025_SOURCE};
export const COURSE_G03_L01_IN_025_MOVIE = candidate.movie;
export const COURSE_G03_L01_IN_025_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_IN_025_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_IN_025_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01In025Frame = candidate.normalizeFrame;
export const getCourseG03L01In025FrameState = candidate.getFrameState;
export const buildCourseG03L01In025CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01In025Renderer = candidate.Renderer;
export default module;
