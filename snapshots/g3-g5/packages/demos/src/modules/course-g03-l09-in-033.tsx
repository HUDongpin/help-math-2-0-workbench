"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_IN_033_CONFIG, COURSE_G03_L09_IN_033_SOURCE} from "../timelines/course-g03-l09-in-033";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_IN_033_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_IN_033_SOURCE};
export const COURSE_G03_L09_IN_033_MOVIE = candidate.movie;
export const COURSE_G03_L09_IN_033_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_IN_033_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_IN_033_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09In033Frame = candidate.normalizeFrame;
export const getCourseG03L09In033FrameState = candidate.getFrameState;
export const buildCourseG03L09In033CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09In033Renderer = candidate.Renderer;
export default module;
