"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P005_CONFIG, SHARED_ALG001_L09_P005_SOURCE} from "../timelines/shared-alg001-l09-p005";

export const SHARED_ALG001_L09_P005_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "comparison",
    "sourceKeyAttribute": "Comparison",
    "sourceCharacterId": 35,
    "firstFrame": 114,
    "labels": {
      "en": "Comparison",
      "es": "Comparación"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 36,
    "firstFrame": 114,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 37,
    "firstFrame": 114,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P005_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p005-glossary",
  glossaryTerms: SHARED_ALG001_L09_P005_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P005_SOURCE};
export const SHARED_ALG001_L09_P005_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P005_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P005_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P005_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P005_RENDERER = candidate.Renderer;
export default animationModule;
