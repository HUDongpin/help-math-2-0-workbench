"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L03_P025_CONFIG, SHARED_NMS002_L03_P025_SOURCE} from "../timelines/shared-nms002-l03-p025";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L03_P025_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L03_P025_SOURCE};
export const SHARED_NMS002_L03_P025_MOVIE = candidate.movie;
export const SHARED_NMS002_L03_P025_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L03_P025_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L03_P025_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L03_P025_RENDERER = candidate.Renderer;
export default animationModule;
