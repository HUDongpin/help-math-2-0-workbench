"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P019_CONFIG, SHARED_ALG001_L09_P019_SOURCE} from "../timelines/shared-alg001-l09-p019";

export const SHARED_ALG001_L09_P019_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 7,
    "firstFrame": 17,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterId": 8,
    "firstFrame": 17,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 9,
    "firstFrame": 17,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P019_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p019-glossary",
  glossaryTerms: SHARED_ALG001_L09_P019_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P019_SOURCE};
export const SHARED_ALG001_L09_P019_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P019_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P019_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P019_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P019_RENDERER = candidate.Renderer;
export default animationModule;
