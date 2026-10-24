"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L12_P038_CONFIG, SHARED_GEO001_L12_P038_SOURCE} from "../timelines/shared-geo001-l12-p038";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L12_P038_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L12_P038_SOURCE};
export const SHARED_GEO001_L12_P038_MOVIE = candidate.movie;
export const SHARED_GEO001_L12_P038_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L12_P038_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L12_P038_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L12_P038_RENDERER = candidate.Renderer;
export default animationModule;
