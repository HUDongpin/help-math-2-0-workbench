"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_RW_004_CONFIG, COURSE_G04_L05_RW_004_SOURCE} from "../timelines/course-g04-l05-rw-004";

import {HOST_AUDIO} from "../modern-lessons/g4-l5-talent-show/rw004-audio.generated";
const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_RW_004_CONFIG, HOST_AUDIO);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_RW_004_SOURCE};
export const COURSE_G04_L05_RW_004_MOVIE = candidate.movie;
export const COURSE_G04_L05_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_RW_004_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_RW_004_RENDERER = candidate.Renderer;
export default module;

export const getCourseG04L05Rw004FrameState = candidate.module.getFrameState;
