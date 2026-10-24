"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L04_P006_CONFIG, SHARED_ALG001_L04_P006_SOURCE} from "../timelines/shared-alg001-l04-p006";

export const SHARED_ALG001_L04_P006_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "relationship",
    "sourceKeyAttribute": "Relationship",
    "sourceCharacterId": 7,
    "firstFrame": 51,
    "labels": {
      "en": "Relationship",
      "es": "Relación"
    }
  },
  {
    "id": "connected",
    "sourceKeyAttribute": "Connected",
    "sourceCharacterId": 8,
    "firstFrame": 51,
    "labels": {
      "en": "Connected",
      "es": "Conectado"
    }
  },
  {
    "id": "associate",
    "sourceKeyAttribute": "Associate",
    "sourceCharacterId": 9,
    "firstFrame": 51,
    "labels": {
      "en": "Associate",
      "es": "Asociar"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 10,
    "firstFrame": 51,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L04_P006_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l04-p006-glossary",
  glossaryTerms: SHARED_ALG001_L04_P006_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L04_P006_SOURCE};
export const SHARED_ALG001_L04_P006_MOVIE = candidate.movie;
export const SHARED_ALG001_L04_P006_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L04_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L04_P006_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L04_P006_RENDERER = candidate.Renderer;
export default animationModule;
