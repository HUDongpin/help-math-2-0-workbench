"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L06_IN_008_CONFIG, COURSE_G04_L06_IN_008_SOURCE} from "../timelines/course-g04-l06-in-008";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L06_IN_008_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L06_IN_008_SOURCE};
export const COURSE_G04_L06_IN_008_MOVIE = candidate.movie;
export const COURSE_G04_L06_IN_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L06_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L06_IN_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L06In008Frame = candidate.normalizeFrame;
export const getCourseG04L06In008FrameState = candidate.getFrameState;
export const buildCourseG04L06In008CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L06In008Renderer = candidate.Renderer;
export default module;
