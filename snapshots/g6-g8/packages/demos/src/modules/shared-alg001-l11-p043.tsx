"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L11_P043_CONFIG, SHARED_ALG001_L11_P043_SOURCE} from "../timelines/shared-alg001-l11-p043";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L11_P043_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P043_SOURCE};
export const SHARED_ALG001_L11_P043_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P043_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P043_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P043_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P043_RENDERER = candidate.Renderer;
export default animationModule;
