"use client";

import {createPrivateSourceStaticAlgL09TerminalStopCandidate} from "../private-source-static-alg-l09-terminal-stop-candidate";
import {SHARED_ALG001_L09_P007_CONFIG, SHARED_ALG001_L09_P007_SOURCE} from "../timelines/shared-alg001-l09-p007";

export const SHARED_ALG001_L09_P007_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterId": 35,
    "firstFrame": 444,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "solve",
    "sourceKeyAttribute": "Solve",
    "sourceCharacterId": 36,
    "firstFrame": 444,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TerminalStopCandidate(SHARED_ALG001_L09_P007_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-terminal-stop-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p007-glossary",
  glossaryTerms: SHARED_ALG001_L09_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P007_SOURCE};
export const SHARED_ALG001_L09_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P007_RENDERER = candidate.Renderer;
export default animationModule;
