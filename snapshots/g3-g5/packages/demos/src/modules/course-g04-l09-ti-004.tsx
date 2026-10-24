"use client";
import {G4_L9_TI004_HOST_AUDIO} from "../modern-lessons/g4-l9-ti004/host-audio.generated";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_TI_004_CONFIG, COURSE_G04_L09_TI_004_SOURCE} from "../timelines/course-g04-l09-ti-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_TI_004_CONFIG);
const module = Object.freeze({...candidate.module, audioCues: G4_L9_TI004_HOST_AUDIO.audioCues, audioTracks: G4_L9_TI004_HOST_AUDIO.audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L09_TI_004_SOURCE};
export const COURSE_G04_L09_TI_004_MOVIE = candidate.movie;
export const COURSE_G04_L09_TI_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_TI_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_TI_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Ti004Frame = candidate.normalizeFrame;
export const getCourseG04L09Ti004FrameState = candidate.getFrameState;
export const buildCourseG04L09Ti004CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Ti004Renderer = candidate.Renderer;
export default module;
