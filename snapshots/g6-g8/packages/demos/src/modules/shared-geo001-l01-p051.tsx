"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_GEO001_L01_P051_CONFIG, SHARED_GEO001_L01_P051_SOURCE} from "../timelines/shared-geo001-l01-p051";

export const SHARED_GEO001_L01_P051_GLOSSARY_TERMS = Object.freeze([
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

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_GEO001_L01_P051_CONFIG, Object.freeze({
  calibrationId: "g678-ts03-l1-product-calibration-v1",
  companionSurfaceId: "shared-geo001-l01-p051-glossary",
  glossaryTerms: SHARED_GEO001_L01_P051_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P051_SOURCE};
export const SHARED_GEO001_L01_P051_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P051_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P051_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P051_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P051_RENDERER = candidate.Renderer;
export default animationModule;
