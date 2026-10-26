"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L08_P025_CONFIG, SHARED_ALG001_L08_P025_SOURCE} from "../timelines/shared-alg001-l08-p025";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L08_P025_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L08_P025_SOURCE};
export const SHARED_ALG001_L08_P025_MOVIE = candidate.movie;
export const SHARED_ALG001_L08_P025_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L08_P025_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L08_P025_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L08_P025_RENDERER = candidate.Renderer;
export default animationModule;
