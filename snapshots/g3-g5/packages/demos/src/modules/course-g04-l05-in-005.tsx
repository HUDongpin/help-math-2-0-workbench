"use client";

import {G4_L5_IN005_HOST_AUDIO_CANDIDATE} from "../modern-lessons/generated/g4-l5-in005-multiples-config";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_005_CONFIG, COURSE_G04_L05_IN_005_SOURCE} from "../timelines/course-g04-l05-in-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_005_CONFIG, G4_L5_IN005_HOST_AUDIO_CANDIDATE);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_005_SOURCE};
export const COURSE_G04_L05_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_005_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_005_RENDERER = candidate.Renderer;
export const getCourseG04L05In005FrameState = candidate.getFrameState;
export const CourseG04L05In005Renderer = candidate.Renderer;
export default module;
