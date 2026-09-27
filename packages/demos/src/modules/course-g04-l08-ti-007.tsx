"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_TI_007_CONFIG, COURSE_G04_L08_TI_007_SOURCE} from "../timelines/course-g04-l08-ti-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_TI_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_TI_007_SOURCE};
export const COURSE_G04_L08_TI_007_MOVIE = candidate.movie;
export const COURSE_G04_L08_TI_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_TI_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_TI_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Ti007Frame = candidate.normalizeFrame;
export const getCourseG04L08Ti007FrameState = candidate.getFrameState;
export const buildCourseG04L08Ti007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Ti007Renderer = candidate.Renderer;
export default module;
