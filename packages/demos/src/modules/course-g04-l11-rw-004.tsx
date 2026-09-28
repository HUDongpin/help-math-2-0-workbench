"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_RW_004_CONFIG, COURSE_G04_L11_RW_004_SOURCE} from "../timelines/course-g04-l11-rw-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_RW_004_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_RW_004_SOURCE};
export const COURSE_G04_L11_RW_004_MOVIE = candidate.movie;
export const COURSE_G04_L11_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_RW_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Rw004Frame = candidate.normalizeFrame;
export const getCourseG04L11Rw004FrameState = candidate.getFrameState;
export const buildCourseG04L11Rw004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Rw004Renderer = candidate.Renderer;

export default privateCurrentJsModule;
