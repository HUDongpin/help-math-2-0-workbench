"use client";

import {G4_L5_COMMON_METHOD_CHOICE_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l5-common-method-choice-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_019_CONFIG, COURSE_G04_L05_IN_019_SOURCE} from "../timelines/course-g04-l05-in-019";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_019_CONFIG, G4_L5_COMMON_METHOD_CHOICE_HOST_AUDIO_CANDIDATES["course-g04-l05-in-019"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_019_SOURCE};
export const COURSE_G04_L05_IN_019_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_019_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_019_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_019_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_019_RENDERER = candidate.Renderer;
export const getCourseG04L05In019FrameState = candidate.getFrameState;
export const CourseG04L05In019Renderer = candidate.Renderer;
export default module;
