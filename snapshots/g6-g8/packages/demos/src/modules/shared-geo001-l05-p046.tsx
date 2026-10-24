"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_GEO001_L05_P046_CONFIG, SHARED_GEO001_L05_P046_SOURCE} from "../timelines/shared-geo001-l05-p046";

const candidate = createSourceStaticCanvasCandidate(SHARED_GEO001_L05_P046_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L05_P046_SOURCE};
export const SHARED_GEO001_L05_P046_MOVIE = candidate.movie;
export const SHARED_GEO001_L05_P046_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L05_P046_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L05_P046_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L05_P046_RENDERER = candidate.Renderer;
export default animationModule;
