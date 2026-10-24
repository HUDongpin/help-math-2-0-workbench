"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L02_P002_CONFIG, SHARED_GEO001_L02_P002_SOURCE} from "../timelines/shared-geo001-l02-p002";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L02_P002_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L02_P002_SOURCE};
export const SHARED_GEO001_L02_P002_MOVIE = candidate.movie;
export const SHARED_GEO001_L02_P002_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L02_P002_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L02_P002_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L02_P002_RENDERER = candidate.Renderer;
export default animationModule;
