"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P010_CONFIG, SHARED_ALG001_L09_P010_SOURCE} from "../timelines/shared-alg001-l09-p010";

export const SHARED_ALG001_L09_P010_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 7,
    "firstFrame": 2,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterId": 8,
    "firstFrame": 2,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 9,
    "firstFrame": 2,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "pair",
    "sourceKeyAttribute": "Pair",
    "sourceCharacterId": 13,
    "firstFrame": 55,
    "labels": {
      "en": "Pair",
      "es": "Par"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 14,
    "firstFrame": 55,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterId": 15,
    "firstFrame": 55,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P010_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p010-glossary",
  glossaryTerms: SHARED_ALG001_L09_P010_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P010_SOURCE};
export const SHARED_ALG001_L09_P010_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P010_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P010_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P010_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P010_RENDERER = candidate.Renderer;
export default animationModule;
