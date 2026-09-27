"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_TS_002_CONFIG, COURSE_G04_L05_TS_002_SOURCE} from "../timelines/course-g04-l05-ts-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_TS_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_TS_002_SOURCE};
export const COURSE_G04_L05_TS_002_MOVIE = candidate.movie;
export const COURSE_G04_L05_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_TS_002_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_TS_002_RENDERER = candidate.Renderer;
export default module;
