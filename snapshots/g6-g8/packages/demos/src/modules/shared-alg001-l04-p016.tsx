"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L04_P016_CONFIG, SHARED_ALG001_L04_P016_SOURCE} from "../timelines/shared-alg001-l04-p016";

export const SHARED_ALG001_L04_P016_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "rule",
    "sourceKeyAttribute": "Rule",
    "sourceCharacterId": 6,
    "firstFrame": 30,
    "labels": {
      "en": "Rule",
      "es": "Regla"
    }
  },
  {
    "id": "expression",
    "sourceKeyAttribute": "Expression",
    "sourceCharacterId": 7,
    "firstFrame": 30,
    "labels": {
      "en": "Expression",
      "es": "Expresión"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 8,
    "firstFrame": 30,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "related",
    "sourceKeyAttribute": "Related",
    "sourceCharacterId": 9,
    "firstFrame": 30,
    "labels": {
      "en": "Related",
      "es": "Relacionado"
    }
  },
  {
    "id": "sequence",
    "sourceKeyAttribute": "Sequence",
    "sourceCharacterId": 10,
    "firstFrame": 30,
    "labels": {
      "en": "Sequence",
      "es": "Secuencia"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L04_P016_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l04-p016-glossary",
  glossaryTerms: SHARED_ALG001_L04_P016_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L04_P016_SOURCE};
export const SHARED_ALG001_L04_P016_MOVIE = candidate.movie;
export const SHARED_ALG001_L04_P016_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L04_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L04_P016_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L04_P016_RENDERER = candidate.Renderer;
export default animationModule;
