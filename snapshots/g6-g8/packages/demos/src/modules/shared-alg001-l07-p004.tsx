"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L07_P004_CONFIG, SHARED_ALG001_L07_P004_SOURCE} from "../timelines/shared-alg001-l07-p004";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L07_P004_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L07_P004_SOURCE};
export const SHARED_ALG001_L07_P004_MOVIE = candidate.movie;
export const SHARED_ALG001_L07_P004_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L07_P004_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L07_P004_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L07_P004_RENDERER = candidate.Renderer;
export default animationModule;
