"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L07_IN_003_CONFIG, COURSE_G05_L07_IN_003_SOURCE} from "../timelines/course-g05-l07-in-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L07_IN_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L07_IN_003_SOURCE};
export const COURSE_G05_L07_IN_003_MOVIE = candidate.movie;
export const COURSE_G05_L07_IN_003_RUNTIME = candidate.runtime;
export const COURSE_G05_L07_IN_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L07_IN_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L07In003Frame = candidate.normalizeFrame;
export const getCourseG05L07In003FrameState = candidate.getFrameState;
export const buildCourseG05L07In003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L07In003Renderer = candidate.Renderer;
export default module;
