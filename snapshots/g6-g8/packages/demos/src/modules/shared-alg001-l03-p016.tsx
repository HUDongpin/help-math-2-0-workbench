"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L03_P016_CONFIG, SHARED_ALG001_L03_P016_SOURCE} from "../timelines/shared-alg001-l03-p016";

export const SHARED_ALG001_L03_P016_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 28,
    "firstFrame": 254,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 29,
    "firstFrame": 254,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "sequence",
    "sourceKeyAttribute": "Sequence",
    "sourceCharacterId": 30,
    "firstFrame": 254,
    "labels": {
      "en": "Sequence",
      "es": "Secuencia"
    }
  },
  {
    "id": "shape",
    "sourceKeyAttribute": "Shape",
    "sourceCharacterId": 31,
    "firstFrame": 254,
    "labels": {
      "en": "Shape",
      "es": "Forma"
    }
  },
  {
    "id": "arrange",
    "sourceKeyAttribute": "Arrange",
    "sourceCharacterId": 34,
    "firstFrame": 340,
    "labels": {
      "en": "Arrange",
      "es": "Ordenar"
    }
  },
  {
    "id": "rule",
    "sourceKeyAttribute": "Rule",
    "sourceCharacterId": 35,
    "firstFrame": 340,
    "labels": {
      "en": "Rule",
      "es": "Regla"
    }
  },
  {
    "id": "term",
    "sourceKeyAttribute": "Term",
    "sourceCharacterId": 58,
    "firstFrame": 487,
    "labels": {
      "en": "Term",
      "es": "Término"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 59,
    "firstFrame": 487,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L03_P016_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l03-p016-glossary",
  glossaryTerms: SHARED_ALG001_L03_P016_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L03_P016_SOURCE};
export const SHARED_ALG001_L03_P016_MOVIE = candidate.movie;
export const SHARED_ALG001_L03_P016_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L03_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L03_P016_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L03_P016_RENDERER = candidate.Renderer;
export default animationModule;
