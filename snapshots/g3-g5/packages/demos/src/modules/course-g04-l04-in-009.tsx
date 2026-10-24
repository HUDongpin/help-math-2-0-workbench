"use client";
import {G4_L4_ARITHMETIC_CHOICE_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-arithmetic-choice-config";


import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_009_CONFIG, COURSE_G04_L04_IN_009_SOURCE} from "../timelines/course-g04-l04-in-009";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_009_CONFIG, G4_L4_ARITHMETIC_CHOICE_HOST_AUDIO_CANDIDATES["course-g04-l04-in-009"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_009_SOURCE};
export const COURSE_G04_L04_IN_009_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_009_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In009Frame = candidate.normalizeFrame;
export const getCourseG04L04In009FrameState = candidate.getFrameState;
export const buildCourseG04L04In009CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In009Renderer = candidate.Renderer;
export default module;
