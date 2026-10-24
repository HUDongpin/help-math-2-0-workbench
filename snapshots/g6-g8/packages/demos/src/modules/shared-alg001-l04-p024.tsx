"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L04_P024_CONFIG, SHARED_ALG001_L04_P024_SOURCE} from "../timelines/shared-alg001-l04-p024";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L04_P024_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L04_P024_SOURCE};
export const SHARED_ALG001_L04_P024_MOVIE = candidate.movie;
export const SHARED_ALG001_L04_P024_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L04_P024_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L04_P024_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L04_P024_RENDERER = candidate.Renderer;
export default animationModule;
