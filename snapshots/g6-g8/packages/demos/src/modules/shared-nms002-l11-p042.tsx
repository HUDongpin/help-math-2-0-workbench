"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L11_P042_CONFIG, SHARED_NMS002_L11_P042_SOURCE} from "../timelines/shared-nms002-l11-p042";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L11_P042_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L11_P042_SOURCE};
export const SHARED_NMS002_L11_P042_MOVIE = candidate.movie;
export const SHARED_NMS002_L11_P042_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L11_P042_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L11_P042_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L11_P042_RENDERER = candidate.Renderer;
export default animationModule;
