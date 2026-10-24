"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L05_P005_CONFIG, SHARED_GEO001_L05_P005_SOURCE} from "../timelines/shared-geo001-l05-p005";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L05_P005_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L05_P005_SOURCE};
export const SHARED_GEO001_L05_P005_MOVIE = candidate.movie;
export const SHARED_GEO001_L05_P005_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L05_P005_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L05_P005_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L05_P005_RENDERER = candidate.Renderer;
export default animationModule;
