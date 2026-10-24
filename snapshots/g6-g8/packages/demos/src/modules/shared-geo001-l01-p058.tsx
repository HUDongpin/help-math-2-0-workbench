"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L01_P058_CONFIG, SHARED_GEO001_L01_P058_SOURCE} from "../timelines/shared-geo001-l01-p058";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L01_P058_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P058_SOURCE};
export const SHARED_GEO001_L01_P058_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P058_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P058_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P058_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P058_RENDERER = candidate.Renderer;
export default animationModule;
