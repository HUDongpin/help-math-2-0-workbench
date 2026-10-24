"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L07_P028_CONFIG, SHARED_ALG001_L07_P028_SOURCE} from "../timelines/shared-alg001-l07-p028";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L07_P028_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L07_P028_SOURCE};
export const SHARED_ALG001_L07_P028_MOVIE = candidate.movie;
export const SHARED_ALG001_L07_P028_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L07_P028_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L07_P028_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L07_P028_RENDERER = candidate.Renderer;
export default animationModule;
