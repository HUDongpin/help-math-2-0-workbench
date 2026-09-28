"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_FQ_003_CONFIG, COURSE_G04_L09_FQ_003_SOURCE} from "../timelines/course-g04-l09-fq-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_FQ_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L09_FQ_003_SOURCE};
export const COURSE_G04_L09_FQ_003_MOVIE = candidate.movie;
export const COURSE_G04_L09_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_FQ_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_FQ_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Fq003Frame = candidate.normalizeFrame;
export const getCourseG04L09Fq003FrameState = candidate.getFrameState;
export const buildCourseG04L09Fq003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Fq003Renderer = candidate.Renderer;
export default module;
