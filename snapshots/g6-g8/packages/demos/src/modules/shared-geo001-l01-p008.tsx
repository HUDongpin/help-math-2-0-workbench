"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L01_P008_CONFIG, SHARED_GEO001_L01_P008_SOURCE} from "../timelines/shared-geo001-l01-p008";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L01_P008_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P008_SOURCE};
export const SHARED_GEO001_L01_P008_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P008_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P008_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P008_RENDERER = candidate.Renderer;
export default animationModule;
