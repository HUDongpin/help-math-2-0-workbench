"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L07_P061_CONFIG, SHARED_ALG001_L07_P061_SOURCE} from "../timelines/shared-alg001-l07-p061";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L07_P061_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L07_P061_SOURCE};
export const SHARED_ALG001_L07_P061_MOVIE = candidate.movie;
export const SHARED_ALG001_L07_P061_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L07_P061_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L07_P061_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L07_P061_RENDERER = candidate.Renderer;
export default animationModule;
