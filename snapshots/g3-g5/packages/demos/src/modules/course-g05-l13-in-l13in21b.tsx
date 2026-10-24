"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L13_IN_L13IN21B_CONFIG, COURSE_G05_L13_IN_L13IN21B_SOURCE} from "../timelines/course-g05-l13-in-l13in21b";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L13_IN_L13IN21B_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L13_IN_L13IN21B_SOURCE};
export const COURSE_G05_L13_IN_L13IN21B_MOVIE = candidate.movie;
export const COURSE_G05_L13_IN_L13IN21B_RUNTIME = candidate.runtime;
export const COURSE_G05_L13_IN_L13IN21B_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L13_IN_L13IN21B_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L13InL13in21bFrame = candidate.normalizeFrame;
export const getCourseG05L13InL13in21bFrameState = candidate.getFrameState;
export const buildCourseG05L13InL13in21bCaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L13InL13in21bRenderer = candidate.Renderer;
export default module;
