"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_VB_013_CONFIG, COURSE_G04_L05_VB_013_SOURCE} from "../timelines/course-g04-l05-vb-013";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_VB_013_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_VB_013_SOURCE};
export const COURSE_G04_L05_VB_013_MOVIE = candidate.movie;
export const COURSE_G04_L05_VB_013_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_VB_013_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_VB_013_RENDERER = candidate.Renderer;
export default module;
