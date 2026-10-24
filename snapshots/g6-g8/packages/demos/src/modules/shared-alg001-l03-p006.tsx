"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L03_P006_CONFIG, SHARED_ALG001_L03_P006_SOURCE} from "../timelines/shared-alg001-l03-p006";

export const SHARED_ALG001_L03_P006_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "shape",
    "sourceKeyAttribute": "Shape",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Shape",
      "es": "Forma"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "design",
    "sourceKeyAttribute": "Design",
    "sourceCharacterId": 11,
    "firstFrame": 1,
    "labels": {
      "en": "Design",
      "es": "Diseño"
    }
  },
  {
    "id": "arrange",
    "sourceKeyAttribute": "Arrange",
    "sourceCharacterId": 12,
    "firstFrame": 1,
    "labels": {
      "en": "Arrange",
      "es": "Ordenar"
    }
  },
  {
    "id": "rule",
    "sourceKeyAttribute": "Rule",
    "sourceCharacterId": 13,
    "firstFrame": 1,
    "labels": {
      "en": "Rule",
      "es": "Regla"
    }
  },
  {
    "id": "term",
    "sourceKeyAttribute": "Term",
    "sourceCharacterId": 16,
    "firstFrame": 85,
    "labels": {
      "en": "Term",
      "es": "Término"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 17,
    "firstFrame": 85,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "sequence",
    "sourceKeyAttribute": "Sequence",
    "sourceCharacterId": 18,
    "firstFrame": 85,
    "labels": {
      "en": "Sequence",
      "es": "Secuencia"
    }
  },
  {
    "id": "number",
    "sourceKeyAttribute": "Number",
    "sourceCharacterId": 19,
    "firstFrame": 85,
    "labels": {
      "en": "Number",
      "es": "Número"
    }
  },
  {
    "id": "order",
    "sourceKeyAttribute": "Order",
    "sourceCharacterId": 43,
    "firstFrame": 263,
    "labels": {
      "en": "Order",
      "es": "Orden"
    }
  },
  {
    "id": "expression",
    "sourceKeyAttribute": "Expression",
    "sourceCharacterId": 49,
    "firstFrame": 418,
    "labels": {
      "en": "Expression",
      "es": "Expresión"
    }
  },
  {
    "id": "related",
    "sourceKeyAttribute": "Related",
    "sourceCharacterId": 50,
    "firstFrame": 418,
    "labels": {
      "en": "Related",
      "es": "Relacionado"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L03_P006_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l03-p006-glossary",
  glossaryTerms: SHARED_ALG001_L03_P006_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L03_P006_SOURCE};
export const SHARED_ALG001_L03_P006_MOVIE = candidate.movie;
export const SHARED_ALG001_L03_P006_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L03_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L03_P006_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L03_P006_RENDERER = candidate.Renderer;
export default animationModule;
