"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L03_P050_CONFIG, SHARED_ALG001_L03_P050_SOURCE} from "../timelines/shared-alg001-l03-p050";

export const SHARED_ALG001_L03_P050_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "equation",
    "sourceCharacterId": 23,
    "firstFrame": 150,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 24,
    "firstFrame": 150,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterId": 25,
    "firstFrame": 150,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más simple"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 26,
    "firstFrame": 150,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "strategies",
    "sourceKeyAttribute": "strategies",
    "sourceCharacterId": 27,
    "firstFrame": 150,
    "labels": {
      "en": "Strategies",
      "es": "Estrategias"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L03_P050_CONFIG, Object.freeze({
  calibrationId: "g678-ts05-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l03-p050-glossary",
  glossaryTerms: SHARED_ALG001_L03_P050_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L03_P050_SOURCE};
export const SHARED_ALG001_L03_P050_MOVIE = candidate.movie;
export const SHARED_ALG001_L03_P050_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L03_P050_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L03_P050_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L03_P050_RENDERER = candidate.Renderer;
export default animationModule;
