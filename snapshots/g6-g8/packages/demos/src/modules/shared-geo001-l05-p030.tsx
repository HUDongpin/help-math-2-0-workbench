"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L05_P030_CONFIG, SHARED_GEO001_L05_P030_SOURCE} from "../timelines/shared-geo001-l05-p030";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L05_P030_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L05_P030_SOURCE};
export const SHARED_GEO001_L05_P030_MOVIE = candidate.movie;
export const SHARED_GEO001_L05_P030_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L05_P030_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L05_P030_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L05_P030_RENDERER = candidate.Renderer;
export default animationModule;
