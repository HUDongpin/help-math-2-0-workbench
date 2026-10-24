"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_NMS002_L01_P014_CONFIG, SHARED_NMS002_L01_P014_SOURCE} from "../timelines/shared-nms002-l01-p014";

const candidate = createSourceStaticCanvasCandidate(SHARED_NMS002_L01_P014_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P014_SOURCE};
export const SHARED_NMS002_L01_P014_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P014_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P014_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P014_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P014_RENDERER = candidate.Renderer;
export default animationModule;
