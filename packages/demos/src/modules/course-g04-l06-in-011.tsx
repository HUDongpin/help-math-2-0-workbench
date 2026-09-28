"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L06_IN_011_CONFIG, COURSE_G04_L06_IN_011_SOURCE} from "../timelines/course-g04-l06-in-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L06_IN_011_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L06_IN_011_SOURCE};
export const COURSE_G04_L06_IN_011_MOVIE = candidate.movie;
export const COURSE_G04_L06_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G04_L06_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L06_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L06In011Frame = candidate.normalizeFrame;
export const getCourseG04L06In011FrameState = candidate.getFrameState;
export const buildCourseG04L06In011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L06In011Renderer = candidate.Renderer;
export default module;
