"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_005_CONFIG, COURSE_G04_L05_IN_005_SOURCE} from "../timelines/course-g04-l05-in-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_005_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_005_SOURCE};
export const COURSE_G04_L05_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_005_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_005_RENDERER = candidate.Renderer;
export default module;
