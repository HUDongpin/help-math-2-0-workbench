"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L02_IN_009_CONFIG, COURSE_G04_L02_IN_009_SOURCE} from "../timelines/course-g04-l02-in-009";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L02_IN_009_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L02_IN_009_SOURCE};
export const COURSE_G04_L02_IN_009_MOVIE = candidate.movie;
export const COURSE_G04_L02_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L02_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L02_IN_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L02In009Frame = candidate.normalizeFrame;
export const getCourseG04L02In009FrameState = candidate.getFrameState;
export const buildCourseG04L02In009CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L02In009Renderer = candidate.Renderer;
export default module;
