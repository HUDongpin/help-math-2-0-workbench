"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P007_CONFIG, SHARED_ALG001_L11_P007_SOURCE} from "../timelines/shared-alg001-l11-p007";

export const SHARED_ALG001_L11_P007_GLOSSARY_TERMS = Object.freeze([
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
    "id": "negative-number",
    "sourceKeyAttribute": "Negative number",
    "sourceCharacterId": 11,
    "firstFrame": 1,
    "labels": {
      "en": "Negative number",
      "es": "Número negativo"
    }
  },
  {
    "id": "positive-number",
    "sourceKeyAttribute": "Positive number",
    "sourceCharacterId": 12,
    "firstFrame": 1,
    "labels": {
      "en": "Positive number",
      "es": "Número positivo"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P007_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p007-glossary",
  glossaryTerms: SHARED_ALG001_L11_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P007_SOURCE};
export const SHARED_ALG001_L11_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P007_RENDERER = candidate.Renderer;
export default animationModule;
