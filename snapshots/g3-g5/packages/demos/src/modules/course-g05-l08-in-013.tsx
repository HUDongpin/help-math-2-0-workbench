"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L08_IN_013_CONFIG, COURSE_G05_L08_IN_013_SOURCE} from "../timelines/course-g05-l08-in-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L08_IN_013_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L08_IN_013_SOURCE};
export const COURSE_G05_L08_IN_013_MOVIE = candidate.movie;
export const COURSE_G05_L08_IN_013_RUNTIME = candidate.runtime;
export const COURSE_G05_L08_IN_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L08_IN_013_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L08In013Frame = candidate.normalizeFrame;
export const getCourseG05L08In013FrameState = candidate.getFrameState;
export const buildCourseG05L08In013CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L08In013Renderer = candidate.Renderer;
export default module;
