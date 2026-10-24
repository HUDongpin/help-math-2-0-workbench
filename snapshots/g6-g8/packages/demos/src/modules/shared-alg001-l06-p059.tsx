"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L06_P059_CONFIG, SHARED_ALG001_L06_P059_SOURCE} from "../timelines/shared-alg001-l06-p059";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L06_P059_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P059_SOURCE};
export const SHARED_ALG001_L06_P059_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P059_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P059_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P059_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P059_RENDERER = candidate.Renderer;
export default animationModule;
