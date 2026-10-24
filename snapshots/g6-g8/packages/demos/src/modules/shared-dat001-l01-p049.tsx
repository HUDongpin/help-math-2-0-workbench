"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_DAT001_L01_P049_CONFIG, SHARED_DAT001_L01_P049_SOURCE} from "../timelines/shared-dat001-l01-p049";

export const SHARED_DAT001_L01_P049_GLOSSARY_TERMS = Object.freeze([
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

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_DAT001_L01_P049_CONFIG, Object.freeze({
  calibrationId: "g678-ts04-l1-product-calibration-v1",
  companionSurfaceId: "shared-dat001-l01-p049-glossary",
  glossaryTerms: SHARED_DAT001_L01_P049_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L01_P049_SOURCE};
export const SHARED_DAT001_L01_P049_MOVIE = candidate.movie;
export const SHARED_DAT001_L01_P049_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L01_P049_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L01_P049_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L01_P049_RENDERER = candidate.Renderer;
export default animationModule;
