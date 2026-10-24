"use client";

import {createPrivateSourceStaticAlgL09In08ChoiceCandidate} from "../private-source-static-alg-l09-in08-choice-candidate";
import {SHARED_ALG001_L09_P020_CONFIG, SHARED_ALG001_L09_P020_SOURCE} from "../timelines/shared-alg001-l09-p020";

export const SHARED_ALG001_L09_P020_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterId": 8,
    "firstFrame": 12,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 11,
    "firstFrame": 56,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterId": 12,
    "firstFrame": 56,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "coefficient",
    "sourceKeyAttribute": "Coefficient",
    "sourceCharacterId": 16,
    "firstFrame": 283,
    "labels": {
      "en": "Coefficient",
      "es": "Coeficiente"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 17,
    "firstFrame": 283,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09In08ChoiceCandidate(SHARED_ALG001_L09_P020_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-in08-choice-product-calibration-v1",
  companionSurfaceId: "alg-l09-in08-choice-quiz",
  glossaryTerms: SHARED_ALG001_L09_P020_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P020_SOURCE};
export const SHARED_ALG001_L09_P020_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P020_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P020_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P020_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P020_RENDERER = candidate.Renderer;
export default animationModule;
