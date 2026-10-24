"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_DAT001_L01_P047_CONFIG, SHARED_DAT001_L01_P047_SOURCE} from "../timelines/shared-dat001-l01-p047";

export const SHARED_DAT001_L01_P047_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "restate",
    "sourceKeyAttribute": "Restate",
    "sourceCharacterId": 12,
    "firstFrame": 93,
    "labels": {
      "en": "Restate",
      "es": "Replantear"
    }
  },
  {
    "id": "question",
    "sourceKeyAttribute": "question",
    "sourceCharacterId": 13,
    "firstFrame": 93,
    "labels": {
      "en": "Question",
      "es": "Pregunta"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "problem",
    "sourceCharacterId": 19,
    "firstFrame": 142,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_DAT001_L01_P047_CONFIG, Object.freeze({
  calibrationId: "g678-ts02-l1-product-calibration-v1",
  companionSurfaceId: "shared-dat001-l01-p047-glossary",
  glossaryTerms: SHARED_DAT001_L01_P047_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L01_P047_SOURCE};
export const SHARED_DAT001_L01_P047_MOVIE = candidate.movie;
export const SHARED_DAT001_L01_P047_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L01_P047_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L01_P047_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L01_P047_RENDERER = candidate.Renderer;
export default animationModule;
