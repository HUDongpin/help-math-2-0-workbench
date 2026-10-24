"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_NMS002_L01_P038_CONFIG, SHARED_NMS002_L01_P038_SOURCE} from "../timelines/shared-nms002-l01-p038";

export const SHARED_NMS002_L01_P038_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "restate",
    "sourceKeyAttribute": "Restate",
    "sourceCharacterId": 16,
    "firstFrame": 84,
    "labels": {
      "en": "Restate",
      "es": "Replantear"
    }
  },
  {
    "id": "question",
    "sourceKeyAttribute": "question",
    "sourceCharacterId": 17,
    "firstFrame": 84,
    "labels": {
      "en": "Question",
      "es": "Pregunta"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "problem",
    "sourceCharacterId": 23,
    "firstFrame": 145,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_NMS002_L01_P038_CONFIG, Object.freeze({
  calibrationId: "g678-ts02-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p038-glossary",
  glossaryTerms: SHARED_NMS002_L01_P038_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P038_SOURCE};
export const SHARED_NMS002_L01_P038_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P038_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P038_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P038_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P038_RENDERER = candidate.Renderer;
export default animationModule;
