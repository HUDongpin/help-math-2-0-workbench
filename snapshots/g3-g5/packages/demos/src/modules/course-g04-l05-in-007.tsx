"use client";

import {IN007_HOST_AUDIO} from "../modern-lessons/g4-l5-in007/audio.generated";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_007_CONFIG, COURSE_G04_L05_IN_007_SOURCE} from "../timelines/course-g04-l05-in-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_007_CONFIG,IN007_HOST_AUDIO);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_007_SOURCE};
export const COURSE_G04_L05_IN_007_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_007_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_007_RENDERER = candidate.Renderer;
export const getCourseG04L05In007FrameState = candidate.getFrameState;
export default module;
