"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L08_IN_022_CONFIG, COURSE_G03_L08_IN_022_SOURCE} from "../timelines/course-g03-l08-in-022";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L08_IN_022_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L08_IN_022_SOURCE};
export const COURSE_G03_L08_IN_022_MOVIE = candidate.movie;
export const COURSE_G03_L08_IN_022_RUNTIME = candidate.runtime;
export const COURSE_G03_L08_IN_022_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L08_IN_022_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L08In022Frame = candidate.normalizeFrame;
export const getCourseG03L08In022FrameState = candidate.getFrameState;
export const buildCourseG03L08In022CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L08In022Renderer = candidate.Renderer;
export default module;
