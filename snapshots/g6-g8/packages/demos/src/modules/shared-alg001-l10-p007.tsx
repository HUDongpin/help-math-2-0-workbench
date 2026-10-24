"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L10_P007_CONFIG, SHARED_ALG001_L10_P007_SOURCE} from "../timelines/shared-alg001-l10-p007";

export const SHARED_ALG001_L10_P007_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "power",
    "sourceKeyAttribute": "Power",
    "sourceCharacterId": 7,
    "firstFrame": 17,
    "labels": {
      "en": "Power",
      "es": "Potencia"
    }
  },
  {
    "id": "base",
    "sourceKeyAttribute": "Base",
    "sourceCharacterId": 8,
    "firstFrame": 17,
    "labels": {
      "en": "Base",
      "es": "Base"
    }
  },
  {
    "id": "show",
    "sourceKeyAttribute": "Show",
    "sourceCharacterId": 15,
    "firstFrame": 122,
    "labels": {
      "en": "Show",
      "es": "Mostrar"
    }
  },
  {
    "id": "exponent",
    "sourceKeyAttribute": "Exponent",
    "sourceCharacterId": 24,
    "firstFrame": 234,
    "labels": {
      "en": "Exponent",
      "es": "Exponente"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L10_P007_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l10-p007-glossary",
  glossaryTerms: SHARED_ALG001_L10_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L10_P007_SOURCE};
export const SHARED_ALG001_L10_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L10_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L10_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L10_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L10_P007_RENDERER = candidate.Renderer;
export default animationModule;
