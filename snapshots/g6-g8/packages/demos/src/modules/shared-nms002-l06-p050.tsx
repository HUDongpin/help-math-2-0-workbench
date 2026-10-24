"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L06_P050_CONFIG, SHARED_NMS002_L06_P050_SOURCE} from "../timelines/shared-nms002-l06-p050";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L06_P050_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L06_P050_SOURCE};
export const SHARED_NMS002_L06_P050_MOVIE = candidate.movie;
export const SHARED_NMS002_L06_P050_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L06_P050_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L06_P050_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L06_P050_RENDERER = candidate.Renderer;
export default animationModule;
