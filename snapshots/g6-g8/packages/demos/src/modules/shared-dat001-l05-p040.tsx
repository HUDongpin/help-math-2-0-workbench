"use client";

import {createDat001AdvancedManualCandidate} from "../g678-advanced-manual/current-js-wrappers";
import {SHARED_DAT001_L05_P040_CONFIG, SHARED_DAT001_L05_P040_SOURCE} from "../timelines/shared-dat001-l05-p040";

const candidate = createDat001AdvancedManualCandidate({config: SHARED_DAT001_L05_P040_CONFIG, sourceContract: SHARED_DAT001_L05_P040_SOURCE, interactiveStops: SHARED_DAT001_L05_P040_SOURCE.interactiveStops, interactiveSeek: SHARED_DAT001_L05_P040_SOURCE.interactiveSeek});

export {SHARED_DAT001_L05_P040_SOURCE};
export const SHARED_DAT001_L05_P040_MOVIE = candidate.movie;
export const SHARED_DAT001_L05_P040_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L05_P040_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L05_P040_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L05_P040_RENDERER = candidate.Renderer;
export default candidate.module;
