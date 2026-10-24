"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_VB_008_CONFIG, COURSE_G04_L08_VB_008_SOURCE} from "../timelines/course-g04-l08-vb-008";

import {G4_L8_VB008_HOST_AUDIO} from "../modern-lessons/g4-l8-vb008/host-audio.generated";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_VB_008_CONFIG, G4_L8_VB008_HOST_AUDIO["course-g04-l08-vb-008"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_VB_008_SOURCE};
export const COURSE_G04_L08_VB_008_MOVIE = candidate.movie;
export const COURSE_G04_L08_VB_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_VB_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_VB_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Vb008Frame = candidate.normalizeFrame;
export const getCourseG04L08Vb008FrameState = candidate.getFrameState;
export const buildCourseG04L08Vb008CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Vb008Renderer = candidate.Renderer;
export default module;
