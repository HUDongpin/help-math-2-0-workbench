"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_IN_019_CONFIG, COURSE_G05_L02_IN_019_SOURCE} from "../timelines/course-g05-l02-in-019";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_IN_019_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_IN_019_SOURCE};
export const COURSE_G05_L02_IN_019_MOVIE = candidate.movie;
export const COURSE_G05_L02_IN_019_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_IN_019_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_IN_019_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02In019Frame = candidate.normalizeFrame;
export const getCourseG05L02In019FrameState = candidate.getFrameState;
export const buildCourseG05L02In019CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02In019Renderer = candidate.Renderer;
export default module;
