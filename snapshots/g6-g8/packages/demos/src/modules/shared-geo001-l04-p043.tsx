"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L04_P043_CONFIG, SHARED_GEO001_L04_P043_SOURCE} from "../timelines/shared-geo001-l04-p043";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L04_P043_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L04_P043_SOURCE};
export const SHARED_GEO001_L04_P043_MOVIE = candidate.movie;
export const SHARED_GEO001_L04_P043_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L04_P043_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L04_P043_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L04_P043_RENDERER = candidate.Renderer;
export default animationModule;
