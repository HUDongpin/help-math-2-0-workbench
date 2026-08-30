"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_017_CONFIG, COURSE_G04_L05_IN_017_SOURCE} from "../timelines/course-g04-l05-in-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_017_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_017_SOURCE};
export const COURSE_G04_L05_IN_017_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_017_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_017_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_017_RENDERER = candidate.Renderer;
export default module;
