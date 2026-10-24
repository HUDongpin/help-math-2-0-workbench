"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L04_P002_CONFIG, SHARED_NMS002_L04_P002_SOURCE} from "../timelines/shared-nms002-l04-p002";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L04_P002_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L04_P002_SOURCE};
export const SHARED_NMS002_L04_P002_MOVIE = candidate.movie;
export const SHARED_NMS002_L04_P002_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L04_P002_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L04_P002_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L04_P002_RENDERER = candidate.Renderer;
export default animationModule;
