"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L09_P032_CONFIG, SHARED_ALG001_L09_P032_SOURCE} from "../timelines/shared-alg001-l09-p032";

export const SHARED_ALG001_L09_P032_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "restate",
    "sourceKeyAttribute": "Restate",
    "sourceCharacterId": 12,
    "firstFrame": 108,
    "labels": {
      "en": "Restate",
      "es": "Replantear"
    }
  },
  {
    "id": "question",
    "sourceKeyAttribute": "question",
    "sourceCharacterId": 13,
    "firstFrame": 108,
    "labels": {
      "en": "Question",
      "es": "Pregunta"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "problem",
    "sourceCharacterId": 20,
    "firstFrame": 175,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L09_P032_CONFIG, Object.freeze({
  calibrationId: "g678-ts02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p032-glossary",
  glossaryTerms: SHARED_ALG001_L09_P032_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P032_SOURCE};
export const SHARED_ALG001_L09_P032_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P032_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P032_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P032_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P032_RENDERER = candidate.Renderer;
export default animationModule;
