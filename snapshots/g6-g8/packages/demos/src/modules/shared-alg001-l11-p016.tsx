"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P016_CONFIG, SHARED_ALG001_L11_P016_SOURCE} from "../timelines/shared-alg001-l11-p016";

export const SHARED_ALG001_L11_P016_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "positive-number",
    "sourceKeyAttribute": "Positive number",
    "sourceCharacterId": 10,
    "firstFrame": 140,
    "labels": {
      "en": "Positive number",
      "es": "Número positivo"
    }
  },
  {
    "id": "negative-number",
    "sourceKeyAttribute": "Negative number",
    "sourceCharacterId": 11,
    "firstFrame": 140,
    "labels": {
      "en": "Negative number",
      "es": "Número negativo"
    }
  },
  {
    "id": "solution",
    "sourceKeyAttribute": "Solution",
    "sourceCharacterId": 14,
    "firstFrame": 219,
    "labels": {
      "en": "Solution",
      "es": "Solución"
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 15,
    "firstFrame": 219,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P016_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p016-glossary",
  glossaryTerms: SHARED_ALG001_L11_P016_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P016_SOURCE};
export const SHARED_ALG001_L11_P016_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P016_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P016_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P016_RENDERER = candidate.Renderer;
export default animationModule;
