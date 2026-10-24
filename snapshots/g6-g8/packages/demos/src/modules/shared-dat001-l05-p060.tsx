"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L05_P060_CONFIG, SHARED_DAT001_L05_P060_SOURCE} from "../timelines/shared-dat001-l05-p060";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L05_P060_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L05_P060_SOURCE};
export const SHARED_DAT001_L05_P060_MOVIE = candidate.movie;
export const SHARED_DAT001_L05_P060_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L05_P060_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L05_P060_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L05_P060_RENDERER = candidate.Renderer;
export default animationModule;
