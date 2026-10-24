"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P013_CONFIG, SHARED_ALG001_L11_P013_SOURCE} from "../timelines/shared-alg001-l11-p013";

export const SHARED_ALG001_L11_P013_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "solution",
    "sourceKeyAttribute": "Solution",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "Solution",
      "es": "Solución"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  },
  {
    "id": "sentence",
    "sourceKeyAttribute": "Sentence",
    "sourceCharacterId": 12,
    "firstFrame": 70,
    "labels": {
      "en": "Sentence",
      "es": "Expresión"
    }
  },
  {
    "id": "counting-numbers",
    "sourceKeyAttribute": "Counting numbers",
    "sourceCharacterId": 15,
    "firstFrame": 91,
    "labels": {
      "en": "Counting numbers",
      "es": "Números naturales"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 16,
    "firstFrame": 91,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P013_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p013-glossary",
  glossaryTerms: SHARED_ALG001_L11_P013_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P013_SOURCE};
export const SHARED_ALG001_L11_P013_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P013_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P013_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P013_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P013_RENDERER = candidate.Renderer;
export default animationModule;
