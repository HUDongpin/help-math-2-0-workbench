"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_IN_L13IN21A_CONFIG, COURSE_G05_L13_IN_L13IN21A_SOURCE} from "../timelines/course-g05-l13-in-l13in21a";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_IN_L13IN21A_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_IN_L13IN21A_SOURCE};
export const COURSE_G05_L13_IN_L13IN21A_MOVIE = candidate.movie;
export const COURSE_G05_L13_IN_L13IN21A_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_IN_L13IN21A_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_IN_L13IN21A_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13InL13in21aFrame = candidate.normalizeFrame;
export const getCourseG05L13InL13in21aFrameState = candidate.getFrameState;
export const buildCourseG05L13InL13in21aCaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13InL13in21aRenderer = candidate.Renderer;
export default module;
