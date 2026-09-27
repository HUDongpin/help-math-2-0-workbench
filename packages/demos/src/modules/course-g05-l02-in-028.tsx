"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_IN_028_CONFIG, COURSE_G05_L02_IN_028_SOURCE} from "../timelines/course-g05-l02-in-028";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_IN_028_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_IN_028_SOURCE};
export const COURSE_G05_L02_IN_028_MOVIE = candidate.movie;
export const COURSE_G05_L02_IN_028_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_IN_028_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_IN_028_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02In028Frame = candidate.normalizeFrame;
export const getCourseG05L02In028FrameState = candidate.getFrameState;
export const buildCourseG05L02In028CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02In028Renderer = candidate.Renderer;
export default module;
