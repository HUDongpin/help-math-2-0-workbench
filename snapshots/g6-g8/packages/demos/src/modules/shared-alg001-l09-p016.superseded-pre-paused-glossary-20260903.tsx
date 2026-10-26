"use client";

import {createPrivateSourceStaticAlgL09In04NumericCandidate} from "../private-source-static-alg-l09-in04-numeric-candidate";
import {SHARED_ALG001_L09_P016_CONFIG, SHARED_ALG001_L09_P016_SOURCE} from "../timelines/shared-alg001-l09-p016";

export const SHARED_ALG001_L09_P016_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "fiction",
    "sourceKeyAttribute": "Fiction",
    "sourceCharacterId": 21,
    "firstFrame": 1,
    "labels": {
      "en": "Fiction",
      "es": "Ficción"
    }
  },
  {
    "id": "nonfiction",
    "sourceKeyAttribute": "Nonfiction",
    "sourceCharacterId": 22,
    "firstFrame": 1,
    "labels": {
      "en": "nonfiction",
      "es": "Realismo"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 25,
    "firstFrame": 93,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09In04NumericCandidate(SHARED_ALG001_L09_P016_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-in04-numeric-product-calibration-v1",
  companionSurfaceId: "alg-l09-in04-numeric-response",
  glossaryTerms: SHARED_ALG001_L09_P016_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P016_SOURCE};
export const SHARED_ALG001_L09_P016_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P016_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P016_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P016_RENDERER = candidate.Renderer;
export default animationModule;
