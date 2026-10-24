"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L02_P023_CONFIG, SHARED_ALG001_L02_P023_SOURCE} from "../timelines/shared-alg001-l02-p023";

export const SHARED_ALG001_L02_P023_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "constant",
    "sourceKeyAttribute": "Constant",
    "sourceCharacterId": 6,
    "firstFrame": 1,
    "labels": {
      "en": "Constant",
      "es": "Constante"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 9,
    "firstFrame": 8,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "change",
    "sourceKeyAttribute": "Change",
    "sourceCharacterId": 10,
    "firstFrame": 8,
    "labels": {
      "en": "Change",
      "es": "Cambiar"
    }
  },
  {
    "id": "fixed-value",
    "sourceKeyAttribute": "Fixed value",
    "sourceCharacterId": 16,
    "firstFrame": 182,
    "labels": {
      "en": "Fixed value",
      "es": "Valor fijo"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 20,
    "firstFrame": 391,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 24,
    "firstFrame": 446,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L02_P023_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l02-p023-glossary",
  glossaryTerms: SHARED_ALG001_L02_P023_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L02_P023_SOURCE};
export const SHARED_ALG001_L02_P023_MOVIE = candidate.movie;
export const SHARED_ALG001_L02_P023_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L02_P023_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L02_P023_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L02_P023_RENDERER = candidate.Renderer;
export default animationModule;
