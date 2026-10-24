"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L09_P036_CONFIG, SHARED_ALG001_L09_P036_SOURCE} from "../timelines/shared-alg001-l09-p036";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L09_P036_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P036_SOURCE};
export const SHARED_ALG001_L09_P036_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P036_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P036_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P036_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P036_RENDERER = candidate.Renderer;
export default animationModule;
