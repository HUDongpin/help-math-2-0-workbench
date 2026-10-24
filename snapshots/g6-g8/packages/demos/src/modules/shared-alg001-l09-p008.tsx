"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P008_CONFIG, SHARED_ALG001_L09_P008_SOURCE} from "../timelines/shared-alg001-l09-p008";

export const SHARED_ALG001_L09_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 12,
    "firstFrame": 2,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "comparison",
    "sourceKeyAttribute": "Comparison",
    "sourceCharacterId": 13,
    "firstFrame": 2,
    "labels": {
      "en": "Comparison",
      "es": "Comparación"
    }
  },
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 14,
    "firstFrame": 2,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P008_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p008-glossary",
  glossaryTerms: SHARED_ALG001_L09_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P008_SOURCE};
export const SHARED_ALG001_L09_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P008_RENDERER = candidate.Renderer;
export default animationModule;
