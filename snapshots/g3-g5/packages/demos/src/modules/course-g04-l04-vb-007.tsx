"use client";

import {G4_L4_VOCABULARY_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-vocabulary-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_VB_007_CONFIG, COURSE_G04_L04_VB_007_SOURCE} from "../timelines/course-g04-l04-vb-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_VB_007_CONFIG, G4_L4_VOCABULARY_HOST_AUDIO_CANDIDATES["course-g04-l04-vb-007"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_VB_007_SOURCE};
export const COURSE_G04_L04_VB_007_MOVIE = candidate.movie;
export const COURSE_G04_L04_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04Vb007Frame = candidate.normalizeFrame;
export const getCourseG04L04Vb007FrameState = candidate.getFrameState;
export const buildCourseG04L04Vb007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04Vb007Renderer = candidate.Renderer;
export default module;
