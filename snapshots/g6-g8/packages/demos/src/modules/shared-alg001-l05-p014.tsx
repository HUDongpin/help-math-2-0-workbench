"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L05_P014_CONFIG, SHARED_ALG001_L05_P014_SOURCE} from "../timelines/shared-alg001-l05-p014";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L05_P014_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P014_SOURCE};
export const SHARED_ALG001_L05_P014_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P014_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P014_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P014_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P014_RENDERER = candidate.Renderer;
export default animationModule;
