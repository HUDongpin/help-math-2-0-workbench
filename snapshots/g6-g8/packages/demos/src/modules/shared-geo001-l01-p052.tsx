"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_GEO001_L01_P052_CONFIG, SHARED_GEO001_L01_P052_SOURCE} from "../timelines/shared-geo001-l01-p052";

export const SHARED_GEO001_L01_P052_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "solve",
    "sourceKeyAttribute": "Solve",
    "sourceCharacterId": 17,
    "firstFrame": 11,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  },
  {
    "id": "problem",
    "sourceKeyAttribute": "Problem",
    "sourceCharacterId": 18,
    "firstFrame": 11,
    "labels": {
      "en": "Problem",
      "es": "Problema"
    }
  },
  {
    "id": "strategies",
    "sourceKeyAttribute": "strategies",
    "sourceCharacterId": 25,
    "firstFrame": 74,
    "labels": {
      "en": "Strategies",
      "es": "Estrategias"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 30,
    "firstFrame": 117,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "pattern",
    "sourceKeyAttribute": "Pattern",
    "sourceCharacterId": 31,
    "firstFrame": 117,
    "labels": {
      "en": "Pattern",
      "es": "Patrón"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 32,
    "firstFrame": 117,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterId": 33,
    "firstFrame": 117,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más simple"
    }
  }
] as const);

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_GEO001_L01_P052_CONFIG, Object.freeze({
  calibrationId: "g678-ts04-l1-product-calibration-v1",
  companionSurfaceId: "shared-geo001-l01-p052-glossary",
  glossaryTerms: SHARED_GEO001_L01_P052_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_GEO001_L01_P052_SOURCE};
export const SHARED_GEO001_L01_P052_MOVIE = candidate.movie;
export const SHARED_GEO001_L01_P052_RUNTIME = candidate.runtime;
export const SHARED_GEO001_L01_P052_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_GEO001_L01_P052_SCENARIOS = candidate.scenarios;
export const SHARED_GEO001_L01_P052_RENDERER = candidate.Renderer;
export default animationModule;
