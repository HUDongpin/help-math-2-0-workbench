"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L07_P057_CONFIG, SHARED_ALG001_L07_P057_SOURCE} from "../timelines/shared-alg001-l07-p057";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L07_P057_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L07_P057_SOURCE};
export const SHARED_ALG001_L07_P057_MOVIE = candidate.movie;
export const SHARED_ALG001_L07_P057_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L07_P057_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L07_P057_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L07_P057_RENDERER = candidate.Renderer;
export default animationModule;
