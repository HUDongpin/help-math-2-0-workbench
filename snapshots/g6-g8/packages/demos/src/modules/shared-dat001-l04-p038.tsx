"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L04_P038_CONFIG, SHARED_DAT001_L04_P038_SOURCE} from "../timelines/shared-dat001-l04-p038";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L04_P038_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L04_P038_SOURCE};
export const SHARED_DAT001_L04_P038_MOVIE = candidate.movie;
export const SHARED_DAT001_L04_P038_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L04_P038_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L04_P038_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L04_P038_RENDERER = candidate.Renderer;
export default animationModule;
