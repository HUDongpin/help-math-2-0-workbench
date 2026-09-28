"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_IN_007_CONFIG, COURSE_G04_L08_IN_007_SOURCE} from "../timelines/course-g04-l08-in-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_IN_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_IN_007_SOURCE};
export const COURSE_G04_L08_IN_007_MOVIE = candidate.movie;
export const COURSE_G04_L08_IN_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_IN_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_IN_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08In007Frame = candidate.normalizeFrame;
export const getCourseG04L08In007FrameState = candidate.getFrameState;
export const buildCourseG04L08In007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08In007Renderer = candidate.Renderer;
export default module;
