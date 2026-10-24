"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L11_P005_CONFIG, SHARED_ALG001_L11_P005_SOURCE} from "../timelines/shared-alg001-l11-p005";

export const SHARED_ALG001_L11_P005_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterId": 8,
    "firstFrame": 23,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 9,
    "firstFrame": 23,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 12,
    "firstFrame": 85,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 15,
    "firstFrame": 117,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  },
  {
    "id": "sentence",
    "sourceKeyAttribute": "Sentence",
    "sourceCharacterId": 16,
    "firstFrame": 117,
    "labels": {
      "en": "Sentence",
      "es": "Expresión"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 17,
    "firstFrame": 117,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  },
  {
    "id": "greater-than",
    "sourceKeyAttribute": "Greater than",
    "sourceCharacterId": 20,
    "firstFrame": 250,
    "labels": {
      "en": "Greater than",
      "es": "Mayor que"
    }
  },
  {
    "id": "less-than",
    "sourceKeyAttribute": "Less than",
    "sourceCharacterId": 21,
    "firstFrame": 250,
    "labels": {
      "en": "Less than",
      "es": "Menor que"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L11_P005_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l11-p005-glossary",
  glossaryTerms: SHARED_ALG001_L11_P005_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P005_SOURCE};
export const SHARED_ALG001_L11_P005_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P005_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P005_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P005_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P005_RENDERER = candidate.Renderer;
export default animationModule;
