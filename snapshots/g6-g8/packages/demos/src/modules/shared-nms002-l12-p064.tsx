"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L12_P064_CONFIG, SHARED_NMS002_L12_P064_SOURCE} from "../timelines/shared-nms002-l12-p064";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L12_P064_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L12_P064_SOURCE};
export const SHARED_NMS002_L12_P064_MOVIE = candidate.movie;
export const SHARED_NMS002_L12_P064_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L12_P064_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L12_P064_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L12_P064_RENDERER = candidate.Renderer;
export default animationModule;
