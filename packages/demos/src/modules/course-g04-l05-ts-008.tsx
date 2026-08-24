"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_TS_008_CONFIG, COURSE_G04_L05_TS_008_SOURCE} from "../timelines/course-g04-l05-ts-008";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_TS_008_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_TS_008_SOURCE};
export const COURSE_G04_L05_TS_008_MOVIE = candidate.movie;
export const COURSE_G04_L05_TS_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_TS_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_TS_008_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_TS_008_RENDERER = candidate.Renderer;
export default module;
