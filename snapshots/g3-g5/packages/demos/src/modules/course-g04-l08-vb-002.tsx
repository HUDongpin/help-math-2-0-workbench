"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_VB_002_CONFIG, COURSE_G04_L08_VB_002_SOURCE} from "../timelines/course-g04-l08-vb-002";

import {G4_L8_VOCABULARY_HOST_AUDIO} from "../modern-lessons/g4-l8-vocabulary/host-audio.generated";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_VB_002_CONFIG, G4_L8_VOCABULARY_HOST_AUDIO["course-g04-l08-vb-002"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_VB_002_SOURCE};
export const COURSE_G04_L08_VB_002_MOVIE = candidate.movie;
export const COURSE_G04_L08_VB_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_VB_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_VB_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Vb002Frame = candidate.normalizeFrame;
export const getCourseG04L08Vb002FrameState = candidate.getFrameState;
export const buildCourseG04L08Vb002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Vb002Renderer = candidate.Renderer;
export default module;
