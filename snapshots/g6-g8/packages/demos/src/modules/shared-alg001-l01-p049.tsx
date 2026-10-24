"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L01_P049_CONFIG, SHARED_ALG001_L01_P049_SOURCE} from "../timelines/shared-alg001-l01-p049";

export const SHARED_ALG001_L01_P049_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "solve",
    "sourceKeyAttribute": "Solve",
    "sourceCharacterId": 18,
    "firstFrame": 14,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  },
  {
    "id": "strategies",
    "sourceKeyAttribute": "strategies",
    "sourceCharacterId": 19,
    "firstFrame": 14,
    "labels": {
      "en": "Strategies",
      "es": "Estrategias"
    }
  },
  {
    "id": "data-tables",
    "sourceKeyAttribute": "Data tables",
    "sourceCharacterId": 26,
    "firstFrame": 77,
    "labels": {
      "en": "Data Tables",
      "es": "Tablas de datos"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 61,
    "firstFrame": 103,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 62,
    "firstFrame": 103,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 63,
    "firstFrame": 103,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterId": 64,
    "firstFrame": 103,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más simple"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "problem",
    "sourceCharacterId": 65,
    "firstFrame": 103,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L01_P049_CONFIG, Object.freeze({
  calibrationId: "g678-ts04-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l01-p049-glossary",
  glossaryTerms: SHARED_ALG001_L01_P049_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L01_P049_SOURCE};
export const SHARED_ALG001_L01_P049_MOVIE = candidate.movie;
export const SHARED_ALG001_L01_P049_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L01_P049_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L01_P049_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L01_P049_RENDERER = candidate.Renderer;
export default animationModule;
