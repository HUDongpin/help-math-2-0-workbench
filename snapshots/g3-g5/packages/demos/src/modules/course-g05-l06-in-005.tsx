"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G05_L06_IN_005_CONFIG, COURSE_G05_L06_IN_005_SOURCE} from "../timelines/course-g05-l06-in-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L06_IN_005_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G05_L06_IN_005_SOURCE};
export const COURSE_G05_L06_IN_005_MOVIE = candidate.movie;
export const COURSE_G05_L06_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G05_L06_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L06_IN_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L06In005Frame = candidate.normalizeFrame;
export const getCourseG05L06In005FrameState = candidate.getFrameState;
export const buildCourseG05L06In005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L06In005Renderer = candidate.Renderer;
export default module;
