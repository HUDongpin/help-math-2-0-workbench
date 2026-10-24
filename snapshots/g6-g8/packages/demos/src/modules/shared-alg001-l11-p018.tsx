"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P018_CONFIG, SHARED_ALG001_L11_P018_SOURCE} from "../timelines/shared-alg001-l11-p018";

export const SHARED_ALG001_L11_P018_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 11,
    "firstFrame": 91,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  },
  {
    "id": "multiplication",
    "sourceKeyAttribute": "Multiplication",
    "sourceCharacterId": 12,
    "firstFrame": 91,
    "labels": {
      "en": "Multiplication",
      "es": "Multiplicación"
    }
  },
  {
    "id": "division",
    "sourceKeyAttribute": "Division",
    "sourceCharacterId": 13,
    "firstFrame": 91,
    "labels": {
      "en": "Division",
      "es": "División"
    }
  },
  {
    "id": "reverse",
    "sourceKeyAttribute": "Reverse",
    "sourceCharacterId": 16,
    "firstFrame": 179,
    "labels": {
      "en": "Reverse",
      "es": "Revertir"
    }
  },
  {
    "id": "direction",
    "sourceKeyAttribute": "Direction",
    "sourceCharacterId": 17,
    "firstFrame": 179,
    "labels": {
      "en": "Direction",
      "es": "Dirección"
    }
  },
  {
    "id": "negative-number",
    "sourceKeyAttribute": "Negative number",
    "sourceCharacterId": 18,
    "firstFrame": 179,
    "labels": {
      "en": "Negative number",
      "es": "Número negativo"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 21,
    "firstFrame": 232,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P018_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p018-glossary",
  glossaryTerms: SHARED_ALG001_L11_P018_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P018_SOURCE};
export const SHARED_ALG001_L11_P018_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P018_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P018_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P018_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P018_RENDERER = candidate.Renderer;
export default animationModule;
