"use client";

import {G4_L5_VOCABULARY_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l5-vocabulary-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_014_CONFIG, COURSE_G04_L05_IN_014_SOURCE} from "../timelines/course-g04-l05-in-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_014_CONFIG,G4_L5_VOCABULARY_HOST_AUDIO_CANDIDATES["course-g04-l05-in-014"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_014_SOURCE};
export const COURSE_G04_L05_IN_014_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_014_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_014_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_014_RENDERER = candidate.Renderer;
export const getCourseG04L05In014FrameState = candidate.getFrameState;
export default module;
