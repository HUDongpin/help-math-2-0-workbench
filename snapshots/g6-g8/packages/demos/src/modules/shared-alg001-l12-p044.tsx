"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L12_P044_CONFIG, SHARED_ALG001_L12_P044_SOURCE} from "../timelines/shared-alg001-l12-p044";

export const SHARED_ALG001_L12_P044_GLOSSARY_TERMS = Object.freeze([
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

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L12_P044_CONFIG, Object.freeze({
  calibrationId: "g678-ts03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l12-p044-glossary",
  glossaryTerms: SHARED_ALG001_L12_P044_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L12_P044_SOURCE};
export const SHARED_ALG001_L12_P044_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P044_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P044_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P044_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P044_RENDERER = candidate.Renderer;
export default animationModule;
