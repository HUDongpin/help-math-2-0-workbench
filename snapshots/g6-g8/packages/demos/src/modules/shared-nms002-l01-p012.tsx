"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_NMS002_L01_P012_CONFIG, SHARED_NMS002_L01_P012_SOURCE} from "../timelines/shared-nms002-l01-p012";

export const SHARED_NMS002_L01_P012_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "integers",
    "sourceKeyAttribute": "Integers",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Integers",
      "es": "Enteros"
    }
  },
  {
    "id": "natural-number",
    "sourceKeyAttribute": "Natural number",
    "sourceCharacterId": 11,
    "firstFrame": 1,
    "labels": {
      "en": "Natural number",
      "es": "Números naturales"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 12,
    "firstFrame": 1,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "counting-numbers",
    "sourceKeyAttribute": "Counting numbers",
    "sourceCharacterId": 16,
    "firstFrame": 88,
    "labels": {
      "en": "Counting numbers",
      "es": "Números naturales"
    }
  },
  {
    "id": "opposite",
    "sourceKeyAttribute": "Opposite",
    "sourceCharacterId": 31,
    "firstFrame": 135,
    "labels": {
      "en": "Opposite",
      "es": "Opuesto"
    }
  },
  {
    "id": "negative-integers",
    "sourceKeyAttribute": "Negative integers",
    "sourceCharacterId": 32,
    "firstFrame": 135,
    "labels": {
      "en": "Negative Integers",
      "es": "Enteros negativos"
    }
  },
  {
    "id": "positive-integers",
    "sourceKeyAttribute": "Positive integers",
    "sourceCharacterId": 33,
    "firstFrame": 135,
    "labels": {
      "en": "Positive Integers",
      "es": "Enteros positivos"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_NMS002_L01_P012_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p012-glossary",
  glossaryTerms: SHARED_NMS002_L01_P012_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P012_SOURCE};
export const SHARED_NMS002_L01_P012_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P012_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P012_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P012_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P012_RENDERER = candidate.Renderer;
export default animationModule;
