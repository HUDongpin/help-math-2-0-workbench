"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L06_P021_CONFIG, SHARED_NMS002_L06_P021_SOURCE} from "../timelines/shared-nms002-l06-p021";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L06_P021_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L06_P021_SOURCE};
export const SHARED_NMS002_L06_P021_MOVIE = candidate.movie;
export const SHARED_NMS002_L06_P021_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L06_P021_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L06_P021_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L06_P021_RENDERER = candidate.Renderer;
export default animationModule;
