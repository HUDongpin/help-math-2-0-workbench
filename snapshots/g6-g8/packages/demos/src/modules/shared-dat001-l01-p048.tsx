"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_DAT001_L01_P048_CONFIG, SHARED_DAT001_L01_P048_SOURCE} from "../timelines/shared-dat001-l01-p048";

export const SHARED_DAT001_L01_P048_GLOSSARY_TERMS = Object.freeze([
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

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_DAT001_L01_P048_CONFIG, Object.freeze({
  calibrationId: "g678-ts03-l1-product-calibration-v1",
  companionSurfaceId: "shared-dat001-l01-p048-glossary",
  glossaryTerms: SHARED_DAT001_L01_P048_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L01_P048_SOURCE};
export const SHARED_DAT001_L01_P048_MOVIE = candidate.movie;
export const SHARED_DAT001_L01_P048_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L01_P048_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L01_P048_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L01_P048_RENDERER = candidate.Renderer;
export default animationModule;
