"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L05_P055_CONFIG, SHARED_ALG001_L05_P055_SOURCE} from "../timelines/shared-alg001-l05-p055";

export const SHARED_ALG001_L05_P055_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "organize",
    "sourceKeyAttribute": "Organize",
    "sourceCharacterId": 17,
    "firstFrame": 29,
    "labels": {
      "en": "Organize",
      "es": "Organizar"
    }
  },
  {
    "id": "information",
    "sourceKeyAttribute": "Information",
    "sourceCharacterId": 18,
    "firstFrame": 29,
    "labels": {
      "en": "Information",
      "es": "Información"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L05_P055_CONFIG, Object.freeze({
  calibrationId: "g678-ts03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l05-p055-glossary",
  glossaryTerms: SHARED_ALG001_L05_P055_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L05_P055_SOURCE};
export const SHARED_ALG001_L05_P055_MOVIE = candidate.movie;
export const SHARED_ALG001_L05_P055_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L05_P055_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L05_P055_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L05_P055_RENDERER = candidate.Renderer;
export default animationModule;
