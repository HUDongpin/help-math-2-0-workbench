"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_NMS002_L01_P006_CONFIG, SHARED_NMS002_L01_P006_SOURCE} from "../timelines/shared-nms002-l01-p006";

export const SHARED_NMS002_L01_P006_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "natural-number",
    "sourceKeyAttribute": "Natural number",
    "sourceCharacterId": 11,
    "firstFrame": 8,
    "labels": {
      "en": "Natural number",
      "es": "Números naturales"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 12,
    "firstFrame": 8,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "counting-numbers",
    "sourceKeyAttribute": "Counting numbers",
    "sourceCharacterId": 15,
    "firstFrame": 53,
    "labels": {
      "en": "Counting numbers",
      "es": "Números naturales"
    }
  },
  {
    "id": "opposite",
    "sourceKeyAttribute": "Opposite",
    "sourceCharacterId": 50,
    "firstFrame": 104,
    "labels": {
      "en": "Opposite",
      "es": "Opuesto"
    }
  },
  {
    "id": "negative-integers",
    "sourceKeyAttribute": "Negative integers",
    "sourceCharacterId": 51,
    "firstFrame": 104,
    "labels": {
      "en": "Negative Integers",
      "es": "Enteros negativos"
    }
  },
  {
    "id": "positive-integers",
    "sourceKeyAttribute": "Positive integers",
    "sourceCharacterId": 52,
    "firstFrame": 104,
    "labels": {
      "en": "Positive Integers",
      "es": "Enteros positivos"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_NMS002_L01_P006_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p006-glossary",
  glossaryTerms: SHARED_NMS002_L01_P006_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P006_SOURCE};
export const SHARED_NMS002_L01_P006_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P006_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P006_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P006_RENDERER = candidate.Renderer;
export default animationModule;
