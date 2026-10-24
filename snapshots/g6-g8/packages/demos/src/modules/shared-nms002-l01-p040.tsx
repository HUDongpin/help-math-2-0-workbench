"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_NMS002_L01_P040_CONFIG, SHARED_NMS002_L01_P040_SOURCE} from "../timelines/shared-nms002-l01-p040";

export const SHARED_NMS002_L01_P040_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "solve",
    "sourceKeyAttribute": "Solve",
    "sourceCharacterId": 18,
    "firstFrame": 5,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "Problem",
    "sourceCharacterId": 19,
    "firstFrame": 5,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  },
  {
    "id": "strategies",
    "sourceKeyAttribute": "strategies",
    "sourceCharacterId": 26,
    "firstFrame": 67,
    "labels": {
      "en": "Strategies",
      "es": "Estrategias"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 61,
    "firstFrame": 97,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 62,
    "firstFrame": 97,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 63,
    "firstFrame": 97,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterId": 64,
    "firstFrame": 97,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más simple"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_NMS002_L01_P040_CONFIG, Object.freeze({
  calibrationId: "g678-ts04-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p040-glossary",
  glossaryTerms: SHARED_NMS002_L01_P040_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P040_SOURCE};
export const SHARED_NMS002_L01_P040_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P040_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P040_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P040_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P040_RENDERER = candidate.Renderer;
export default animationModule;
