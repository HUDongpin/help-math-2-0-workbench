"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L05_P006_CONFIG, SHARED_GEO001_L05_P006_SOURCE} from "../timelines/shared-geo001-l05-p006";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L05_P006_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L05_P006_SOURCE};
export const SHARED_GEO001_L05_P006_MOVIE = candidate.movie;
export const SHARED_GEO001_L05_P006_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L05_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L05_P006_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L05_P006_RENDERER = candidate.Renderer;
export default animationModule;
