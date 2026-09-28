"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_TI_003_CONFIG, COURSE_G04_L05_TI_003_SOURCE} from "../timelines/course-g04-l05-ti-003";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_TI_003_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_TI_003_SOURCE};
export const COURSE_G04_L05_TI_003_MOVIE = candidate.movie;
export const COURSE_G04_L05_TI_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_TI_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_TI_003_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_TI_003_RENDERER = candidate.Renderer;
export default module;
