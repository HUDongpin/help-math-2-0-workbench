"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L05_IR_001_CONFIG, COURSE_G04_L05_IR_001_SOURCE} from "../timelines/course-g04-l05-ir-001";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L05_IR_001_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L05_IR_001_SOURCE};
export const COURSE_G04_L05_IR_001_MOVIE = candidate.movie;
export const COURSE_G04_L05_IR_001_RUNTIME = candidate.runtime;
export const COURSE_G04_L05_IR_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L05_IR_001_SCENARIOS = candidate.scenarios;
export const COURSE_G04_L05_IR_001_RENDERER = candidate.Renderer;
export default module;
