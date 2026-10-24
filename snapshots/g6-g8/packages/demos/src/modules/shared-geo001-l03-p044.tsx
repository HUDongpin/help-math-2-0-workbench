"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L03_P044_CONFIG, SHARED_GEO001_L03_P044_SOURCE} from "../timelines/shared-geo001-l03-p044";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L03_P044_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L03_P044_SOURCE};
export const SHARED_GEO001_L03_P044_MOVIE = candidate.movie;
export const SHARED_GEO001_L03_P044_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L03_P044_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L03_P044_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L03_P044_RENDERER = candidate.Renderer;
export default animationModule;
