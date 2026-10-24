"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_ALG001_L06_P007_CONFIG, SHARED_ALG001_L06_P007_SOURCE} from "../timelines/shared-alg001-l06-p007";

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L06_P007_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P007_SOURCE};
export const SHARED_ALG001_L06_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P007_RENDERER = candidate.Renderer;
export default animationModule;
