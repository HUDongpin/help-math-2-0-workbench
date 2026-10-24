"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L06_P039_CONFIG, SHARED_ALG001_L06_P039_SOURCE} from "../timelines/shared-alg001-l06-p039";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L06_P039_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P039_SOURCE};
export const SHARED_ALG001_L06_P039_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P039_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P039_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P039_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P039_RENDERER = candidate.Renderer;
export default animationModule;
