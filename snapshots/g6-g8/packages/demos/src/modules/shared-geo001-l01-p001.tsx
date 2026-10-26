"use client";

import {createGeo001AdvancedManualCandidate} from "../g678-advanced-manual/current-js-wrappers";
import {SHARED_GEO001_L01_P001_CONFIG, SHARED_GEO001_L01_P001_SOURCE} from "../timelines/shared-geo001-l01-p001";

const candidate = createGeo001AdvancedManualCandidate({config: SHARED_GEO001_L01_P001_CONFIG, sourceContract: SHARED_GEO001_L01_P001_SOURCE, interactiveStops: SHARED_GEO001_L01_P001_SOURCE.interactiveStops, interactiveSeek: SHARED_GEO001_L01_P001_SOURCE.interactiveSeek});

export {SHARED_GEO001_L01_P001_SOURCE};
export const SHARED_GEO001_L01_P001_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P001_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P001_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P001_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P001_RENDERER = candidate.Renderer;
export default candidate.module;
