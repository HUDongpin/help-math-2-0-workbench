"use client";

import {createPrivateSourceStaticAlgL09In10ChoiceCandidate} from "../private-source-static-alg-l09-in10-choice-candidate";
import {SHARED_ALG001_L09_P022_CONFIG, SHARED_ALG001_L09_P022_SOURCE} from "../timelines/shared-alg001-l09-p022";

export const SHARED_ALG001_L09_P022_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 22,
    "firstFrame": 10,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterId": 23,
    "firstFrame": 10,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterId": 28,
    "firstFrame": 65,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09In10ChoiceCandidate(SHARED_ALG001_L09_P022_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-in10-choice-product-calibration-v1",
  companionSurfaceId: "alg-l09-in10-choice-quiz",
  glossaryTerms: SHARED_ALG001_L09_P022_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P022_SOURCE};
export const SHARED_ALG001_L09_P022_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P022_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P022_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P022_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P022_RENDERER = candidate.Renderer;
export default animationModule;
