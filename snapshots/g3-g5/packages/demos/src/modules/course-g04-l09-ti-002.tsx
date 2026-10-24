"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_TI_002_CONFIG, COURSE_G04_L09_TI_002_SOURCE} from "../timelines/course-g04-l09-ti-002";

import {G4_L9_TI002_HOST_AUDIO} from "../modern-lessons/g4-l9-ti002/host-audio.generated";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_TI_002_CONFIG);
const module = Object.freeze({...candidate.module, ...G4_L9_TI002_HOST_AUDIO, maturity: "private-current-js" as const});

export {COURSE_G04_L09_TI_002_SOURCE};
export const COURSE_G04_L09_TI_002_MOVIE = candidate.movie;
export const COURSE_G04_L09_TI_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_TI_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Ti002Frame = candidate.normalizeFrame;
export const getCourseG04L09Ti002FrameState = candidate.getFrameState;
export const buildCourseG04L09Ti002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Ti002Renderer = candidate.Renderer;
export default module;
