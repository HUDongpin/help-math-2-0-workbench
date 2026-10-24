"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L06_P022_CONFIG, SHARED_GEO001_L06_P022_SOURCE} from "../timelines/shared-geo001-l06-p022";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L06_P022_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L06_P022_SOURCE};
export const SHARED_GEO001_L06_P022_MOVIE = candidate.movie;
export const SHARED_GEO001_L06_P022_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L06_P022_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L06_P022_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L06_P022_RENDERER = candidate.Renderer;
export default animationModule;
