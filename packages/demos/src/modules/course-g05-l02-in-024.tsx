"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_IN_024_CONFIG, COURSE_G05_L02_IN_024_SOURCE} from "../timelines/course-g05-l02-in-024";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_IN_024_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_IN_024_SOURCE};
export const COURSE_G05_L02_IN_024_MOVIE = candidate.movie;
export const COURSE_G05_L02_IN_024_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_IN_024_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_IN_024_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02In024Frame = candidate.normalizeFrame;
export const getCourseG05L02In024FrameState = candidate.getFrameState;
export const buildCourseG05L02In024CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02In024Renderer = candidate.Renderer;
export default module;
