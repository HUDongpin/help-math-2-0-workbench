"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L05_P062_CONFIG, SHARED_ALG001_L05_P062_SOURCE} from "../timelines/shared-alg001-l05-p062";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L05_P062_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P062_SOURCE};
export const SHARED_ALG001_L05_P062_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P062_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P062_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P062_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P062_RENDERER = candidate.Renderer;
export default animationModule;
