"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L01_P031_CONFIG, SHARED_GEO001_L01_P031_SOURCE} from "../timelines/shared-geo001-l01-p031";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L01_P031_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P031_SOURCE};
export const SHARED_GEO001_L01_P031_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P031_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P031_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P031_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P031_RENDERER = candidate.Renderer;
export default animationModule;
