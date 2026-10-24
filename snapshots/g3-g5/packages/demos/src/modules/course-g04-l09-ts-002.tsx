"use client";

import {G4_L9_TS002_HOST_AUDIO} from "../modern-lessons/g4-l9-ts002-host-audio";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_TS_002_CONFIG, COURSE_G04_L09_TS_002_SOURCE} from "../timelines/course-g04-l09-ts-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_TS_002_CONFIG, G4_L9_TS002_HOST_AUDIO);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L09_TS_002_SOURCE};
export const COURSE_G04_L09_TS_002_MOVIE = candidate.movie;
export const COURSE_G04_L09_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_TS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Ts002Frame = candidate.normalizeFrame;
export const getCourseG04L09Ts002FrameState = candidate.getFrameState;
export const buildCourseG04L09Ts002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Ts002Renderer = candidate.Renderer;
export default module;
