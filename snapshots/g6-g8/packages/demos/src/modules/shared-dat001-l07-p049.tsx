"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L07_P049_CONFIG, SHARED_DAT001_L07_P049_SOURCE} from "../timelines/shared-dat001-l07-p049";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L07_P049_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L07_P049_SOURCE};
export const SHARED_DAT001_L07_P049_MOVIE = candidate.movie;
export const SHARED_DAT001_L07_P049_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L07_P049_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L07_P049_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L07_P049_RENDERER = candidate.Renderer;
export default animationModule;
