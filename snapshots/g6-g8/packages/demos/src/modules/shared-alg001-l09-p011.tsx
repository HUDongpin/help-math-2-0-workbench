"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P011_CONFIG, SHARED_ALG001_L09_P011_SOURCE} from "../timelines/shared-alg001-l09-p011";

export const SHARED_ALG001_L09_P011_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "pair",
    "sourceKeyAttribute": "Pair",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Pair",
      "es": "Par"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 14,
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterId": 15,
    "firstFrame": 1,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterId": 29,
    "firstFrame": 8,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P011_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p011-glossary",
  glossaryTerms: SHARED_ALG001_L09_P011_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P011_SOURCE};
export const SHARED_ALG001_L09_P011_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P011_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P011_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P011_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P011_RENDERER = candidate.Renderer;
export default animationModule;
