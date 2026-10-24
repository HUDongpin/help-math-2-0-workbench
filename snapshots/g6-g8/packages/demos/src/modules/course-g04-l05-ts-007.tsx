"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_TS_007_CONFIG, COURSE_G04_L05_TS_007_SOURCE} from "../timelines/course-g04-l05-ts-007";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_TS_007_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_TS_007_SOURCE};
export const COURSE_G04_L05_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L05_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_TS_007_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_TS_007_RENDERER = candidate.Renderer;
export default module;
