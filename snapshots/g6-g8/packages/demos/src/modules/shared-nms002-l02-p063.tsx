"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L02_P063_CONFIG, SHARED_NMS002_L02_P063_SOURCE} from "../timelines/shared-nms002-l02-p063";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L02_P063_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L02_P063_SOURCE};
export const SHARED_NMS002_L02_P063_MOVIE = candidate.movie;
export const SHARED_NMS002_L02_P063_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L02_P063_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L02_P063_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L02_P063_RENDERER = candidate.Renderer;
export default animationModule;
