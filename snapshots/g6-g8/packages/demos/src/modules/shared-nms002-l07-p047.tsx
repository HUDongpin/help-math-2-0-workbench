"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L07_P047_CONFIG, SHARED_NMS002_L07_P047_SOURCE} from "../timelines/shared-nms002-l07-p047";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L07_P047_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L07_P047_SOURCE};
export const SHARED_NMS002_L07_P047_MOVIE = candidate.movie;
export const SHARED_NMS002_L07_P047_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L07_P047_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L07_P047_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L07_P047_RENDERER = candidate.Renderer;
export default animationModule;
