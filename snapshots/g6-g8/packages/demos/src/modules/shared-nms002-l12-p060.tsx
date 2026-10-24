"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L12_P060_CONFIG, SHARED_NMS002_L12_P060_SOURCE} from "../timelines/shared-nms002-l12-p060";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L12_P060_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L12_P060_SOURCE};
export const SHARED_NMS002_L12_P060_MOVIE = candidate.movie;
export const SHARED_NMS002_L12_P060_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L12_P060_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L12_P060_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L12_P060_RENDERER = candidate.Renderer;
export default animationModule;
