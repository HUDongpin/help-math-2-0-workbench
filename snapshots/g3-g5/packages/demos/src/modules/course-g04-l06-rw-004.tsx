"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L06_RW_004_CONFIG, COURSE_G04_L06_RW_004_SOURCE} from "../timelines/course-g04-l06-rw-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L06_RW_004_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L06_RW_004_SOURCE};
export const COURSE_G04_L06_RW_004_MOVIE = candidate.movie;
export const COURSE_G04_L06_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L06_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L06_RW_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L06Rw004Frame = candidate.normalizeFrame;
export const getCourseG04L06Rw004FrameState = candidate.getFrameState;
export const buildCourseG04L06Rw004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L06Rw004Renderer = candidate.Renderer;
export default module;
