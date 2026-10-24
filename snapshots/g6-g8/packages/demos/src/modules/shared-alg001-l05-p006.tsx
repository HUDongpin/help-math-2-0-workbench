"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L05_P006_CONFIG, SHARED_ALG001_L05_P006_SOURCE} from "../timelines/shared-alg001-l05-p006";

export const SHARED_ALG001_L05_P006_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "term",
    "sourceKeyAttribute": "Term",
    "sourceCharacterId": 39,
    "firstFrame": 203,
    "labels": {
      "en": "Term",
      "es": "Término"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 40,
    "firstFrame": 203,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "multiplication",
    "sourceKeyAttribute": "Multiplication",
    "sourceCharacterId": 41,
    "firstFrame": 203,
    "labels": {
      "en": "Multiplication",
      "es": "Multiplicación"
    }
  },
  {
    "id": "coefficient",
    "sourceKeyAttribute": "Coefficient",
    "sourceCharacterId": 45,
    "firstFrame": 270,
    "labels": {
      "en": "Coefficient",
      "es": "Coeficiente"
    }
  },
  {
    "id": "constant",
    "sourceKeyAttribute": "Constant",
    "sourceCharacterId": 63,
    "firstFrame": 762,
    "labels": {
      "en": "Constant",
      "es": "Constante"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L05_P006_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l05-p006-glossary",
  glossaryTerms: SHARED_ALG001_L05_P006_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P006_SOURCE};
export const SHARED_ALG001_L05_P006_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P006_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P006_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P006_RENDERER = candidate.Renderer;
export default animationModule;
