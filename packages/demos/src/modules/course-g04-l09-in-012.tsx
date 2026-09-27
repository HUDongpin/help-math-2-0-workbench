"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_IN_012_CONFIG, COURSE_G04_L09_IN_012_SOURCE} from "../timelines/course-g04-l09-in-012";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_IN_012_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L09_IN_012_SOURCE};
export const COURSE_G04_L09_IN_012_MOVIE = candidate.movie;
export const COURSE_G04_L09_IN_012_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_IN_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09In012Frame = candidate.normalizeFrame;
export const getCourseG04L09In012FrameState = candidate.getFrameState;
export const buildCourseG04L09In012CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09In012Renderer = candidate.Renderer;
export default module;
