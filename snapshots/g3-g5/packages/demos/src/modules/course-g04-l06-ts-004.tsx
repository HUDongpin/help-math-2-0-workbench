"use client";

import {G4_L6_FOUR_STEP_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l6-four-step-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L06_TS_004_CONFIG, COURSE_G04_L06_TS_004_SOURCE} from "../timelines/course-g04-l06-ts-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L06_TS_004_CONFIG, G4_L6_FOUR_STEP_HOST_AUDIO_CANDIDATES["course-g04-l06-ts-004"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L06_TS_004_SOURCE};
export const COURSE_G04_L06_TS_004_MOVIE = candidate.movie;
export const COURSE_G04_L06_TS_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L06_TS_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L06_TS_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L06Ts004Frame = candidate.normalizeFrame;
export const getCourseG04L06Ts004FrameState = candidate.getFrameState;
export const buildCourseG04L06Ts004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L06Ts004Renderer = candidate.Renderer;
export default module;
