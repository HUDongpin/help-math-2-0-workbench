"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L08_TS_004_CONFIG, COURSE_G03_L08_TS_004_SOURCE} from "../timelines/course-g03-l08-ts-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L08_TS_004_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L08_TS_004_SOURCE};
export const COURSE_G03_L08_TS_004_MOVIE = candidate.movie;
export const COURSE_G03_L08_TS_004_RUNTIME = candidate.runtime;
export const COURSE_G03_L08_TS_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L08_TS_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L08Ts004Frame = candidate.normalizeFrame;
export const getCourseG03L08Ts004FrameState = candidate.getFrameState;
export const buildCourseG03L08Ts004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L08Ts004Renderer = candidate.Renderer;
export default module;
