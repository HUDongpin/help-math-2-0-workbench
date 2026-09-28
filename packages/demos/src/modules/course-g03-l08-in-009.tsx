"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L08_IN_009_CONFIG, COURSE_G03_L08_IN_009_SOURCE} from "../timelines/course-g03-l08-in-009";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L08_IN_009_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L08_IN_009_SOURCE};
export const COURSE_G03_L08_IN_009_MOVIE = candidate.movie;
export const COURSE_G03_L08_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G03_L08_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L08_IN_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L08In009Frame = candidate.normalizeFrame;
export const getCourseG03L08In009FrameState = candidate.getFrameState;
export const buildCourseG03L08In009CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L08In009Renderer = candidate.Renderer;
export default module;
