"use client";
import {G4_L4_PRACTICE_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-place-value-practice-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_016_CONFIG, COURSE_G04_L04_IN_016_SOURCE} from "../timelines/course-g04-l04-in-016";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_016_CONFIG, G4_L4_PRACTICE_HOST_AUDIO_CANDIDATES["course-g04-l04-in-016"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_016_SOURCE};
export const COURSE_G04_L04_IN_016_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_016_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_016_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In016Frame = candidate.normalizeFrame;
export const getCourseG04L04In016FrameState = candidate.getFrameState;
export const buildCourseG04L04In016CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In016Renderer = candidate.Renderer;
export default module;
