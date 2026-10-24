"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L08_P020_CONFIG, SHARED_NMS002_L08_P020_SOURCE} from "../timelines/shared-nms002-l08-p020";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L08_P020_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L08_P020_SOURCE};
export const SHARED_NMS002_L08_P020_MOVIE = candidate.movie;
export const SHARED_NMS002_L08_P020_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L08_P020_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L08_P020_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L08_P020_RENDERER = candidate.Renderer;
export default animationModule;
