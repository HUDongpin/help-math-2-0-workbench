"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L09_P052_CONFIG, SHARED_NMS002_L09_P052_SOURCE} from "../timelines/shared-nms002-l09-p052";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L09_P052_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L09_P052_SOURCE};
export const SHARED_NMS002_L09_P052_MOVIE = candidate.movie;
export const SHARED_NMS002_L09_P052_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L09_P052_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L09_P052_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L09_P052_RENDERER = candidate.Renderer;
export default animationModule;
