"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L02_P050_CONFIG, SHARED_GEO001_L02_P050_SOURCE} from "../timelines/shared-geo001-l02-p050";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L02_P050_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L02_P050_SOURCE};
export const SHARED_GEO001_L02_P050_MOVIE = candidate.movie;
export const SHARED_GEO001_L02_P050_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L02_P050_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L02_P050_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L02_P050_RENDERER = candidate.Renderer;
export default animationModule;
