"use client";

import {createPrivateSourceStaticAlgL09In06ChoiceCandidate} from "../private-source-static-alg-l09-in06-choice-candidate";
import {SHARED_ALG001_L09_P018_CONFIG, SHARED_ALG001_L09_P018_SOURCE} from "../timelines/shared-alg001-l09-p018";

export const SHARED_ALG001_L09_P018_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 9,
    "firstFrame": 75,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "simplest-form",
    "sourceKeyAttribute": "Simplest form",
    "sourceCharacterId": 12,
    "firstFrame": 155,
    "labels": {
      "en": "Simplest Form",
      "es": "Forma más simple"
    }
  },
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterId": 13,
    "firstFrame": 155,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09In06ChoiceCandidate(SHARED_ALG001_L09_P018_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-in06-choice-product-calibration-v1",
  companionSurfaceId: "alg-l09-in06-choice-quiz",
  glossaryTerms: SHARED_ALG001_L09_P018_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P018_SOURCE};
export const SHARED_ALG001_L09_P018_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P018_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P018_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P018_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P018_RENDERER = candidate.Renderer;
export default animationModule;
