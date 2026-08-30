"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TS_004_CONFIG, COURSE_G04_L11_TS_004_SOURCE} from "../timelines/course-g04-l11-ts-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TS_004_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_TS_004_SOURCE};
export const COURSE_G04_L11_TS_004_MOVIE = candidate.movie;
export const COURSE_G04_L11_TS_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_TS_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TS_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Ts004Frame = candidate.normalizeFrame;
export const getCourseG04L11Ts004FrameState = candidate.getFrameState;
export const buildCourseG04L11Ts004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Ts004Renderer = candidate.Renderer;

export default privateCurrentJsModule;
