"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L03_P051_CONFIG, SHARED_NMS002_L03_P051_SOURCE} from "../timelines/shared-nms002-l03-p051";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L03_P051_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L03_P051_SOURCE};
export const SHARED_NMS002_L03_P051_MOVIE = candidate.movie;
export const SHARED_NMS002_L03_P051_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L03_P051_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L03_P051_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L03_P051_RENDERER = candidate.Renderer;
export default animationModule;
