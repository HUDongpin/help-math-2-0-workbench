"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L10_P004_CONFIG, SHARED_GEO001_L10_P004_SOURCE} from "../timelines/shared-geo001-l10-p004";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L10_P004_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L10_P004_SOURCE};
export const SHARED_GEO001_L10_P004_MOVIE = candidate.movie;
export const SHARED_GEO001_L10_P004_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L10_P004_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L10_P004_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L10_P004_RENDERER = candidate.Renderer;
export default animationModule;
