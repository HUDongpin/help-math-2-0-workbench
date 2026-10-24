"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L11_P012_CONFIG, SHARED_ALG001_L11_P012_SOURCE} from "../timelines/shared-alg001-l11-p012";

export const SHARED_ALG001_L11_P012_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "expression",
    "sourceKeyAttribute": "Expression",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Expression",
      "es": "Expresión"
    }
  },
  {
    "id": "equal-sign",
    "sourceKeyAttribute": "Equal sign",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Equal sign",
      "es": "Signo igual"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterId": 15,
    "firstFrame": 63,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 21,
    "firstFrame": 247,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  },
  {
    "id": "sentence",
    "sourceKeyAttribute": "Sentence",
    "sourceCharacterId": 24,
    "firstFrame": 248,
    "labels": {
      "en": "Sentence",
      "es": "Expresión"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 25,
    "firstFrame": 248,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  },
  {
    "id": "greater-than",
    "sourceKeyAttribute": "Greater than",
    "sourceCharacterId": 29,
    "firstFrame": 297,
    "labels": {
      "en": "Greater than",
      "es": "Mayor que"
    }
  },
  {
    "id": "less-than",
    "sourceKeyAttribute": "Less than",
    "sourceCharacterId": 30,
    "firstFrame": 297,
    "labels": {
      "en": "Less than",
      "es": "Menor que"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L11_P012_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l11-p012-glossary",
  glossaryTerms: SHARED_ALG001_L11_P012_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P012_SOURCE};
export const SHARED_ALG001_L11_P012_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P012_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P012_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P012_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P012_RENDERER = candidate.Renderer;
export default animationModule;
