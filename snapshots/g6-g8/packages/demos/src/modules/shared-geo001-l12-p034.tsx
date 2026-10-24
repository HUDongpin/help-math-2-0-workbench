"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L12_P034_CONFIG, SHARED_GEO001_L12_P034_SOURCE} from "../timelines/shared-geo001-l12-p034";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L12_P034_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L12_P034_SOURCE};
export const SHARED_GEO001_L12_P034_MOVIE = candidate.movie;
export const SHARED_GEO001_L12_P034_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L12_P034_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L12_P034_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L12_P034_RENDERER = candidate.Renderer;
export default animationModule;
