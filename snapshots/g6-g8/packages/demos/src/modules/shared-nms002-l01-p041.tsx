"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_NMS002_L01_P041_CONFIG, SHARED_NMS002_L01_P041_SOURCE} from "../timelines/shared-nms002-l01-p041";

export const SHARED_NMS002_L01_P041_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "strategies",
    "sourceKeyAttribute": "strategies",
    "sourceCharacterId": 24,
    "firstFrame": 103,
    "labels": {
      "en": "Strategies",
      "es": "Estrategias"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "equation",
    "sourceCharacterId": 29,
    "firstFrame": 139,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 30,
    "firstFrame": 139,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterId": 31,
    "firstFrame": 139,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más simple"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "table",
    "sourceCharacterId": 32,
    "firstFrame": 139,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "show",
    "sourceKeyAttribute": "Show",
    "sourceCharacterId": 35,
    "firstFrame": 237,
    "labels": {
      "en": "Show",
      "es": "Mostrar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_NMS002_L01_P041_CONFIG, Object.freeze({
  calibrationId: "g678-ts05-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p041-glossary",
  glossaryTerms: SHARED_NMS002_L01_P041_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P041_SOURCE};
export const SHARED_NMS002_L01_P041_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P041_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P041_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P041_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P041_RENDERER = candidate.Renderer;
export default animationModule;
