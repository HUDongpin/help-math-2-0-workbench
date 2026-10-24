"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L07_IN_005_CONFIG, COURSE_G04_L07_IN_005_SOURCE} from "../timelines/course-g04-l07-in-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L07_IN_005_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L07_IN_005_SOURCE};
export const COURSE_G04_L07_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L07_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L07_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L07_IN_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L07In005Frame = candidate.normalizeFrame;
export const getCourseG04L07In005FrameState = candidate.getFrameState;
export const buildCourseG04L07In005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L07In005Renderer = candidate.Renderer;
export default module;
