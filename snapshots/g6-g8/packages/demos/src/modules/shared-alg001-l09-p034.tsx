"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {SHARED_ALG001_L09_P034_CONFIG, SHARED_ALG001_L09_P034_SOURCE} from "../timelines/shared-alg001-l09-p034";

export const SHARED_ALG001_L09_P034_GLOSSARY_TERMS = Object.freeze([
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

const candidate = createPrivateSourceStaticGlossaryCandidate(SHARED_ALG001_L09_P034_CONFIG, Object.freeze({
  calibrationId: "g678-ts04-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p034-glossary",
  glossaryTerms: SHARED_ALG001_L09_P034_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P034_SOURCE};
export const SHARED_ALG001_L09_P034_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P034_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P034_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P034_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P034_RENDERER = candidate.Renderer;
export default animationModule;
