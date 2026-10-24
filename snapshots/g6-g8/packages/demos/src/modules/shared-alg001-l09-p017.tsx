"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P017_CONFIG, SHARED_ALG001_L09_P017_SOURCE} from "../timelines/shared-alg001-l09-p017";

export const SHARED_ALG001_L09_P017_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "fraction",
    "sourceKeyAttribute": "Fraction",
    "sourceCharacterId": 11,
    "firstFrame": 129,
    "labels": {
      "en": "Fraction",
      "es": "Fracción"
    }
  },
  {
    "id": "simplest-form",
    "sourceKeyAttribute": "Simplest form",
    "sourceCharacterId": 12,
    "firstFrame": 129,
    "labels": {
      "en": "Simplest Form",
      "es": "Forma más simple"
    }
  },
  {
    "id": "reduce",
    "sourceKeyAttribute": "Reduce",
    "sourceCharacterId": 13,
    "firstFrame": 129,
    "labels": {
      "en": "Reduce",
      "es": "Reducir"
    }
  },
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterId": 14,
    "firstFrame": 129,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 15,
    "firstFrame": 129,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P017_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p017-glossary",
  glossaryTerms: SHARED_ALG001_L09_P017_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P017_SOURCE};
export const SHARED_ALG001_L09_P017_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P017_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P017_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P017_RENDERER = candidate.Renderer;
export default animationModule;
