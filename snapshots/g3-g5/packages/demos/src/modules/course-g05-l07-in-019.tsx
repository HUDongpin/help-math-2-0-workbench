"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L07_IN_019_CONFIG, COURSE_G05_L07_IN_019_SOURCE} from "../timelines/course-g05-l07-in-019";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L07_IN_019_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L07_IN_019_SOURCE};
export const COURSE_G05_L07_IN_019_MOVIE = candidate.movie;
export const COURSE_G05_L07_IN_019_RUNTIME = candidate.runtime;
export const COURSE_G05_L07_IN_019_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L07_IN_019_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L07In019Frame = candidate.normalizeFrame;
export const getCourseG05L07In019FrameState = candidate.getFrameState;
export const buildCourseG05L07In019CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L07In019Renderer = candidate.Renderer;
export default module;
