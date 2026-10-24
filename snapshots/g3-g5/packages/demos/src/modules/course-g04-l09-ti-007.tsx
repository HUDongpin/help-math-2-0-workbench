"use client";
import {G4_L9_TI007_HOST_AUDIO} from "../modern-lessons/g4-l9-ti007/host-audio.generated";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_TI_007_CONFIG, COURSE_G04_L09_TI_007_SOURCE} from "../timelines/course-g04-l09-ti-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_TI_007_CONFIG);
const module = Object.freeze({...candidate.module, audioCues: G4_L9_TI007_HOST_AUDIO.audioCues, audioTracks: G4_L9_TI007_HOST_AUDIO.audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L09_TI_007_SOURCE};
export const COURSE_G04_L09_TI_007_MOVIE = candidate.movie;
export const COURSE_G04_L09_TI_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_TI_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_TI_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Ti007Frame = candidate.normalizeFrame;
export const getCourseG04L09Ti007FrameState = candidate.getFrameState;
export const buildCourseG04L09Ti007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Ti007Renderer = candidate.Renderer;
export default module;
