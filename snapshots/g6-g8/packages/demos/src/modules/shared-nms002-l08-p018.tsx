"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L08_P018_CONFIG, SHARED_NMS002_L08_P018_SOURCE} from "../timelines/shared-nms002-l08-p018";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L08_P018_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L08_P018_SOURCE};
export const SHARED_NMS002_L08_P018_MOVIE = candidate.movie;
export const SHARED_NMS002_L08_P018_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L08_P018_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L08_P018_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L08_P018_RENDERER = candidate.Renderer;
export default animationModule;
