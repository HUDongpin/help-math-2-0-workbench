"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_VB_004_CONFIG, COURSE_G04_L05_VB_004_SOURCE} from "../timelines/course-g04-l05-vb-004";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_VB_004_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_VB_004_SOURCE};
export const COURSE_G04_L05_VB_004_MOVIE = candidate.movie;
export const COURSE_G04_L05_VB_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_VB_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_VB_004_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_VB_004_RENDERER = candidate.Renderer;
export default module;
