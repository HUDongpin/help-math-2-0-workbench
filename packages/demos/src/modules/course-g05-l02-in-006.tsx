"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L02_IN_006_CONFIG, COURSE_G05_L02_IN_006_SOURCE} from "../timelines/course-g05-l02-in-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L02_IN_006_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L02_IN_006_SOURCE};
export const COURSE_G05_L02_IN_006_MOVIE = candidate.movie;
export const COURSE_G05_L02_IN_006_RUNTIME = candidate.runtime;
export const COURSE_G05_L02_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L02_IN_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L02In006Frame = candidate.normalizeFrame;
export const getCourseG05L02In006FrameState = candidate.getFrameState;
export const buildCourseG05L02In006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L02In006Renderer = candidate.Renderer;
export default module;
