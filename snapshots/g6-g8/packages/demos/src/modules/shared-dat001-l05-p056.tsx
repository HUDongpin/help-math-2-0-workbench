"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {SHARED_DAT001_L05_P056_CONFIG, SHARED_DAT001_L05_P056_SOURCE} from "../timelines/shared-dat001-l05-p056";

const candidate = createSourceStaticCanvasCandidate(SHARED_DAT001_L05_P056_CONFIG);
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L05_P056_SOURCE};
export const SHARED_DAT001_L05_P056_MOVIE = candidate.movie;
export const SHARED_DAT001_L05_P056_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L05_P056_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L05_P056_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L05_P056_RENDERER = candidate.Renderer;
export default animationModule;
