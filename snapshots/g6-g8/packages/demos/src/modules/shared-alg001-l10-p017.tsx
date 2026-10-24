"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L10_P017_CONFIG, SHARED_ALG001_L10_P017_SOURCE} from "../timelines/shared-alg001-l10-p017";

export const SHARED_ALG001_L10_P017_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "power",
    "sourceKeyAttribute": "Power",
    "sourceCharacterId": 9,
    "firstFrame": 42,
    "labels": {
      "en": "Power",
      "es": "Potencia"
    }
  },
  {
    "id": "base",
    "sourceKeyAttribute": "Base",
    "sourceCharacterId": 10,
    "firstFrame": 42,
    "labels": {
      "en": "Base",
      "es": "Base"
    }
  },
  {
    "id": "show",
    "sourceKeyAttribute": "Show",
    "sourceCharacterId": 15,
    "firstFrame": 149,
    "labels": {
      "en": "Show",
      "es": "Mostrar"
    }
  },
  {
    "id": "exponent",
    "sourceKeyAttribute": "Exponent",
    "sourceCharacterId": 19,
    "firstFrame": 226,
    "labels": {
      "en": "Exponent",
      "es": "Exponente"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L10_P017_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l10-p017-glossary",
  glossaryTerms: SHARED_ALG001_L10_P017_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L10_P017_SOURCE};
export const SHARED_ALG001_L10_P017_MOVIE = candidate.movie;
export const SHARED_ALG001_L10_P017_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L10_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L10_P017_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L10_P017_RENDERER = candidate.Renderer;
export default animationModule;
