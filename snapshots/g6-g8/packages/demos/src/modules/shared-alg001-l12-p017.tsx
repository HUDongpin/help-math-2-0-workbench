"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L12_P017_CONFIG, SHARED_ALG001_L12_P017_SOURCE} from "../timelines/shared-alg001-l12-p017";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P017_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L12_P017_SOURCE};
export const SHARED_ALG001_L12_P017_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P017_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P017_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P017_RENDERER = candidate.Renderer;
export default animationModule;
