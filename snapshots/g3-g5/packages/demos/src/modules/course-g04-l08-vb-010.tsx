"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_VB_010_CONFIG, COURSE_G04_L08_VB_010_SOURCE} from "../timelines/course-g04-l08-vb-010";

import {G4_L8_VOCABULARY_HOST_AUDIO} from "../modern-lessons/g4-l8-vocabulary/host-audio.generated";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_VB_010_CONFIG, G4_L8_VOCABULARY_HOST_AUDIO["course-g04-l08-vb-010"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_VB_010_SOURCE};
export const COURSE_G04_L08_VB_010_MOVIE = candidate.movie;
export const COURSE_G04_L08_VB_010_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_VB_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_VB_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Vb010Frame = candidate.normalizeFrame;
export const getCourseG04L08Vb010FrameState = candidate.getFrameState;
export const buildCourseG04L08Vb010CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Vb010Renderer = candidate.Renderer;
export default module;
