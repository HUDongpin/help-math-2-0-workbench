"use client";
import {G4_L9_UNKNOWN_SOLVE_HOST_AUDIO} from "../modern-lessons/g4-l9-unknown-solve/host-audio.generated";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_VB_005_CONFIG, COURSE_G04_L09_VB_005_SOURCE} from "../timelines/course-g04-l09-vb-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_VB_005_CONFIG);
const hostAudio = G4_L9_UNKNOWN_SOLVE_HOST_AUDIO["course-g04-l09-vb-005"];
const module = Object.freeze({...candidate.module, audioCues: hostAudio.audioCues, audioTracks: hostAudio.audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L09_VB_005_SOURCE};
export const COURSE_G04_L09_VB_005_MOVIE = candidate.movie;
export const COURSE_G04_L09_VB_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_VB_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Vb005Frame = candidate.normalizeFrame;
export const getCourseG04L09Vb005FrameState = candidate.getFrameState;
export const buildCourseG04L09Vb005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Vb005Renderer = candidate.Renderer;
export default module;
