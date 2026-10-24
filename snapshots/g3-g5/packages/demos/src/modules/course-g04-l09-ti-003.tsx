"use client";
import {G4_L9_TI003_HOST_AUDIO} from "../modern-lessons/g4-l9-ti003/host-audio.generated";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L09_TI_003_CONFIG, COURSE_G04_L09_TI_003_SOURCE} from "../timelines/course-g04-l09-ti-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L09_TI_003_CONFIG);
const module = Object.freeze({...candidate.module, audioCues: G4_L9_TI003_HOST_AUDIO.audioCues, audioTracks: G4_L9_TI003_HOST_AUDIO.audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L09_TI_003_SOURCE};
export const COURSE_G04_L09_TI_003_MOVIE = candidate.movie;
export const COURSE_G04_L09_TI_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L09_TI_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L09_TI_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L09Ti003Frame = candidate.normalizeFrame;
export const getCourseG04L09Ti003FrameState = candidate.getFrameState;
export const buildCourseG04L09Ti003CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L09Ti003Renderer = candidate.Renderer;
export default module;
