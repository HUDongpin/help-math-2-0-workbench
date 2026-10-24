"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_RW_003_CONFIG, COURSE_G04_L11_RW_003_SOURCE} from "../timelines/course-g04-l11-rw-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_RW_003_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_RW_003_SOURCE};
export const COURSE_G04_L11_RW_003_MOVIE = candidate.movie;
export const COURSE_G04_L11_RW_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_RW_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_RW_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Rw003Frame = candidate.normalizeFrame;
export const getCourseG04L11Rw003FrameState = candidate.getFrameState;
export const buildCourseG04L11Rw003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Rw003Renderer = candidate.Renderer;

export default privateCurrentJsModule;
