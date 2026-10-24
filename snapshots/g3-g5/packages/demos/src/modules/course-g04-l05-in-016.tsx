"use client";

import {G4_L5_LATTICE_FOIL_CHOICE_HOST_AUDIO_CANDIDATES} from '../modern-lessons/generated/g4-l5-lattice-foil-choice-config';
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_016_CONFIG, COURSE_G04_L05_IN_016_SOURCE} from "../timelines/course-g04-l05-in-016";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_016_CONFIG);
const module = Object.freeze({...candidate.module, audioTracks:G4_L5_LATTICE_FOIL_CHOICE_HOST_AUDIO_CANDIDATES["course-g04-l05-in-016"].audioTracks, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_016_SOURCE};
export const COURSE_G04_L05_IN_016_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_016_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_016_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_016_RENDERER = candidate.Renderer;
export const getCourseG04L05In016FrameState = candidate.getFrameState;
export const CourseG04L05In016Renderer = candidate.Renderer;
export default module;
