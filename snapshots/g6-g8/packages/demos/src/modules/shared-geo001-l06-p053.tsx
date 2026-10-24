"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L06_P053_CONFIG, SHARED_GEO001_L06_P053_SOURCE} from "../timelines/shared-geo001-l06-p053";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L06_P053_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L06_P053_SOURCE};
export const SHARED_GEO001_L06_P053_MOVIE = candidate.movie;
export const SHARED_GEO001_L06_P053_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L06_P053_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L06_P053_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L06_P053_RENDERER = candidate.Renderer;
export default animationModule;
