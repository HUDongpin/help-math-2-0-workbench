"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L02_P053_CONFIG, SHARED_ALG001_L02_P053_SOURCE} from "../timelines/shared-alg001-l02-p053";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L02_P053_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L02_P053_SOURCE};
export const SHARED_ALG001_L02_P053_MOVIE = candidate.movie;
export const SHARED_ALG001_L02_P053_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L02_P053_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L02_P053_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L02_P053_RENDERER = candidate.Renderer;
export default animationModule;
