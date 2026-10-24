"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_NMS002_L01_P039_CONFIG, SHARED_NMS002_L01_P039_SOURCE} from "../timelines/shared-nms002-l01-p039";

export const SHARED_NMS002_L01_P039_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "organize",
    "sourceKeyAttribute": "Organize",
    "sourceCharacterId": 17,
    "firstFrame": 9,
    "labels": {
      "en": "Organize",
      "es": "Organizar"
    }
  },
  {
    "id": "information",
    "sourceKeyAttribute": "Information",
    "sourceCharacterId": 18,
    "firstFrame": 9,
    "labels": {
      "en": "Information",
      "es": "Información"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_NMS002_L01_P039_CONFIG, Object.freeze({
  calibrationId: "g678-ts03-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p039-glossary",
  glossaryTerms: SHARED_NMS002_L01_P039_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P039_SOURCE};
export const SHARED_NMS002_L01_P039_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P039_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P039_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P039_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P039_RENDERER = candidate.Renderer;
export default animationModule;
