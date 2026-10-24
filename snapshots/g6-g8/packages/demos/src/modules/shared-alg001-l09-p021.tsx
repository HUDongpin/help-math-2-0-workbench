"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P021_CONFIG, SHARED_ALG001_L09_P021_SOURCE} from "../timelines/shared-alg001-l09-p021";

export const SHARED_ALG001_L09_P021_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterId": 7,
    "firstFrame": 5,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 8,
    "firstFrame": 5,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterId": 11,
    "firstFrame": 66,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 12,
    "firstFrame": 66,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P021_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p021-glossary",
  glossaryTerms: SHARED_ALG001_L09_P021_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P021_SOURCE};
export const SHARED_ALG001_L09_P021_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P021_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P021_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P021_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P021_RENDERER = candidate.Renderer;
export default animationModule;
