"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IN_018_CONFIG, COURSE_G04_L05_IN_018_SOURCE} from "../timelines/course-g04-l05-in-018";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IN_018_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IN_018_SOURCE};
export const COURSE_G04_L05_IN_018_MOVIE = candidate.movie;
export const COURSE_G04_L05_IN_018_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IN_018_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IN_018_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IN_018_RENDERER = candidate.Renderer;
export default module;
