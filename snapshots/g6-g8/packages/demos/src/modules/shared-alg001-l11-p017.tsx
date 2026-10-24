"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P017_CONFIG, SHARED_ALG001_L11_P017_SOURCE} from "../timelines/shared-alg001-l11-p017";

export const SHARED_ALG001_L11_P017_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "side",
    "sourceKeyAttribute": "Side",
    "sourceCharacterId": 11,
    "firstFrame": 120,
    "labels": {
      "en": "Side",
      "es": "Lado"
    }
  },
  {
    "id": "division",
    "sourceKeyAttribute": "Division",
    "sourceCharacterId": 12,
    "firstFrame": 120,
    "labels": {
      "en": "Division",
      "es": "División"
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 13,
    "firstFrame": 120,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  },
  {
    "id": "multiplication",
    "sourceKeyAttribute": "Multiplication",
    "sourceCharacterId": 14,
    "firstFrame": 120,
    "labels": {
      "en": "Multiplication",
      "es": "Multiplicación"
    }
  },
  {
    "id": "solution",
    "sourceKeyAttribute": "Solution",
    "sourceCharacterId": 17,
    "firstFrame": 198,
    "labels": {
      "en": "Solution",
      "es": "Solución"
    }
  },
  {
    "id": "change",
    "sourceKeyAttribute": "Change",
    "sourceCharacterId": 18,
    "firstFrame": 198,
    "labels": {
      "en": "Change",
      "es": "Cambiar"
    }
  },
  {
    "id": "positive-number",
    "sourceKeyAttribute": "Positive number",
    "sourceCharacterId": 19,
    "firstFrame": 198,
    "labels": {
      "en": "Positive number",
      "es": "Número positivo"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P017_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p017-glossary",
  glossaryTerms: SHARED_ALG001_L11_P017_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P017_SOURCE};
export const SHARED_ALG001_L11_P017_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P017_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P017_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P017_RENDERER = candidate.Renderer;
export default animationModule;
