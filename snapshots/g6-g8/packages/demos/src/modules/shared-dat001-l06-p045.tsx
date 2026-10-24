"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L06_P045_CONFIG, SHARED_DAT001_L06_P045_SOURCE} from "../timelines/shared-dat001-l06-p045";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L06_P045_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L06_P045_SOURCE};
export const SHARED_DAT001_L06_P045_MOVIE = candidate.movie;
export const SHARED_DAT001_L06_P045_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L06_P045_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L06_P045_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L06_P045_RENDERER = candidate.Renderer;
export default animationModule;
