"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L06_TI_002_CONFIG, COURSE_G03_L06_TI_002_SOURCE} from "../timelines/course-g03-l06-ti-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L06_TI_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L06_TI_002_SOURCE};
export const COURSE_G03_L06_TI_002_MOVIE = candidate.movie;
export const COURSE_G03_L06_TI_002_RUNTIME = candidate.runtime;
export const COURSE_G03_L06_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L06_TI_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L06Ti002Frame = candidate.normalizeFrame;
export const getCourseG03L06Ti002FrameState = candidate.getFrameState;
export const buildCourseG03L06Ti002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L06Ti002Renderer = candidate.Renderer;
export default module;
