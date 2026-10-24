"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L08_P033_CONFIG, SHARED_DAT001_L08_P033_SOURCE} from "../timelines/shared-dat001-l08-p033";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L08_P033_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L08_P033_SOURCE};
export const SHARED_DAT001_L08_P033_MOVIE = candidate.movie;
export const SHARED_DAT001_L08_P033_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L08_P033_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L08_P033_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L08_P033_RENDERER = candidate.Renderer;
export default animationModule;
