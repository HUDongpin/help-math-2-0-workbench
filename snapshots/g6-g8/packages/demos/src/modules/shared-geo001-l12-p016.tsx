"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L12_P016_CONFIG, SHARED_GEO001_L12_P016_SOURCE} from "../timelines/shared-geo001-l12-p016";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L12_P016_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L12_P016_SOURCE};
export const SHARED_GEO001_L12_P016_MOVIE = candidate.movie;
export const SHARED_GEO001_L12_P016_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L12_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L12_P016_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L12_P016_RENDERER = candidate.Renderer;
export default animationModule;
