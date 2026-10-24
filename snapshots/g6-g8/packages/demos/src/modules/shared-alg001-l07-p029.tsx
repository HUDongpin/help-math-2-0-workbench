"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L07_P029_CONFIG, SHARED_ALG001_L07_P029_SOURCE} from "../timelines/shared-alg001-l07-p029";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L07_P029_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L07_P029_SOURCE};
export const SHARED_ALG001_L07_P029_MOVIE = candidate.movie;
export const SHARED_ALG001_L07_P029_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L07_P029_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L07_P029_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L07_P029_RENDERER = candidate.Renderer;
export default animationModule;
