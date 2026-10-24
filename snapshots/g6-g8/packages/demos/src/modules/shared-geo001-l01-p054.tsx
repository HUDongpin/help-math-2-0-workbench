"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L01_P054_CONFIG, SHARED_GEO001_L01_P054_SOURCE} from "../timelines/shared-geo001-l01-p054";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L01_P054_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P054_SOURCE};
export const SHARED_GEO001_L01_P054_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P054_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P054_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P054_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P054_RENDERER = candidate.Renderer;
export default animationModule;
