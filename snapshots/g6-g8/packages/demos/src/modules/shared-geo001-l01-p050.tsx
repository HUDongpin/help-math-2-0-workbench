"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_GEO001_L01_P050_CONFIG, SHARED_GEO001_L01_P050_SOURCE} from "../timelines/shared-geo001-l01-p050";

export const SHARED_GEO001_L01_P050_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "restate",
    "sourceKeyAttribute": "Restate",
    "sourceCharacterId": 12,
    "firstFrame": 108,
    "labels": {
      "en": "Restate",
      "es": "Replantear"
    }
  },
  {
    "id": "question",
    "sourceKeyAttribute": "question",
    "sourceCharacterId": 13,
    "firstFrame": 108,
    "labels": {
      "en": "Question",
      "es": "Pregunta"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "problem",
    "sourceCharacterId": 20,
    "firstFrame": 175,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_GEO001_L01_P050_CONFIG, Object.freeze({
  calibrationId: "g678-ts02-l1-product-calibration-v1",
  companionSurfaceId: "shared-geo001-l01-p050-glossary",
  glossaryTerms: SHARED_GEO001_L01_P050_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P050_SOURCE};
export const SHARED_GEO001_L01_P050_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P050_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P050_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P050_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P050_RENDERER = candidate.Renderer;
export default animationModule;
