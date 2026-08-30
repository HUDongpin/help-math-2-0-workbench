"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_VB_014_CONFIG, COURSE_G04_L05_VB_014_SOURCE} from "../timelines/course-g04-l05-vb-014";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_VB_014_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_VB_014_SOURCE};
export const COURSE_G04_L05_VB_014_MOVIE = candidate.movie;
export const COURSE_G04_L05_VB_014_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_VB_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_VB_014_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_VB_014_RENDERER = candidate.Renderer;
export default module;
