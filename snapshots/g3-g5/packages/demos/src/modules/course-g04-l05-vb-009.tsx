"use client";

import {G4_L5_MULTIPLES_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l5-multiples-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_VB_009_CONFIG, COURSE_G04_L05_VB_009_SOURCE} from "../timelines/course-g04-l05-vb-009";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_VB_009_CONFIG, G4_L5_MULTIPLES_HOST_AUDIO_CANDIDATES["course-g04-l05-vb-009"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_VB_009_SOURCE};
export const COURSE_G04_L05_VB_009_MOVIE = candidate.movie;
export const COURSE_G04_L05_VB_009_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_VB_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_VB_009_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_VB_009_RENDERER = candidate.Renderer;
export const getCourseG04L05Vb009FrameState = candidate.getFrameState;
export const CourseG04L05Vb009Renderer = candidate.Renderer;
export default module;
