"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L01_P055_CONFIG, SHARED_ALG001_L01_P055_SOURCE} from "../timelines/shared-alg001-l01-p055";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L01_P055_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L01_P055_SOURCE};
export const SHARED_ALG001_L01_P055_MOVIE = candidate.movie;
export const SHARED_ALG001_L01_P055_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L01_P055_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L01_P055_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L01_P055_RENDERER = candidate.Renderer;
export default animationModule;
