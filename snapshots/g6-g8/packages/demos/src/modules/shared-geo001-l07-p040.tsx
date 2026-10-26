"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L07_P040_CONFIG, SHARED_GEO001_L07_P040_SOURCE} from "../timelines/shared-geo001-l07-p040";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L07_P040_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L07_P040_SOURCE};
export const SHARED_GEO001_L07_P040_MOVIE = candidate.movie;
export const SHARED_GEO001_L07_P040_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L07_P040_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L07_P040_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L07_P040_RENDERER = candidate.Renderer;
export default animationModule;
