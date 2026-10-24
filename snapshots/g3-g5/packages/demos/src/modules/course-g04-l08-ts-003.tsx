"use client";

import {G4_L8_FOUR_STEP_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l8-four-step-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_TS_003_CONFIG, COURSE_G04_L08_TS_003_SOURCE} from "../timelines/course-g04-l08-ts-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_TS_003_CONFIG, G4_L8_FOUR_STEP_HOST_AUDIO_CANDIDATES["course-g04-l08-ts-003"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_TS_003_SOURCE};
export const COURSE_G04_L08_TS_003_MOVIE = candidate.movie;
export const COURSE_G04_L08_TS_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_TS_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_TS_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Ts003Frame = candidate.normalizeFrame;
export const getCourseG04L08Ts003FrameState = candidate.getFrameState;
export const buildCourseG04L08Ts003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Ts003Renderer = candidate.Renderer;
export default module;
