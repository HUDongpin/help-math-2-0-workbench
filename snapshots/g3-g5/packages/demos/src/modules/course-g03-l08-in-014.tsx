"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L08_IN_014_CONFIG, COURSE_G03_L08_IN_014_SOURCE} from "../timelines/course-g03-l08-in-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L08_IN_014_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L08_IN_014_SOURCE};
export const COURSE_G03_L08_IN_014_MOVIE = candidate.movie;
export const COURSE_G03_L08_IN_014_RUNTIME = candidate.runtime;
export const COURSE_G03_L08_IN_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L08_IN_014_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L08In014Frame = candidate.normalizeFrame;
export const getCourseG03L08In014FrameState = candidate.getFrameState;
export const buildCourseG03L08In014CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L08In014Renderer = candidate.Renderer;
export default module;
