"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P024_CONFIG, SHARED_ALG001_L11_P024_SOURCE} from "../timelines/shared-alg001-l11-p024";

export const SHARED_ALG001_L11_P024_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "absolute-value",
    "sourceKeyAttribute": "Absolute value",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Absolute Value",
      "es": "Valor absoluto"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "positive-number",
    "sourceKeyAttribute": "Positive number",
    "sourceCharacterId": 11,
    "firstFrame": 1,
    "labels": {
      "en": "Positive number",
      "es": "Número positivo"
    }
  },
  {
    "id": "negative-number",
    "sourceKeyAttribute": "Negative number",
    "sourceCharacterId": 12,
    "firstFrame": 1,
    "labels": {
      "en": "Negative number",
      "es": "Número negativo"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P024_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p024-glossary",
  glossaryTerms: SHARED_ALG001_L11_P024_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P024_SOURCE};
export const SHARED_ALG001_L11_P024_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P024_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P024_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P024_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P024_RENDERER = candidate.Renderer;
export default animationModule;
