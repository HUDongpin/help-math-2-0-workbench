"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L09_RW_004_CONFIG, COURSE_G03_L09_RW_004_SOURCE} from "../timelines/course-g03-l09-rw-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L09_RW_004_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L09_RW_004_SOURCE};
export const COURSE_G03_L09_RW_004_MOVIE = candidate.movie;
export const COURSE_G03_L09_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G03_L09_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L09_RW_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L09Rw004Frame = candidate.normalizeFrame;
export const getCourseG03L09Rw004FrameState = candidate.getFrameState;
export const buildCourseG03L09Rw004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L09Rw004Renderer = candidate.Renderer;
export default module;
