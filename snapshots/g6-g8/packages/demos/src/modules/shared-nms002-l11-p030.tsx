"use client";

import {createNms002AdvancedManualCandidate} from "../g678-advanced-manual/current-js-wrappers";
import {SHARED_NMS002_L11_P030_CONFIG, SHARED_NMS002_L11_P030_SOURCE} from "../timelines/shared-nms002-l11-p030";

const candidate = createNms002AdvancedManualCandidate({config: SHARED_NMS002_L11_P030_CONFIG, sourceContract: SHARED_NMS002_L11_P030_SOURCE, interactiveStops: SHARED_NMS002_L11_P030_SOURCE.interactiveStops, interactiveSeek: SHARED_NMS002_L11_P030_SOURCE.interactiveSeek});

export {SHARED_NMS002_L11_P030_SOURCE};
export const SHARED_NMS002_L11_P030_MOVIE = candidate.movie;
export const SHARED_NMS002_L11_P030_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L11_P030_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L11_P030_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L11_P030_RENDERER = candidate.Renderer;
export default candidate.module;
