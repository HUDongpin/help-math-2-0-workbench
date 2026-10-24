"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L05_P005_CONFIG, SHARED_ALG001_L05_P005_SOURCE} from "../timelines/shared-alg001-l05-p005";

export const SHARED_ALG001_L05_P005_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "term",
    "sourceKeyAttribute": "Term",
    "sourceCharacterId": 8,
    "firstFrame": 2,
    "labels": {
      "en": "Term",
      "es": "Término"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 9,
    "firstFrame": 2,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 10,
    "firstFrame": 2,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "sequence",
    "sourceKeyAttribute": "Sequence",
    "sourceCharacterId": 11,
    "firstFrame": 2,
    "labels": {
      "en": "Sequence",
      "es": "Secuencia"
    }
  },
  {
    "id": "quotient",
    "sourceKeyAttribute": "Quotient",
    "sourceCharacterId": 15,
    "firstFrame": 80,
    "labels": {
      "en": "Quotient",
      "es": "Cociente"
    }
  },
  {
    "id": "product",
    "sourceKeyAttribute": "Product",
    "sourceCharacterId": 16,
    "firstFrame": 80,
    "labels": {
      "en": "Product",
      "es": "Producto"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 17,
    "firstFrame": 80,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "constant",
    "sourceKeyAttribute": "Constant",
    "sourceCharacterId": 18,
    "firstFrame": 80,
    "labels": {
      "en": "Constant",
      "es": "Constante"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L05_P005_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l05-p005-glossary",
  glossaryTerms: SHARED_ALG001_L05_P005_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P005_SOURCE};
export const SHARED_ALG001_L05_P005_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P005_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P005_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P005_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P005_RENDERER = candidate.Renderer;
export default animationModule;
