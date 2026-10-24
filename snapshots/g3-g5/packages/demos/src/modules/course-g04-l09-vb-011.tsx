"use client";
import {G4_L9_VB011_HOST_AUDIO} from "../modern-lessons/g4-l9-vb011/host-audio.generated";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_VB_011_CONFIG, COURSE_G04_L09_VB_011_SOURCE} from "../timelines/course-g04-l09-vb-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_VB_011_CONFIG);
const module = Object.freeze({...candidate.module, audioCues: G4_L9_VB011_HOST_AUDIO.audioCues, audioTracks: G4_L9_VB011_HOST_AUDIO.audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L09_VB_011_SOURCE};
export const COURSE_G04_L09_VB_011_MOVIE = candidate.movie;
export const COURSE_G04_L09_VB_011_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_VB_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_VB_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Vb011Frame = candidate.normalizeFrame;
export const getCourseG04L09Vb011FrameState = candidate.getFrameState;
export const buildCourseG04L09Vb011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Vb011Renderer = candidate.Renderer;
export default module;
