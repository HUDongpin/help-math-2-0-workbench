"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L10_P017_CONFIG, SHARED_GEO001_L10_P017_SOURCE} from "../timelines/shared-geo001-l10-p017";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L10_P017_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L10_P017_SOURCE};
export const SHARED_GEO001_L10_P017_MOVIE = candidate.movie;
export const SHARED_GEO001_L10_P017_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L10_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L10_P017_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L10_P017_RENDERER = candidate.Renderer;
export default animationModule;
