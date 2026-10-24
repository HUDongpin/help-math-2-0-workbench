"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L03_P007_CONFIG, SHARED_ALG001_L03_P007_SOURCE} from "../timelines/shared-alg001-l03-p007";

export const SHARED_ALG001_L03_P007_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "mathematical-expression",
    "sourceKeyAttribute": "Mathematical expression",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "Mathematical Expression",
      "es": "Expresión matemática"
    }
  },
  {
    "id": "statement",
    "sourceKeyAttribute": "Statement",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Statement",
      "es": "Enunciado"
    }
  },
  {
    "id": "combine",
    "sourceKeyAttribute": "Combine",
    "sourceCharacterId": 11,
    "firstFrame": 64,
    "labels": {
      "en": "Combine",
      "es": "Combinar"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 12,
    "firstFrame": 64,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 13,
    "firstFrame": 64,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "variable",
    "sourceCharacterId": 28,
    "firstFrame": 123,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 29,
    "firstFrame": 123,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  },
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterId": 35,
    "firstFrame": 326,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L03_P007_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l03-p007-glossary",
  glossaryTerms: SHARED_ALG001_L03_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L03_P007_SOURCE};
export const SHARED_ALG001_L03_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L03_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L03_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L03_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L03_P007_RENDERER = candidate.Renderer;
export default animationModule;
