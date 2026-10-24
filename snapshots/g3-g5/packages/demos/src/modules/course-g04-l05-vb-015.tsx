"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_VB_015_CONFIG, COURSE_G04_L05_VB_015_SOURCE} from "../timelines/course-g04-l05-vb-015";

import {VB015_HOST_AUDIO} from "../modern-lessons/g4-l5-vb015/audio.generated";
const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_VB_015_CONFIG, VB015_HOST_AUDIO);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_VB_015_SOURCE};
export const COURSE_G04_L05_VB_015_MOVIE = candidate.movie;
export const COURSE_G04_L05_VB_015_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_VB_015_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_VB_015_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_VB_015_RENDERER = candidate.Renderer;
export default module;

export const getCourseG04L05Vb015FrameState = candidate.getFrameState;
