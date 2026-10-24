"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L08_IN_023_CONFIG, COURSE_G05_L08_IN_023_SOURCE} from "../timelines/course-g05-l08-in-023";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L08_IN_023_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L08_IN_023_SOURCE};
export const COURSE_G05_L08_IN_023_MOVIE = candidate.movie;
export const COURSE_G05_L08_IN_023_RUNTIME = candidate.runtime;
export const COURSE_G05_L08_IN_023_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L08_IN_023_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L08In023Frame = candidate.normalizeFrame;
export const getCourseG05L08In023FrameState = candidate.getFrameState;
export const buildCourseG05L08In023CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L08In023Renderer = candidate.Renderer;
export default module;
