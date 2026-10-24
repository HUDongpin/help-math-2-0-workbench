"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L10_P024_CONFIG, SHARED_GEO001_L10_P024_SOURCE} from "../timelines/shared-geo001-l10-p024";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L10_P024_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L10_P024_SOURCE};
export const SHARED_GEO001_L10_P024_MOVIE = candidate.movie;
export const SHARED_GEO001_L10_P024_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L10_P024_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L10_P024_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L10_P024_RENDERER = candidate.Renderer;
export default animationModule;
