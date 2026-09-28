"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L06_IN_010_CONFIG, COURSE_G05_L06_IN_010_SOURCE} from "../timelines/course-g05-l06-in-010";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L06_IN_010_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L06_IN_010_SOURCE};
export const COURSE_G05_L06_IN_010_MOVIE = candidate.movie;
export const COURSE_G05_L06_IN_010_RUNTIME = candidate.runtime;
export const COURSE_G05_L06_IN_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L06_IN_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L06In010Frame = candidate.normalizeFrame;
export const getCourseG05L06In010FrameState = candidate.getFrameState;
export const buildCourseG05L06In010CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L06In010Renderer = candidate.Renderer;
export default module;
