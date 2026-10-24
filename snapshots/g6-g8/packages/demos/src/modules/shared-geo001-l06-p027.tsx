"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L06_P027_CONFIG, SHARED_GEO001_L06_P027_SOURCE} from "../timelines/shared-geo001-l06-p027";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L06_P027_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L06_P027_SOURCE};
export const SHARED_GEO001_L06_P027_MOVIE = candidate.movie;
export const SHARED_GEO001_L06_P027_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L06_P027_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L06_P027_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L06_P027_RENDERER = candidate.Renderer;
export default animationModule;
