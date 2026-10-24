"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L05_P027_CONFIG, SHARED_ALG001_L05_P027_SOURCE} from "../timelines/shared-alg001-l05-p027";

export const SHARED_ALG001_L05_P027_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "like-terms",
    "sourceKeyAttribute": "Like terms",
    "sourceCharacterId": 8,
    "firstFrame": 68,
    "labels": {
      "en": "Like terms",
      "es": "Términos semejantes"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 11,
    "firstFrame": 69,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "exponent",
    "sourceKeyAttribute": "Exponent",
    "sourceCharacterId": 14,
    "firstFrame": 111,
    "labels": {
      "en": "Exponent",
      "es": "Exponente"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L05_P027_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l05-p027-glossary",
  glossaryTerms: SHARED_ALG001_L05_P027_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P027_SOURCE};
export const SHARED_ALG001_L05_P027_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P027_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P027_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P027_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P027_RENDERER = candidate.Renderer;
export default animationModule;
