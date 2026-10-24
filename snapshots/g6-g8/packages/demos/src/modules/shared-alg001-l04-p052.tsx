"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L04_P052_CONFIG, SHARED_ALG001_L04_P052_SOURCE} from "../timelines/shared-alg001-l04-p052";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L04_P052_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L04_P052_SOURCE};
export const SHARED_ALG001_L04_P052_MOVIE = candidate.movie;
export const SHARED_ALG001_L04_P052_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L04_P052_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L04_P052_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L04_P052_RENDERER = candidate.Renderer;
export default animationModule;
