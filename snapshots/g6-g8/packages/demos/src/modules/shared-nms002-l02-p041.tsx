"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L02_P041_CONFIG, SHARED_NMS002_L02_P041_SOURCE} from "../timelines/shared-nms002-l02-p041";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L02_P041_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L02_P041_SOURCE};
export const SHARED_NMS002_L02_P041_MOVIE = candidate.movie;
export const SHARED_NMS002_L02_P041_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L02_P041_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L02_P041_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L02_P041_RENDERER = candidate.Renderer;
export default animationModule;
