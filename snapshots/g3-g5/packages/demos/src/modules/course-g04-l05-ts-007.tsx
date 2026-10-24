"use client";

import {G4_L5_PRACTICE_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l5-practice-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_TS_007_CONFIG, COURSE_G04_L05_TS_007_SOURCE} from "../timelines/course-g04-l05-ts-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_TS_007_CONFIG, G4_L5_PRACTICE_HOST_AUDIO_CANDIDATES["course-g04-l05-ts-007"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_TS_007_SOURCE};
export const COURSE_G04_L05_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L05_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_TS_007_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_TS_007_RENDERER = candidate.Renderer;
export const getCourseG04L05Ts007FrameState = candidate.getFrameState;
export default module;
