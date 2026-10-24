"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L06_P005_CONFIG, SHARED_DAT001_L06_P005_SOURCE} from "../timelines/shared-dat001-l06-p005";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L06_P005_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L06_P005_SOURCE};
export const SHARED_DAT001_L06_P005_MOVIE = candidate.movie;
export const SHARED_DAT001_L06_P005_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L06_P005_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L06_P005_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L06_P005_RENDERER = candidate.Renderer;
export default animationModule;
