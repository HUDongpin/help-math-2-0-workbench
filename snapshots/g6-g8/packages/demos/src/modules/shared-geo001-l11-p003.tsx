"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L11_P003_CONFIG, SHARED_GEO001_L11_P003_SOURCE} from "../timelines/shared-geo001-l11-p003";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L11_P003_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L11_P003_SOURCE};
export const SHARED_GEO001_L11_P003_MOVIE = candidate.movie;
export const SHARED_GEO001_L11_P003_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L11_P003_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L11_P003_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L11_P003_RENDERER = candidate.Renderer;
export default animationModule;
