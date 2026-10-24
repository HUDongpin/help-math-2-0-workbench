"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_DAT001_L01_P018_CONFIG, SHARED_DAT001_L01_P018_SOURCE} from "../timelines/shared-dat001-l01-p018";

export const SHARED_DAT001_L01_P018_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "data",
    "sourceKeyAttribute": "Data",
    "sourceCharacterId": 9,
    "firstFrame": 31,
    "labels": {
      "en": "Data",
      "es": "Datos"
    }
  },
  {
    "id": "information",
    "sourceKeyAttribute": "Information",
    "sourceCharacterId": 10,
    "firstFrame": 31,
    "labels": {
      "en": "Information",
      "es": "Información"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 11,
    "firstFrame": 31,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 12,
    "firstFrame": 31,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "range",
    "sourceKeyAttribute": "Range",
    "sourceCharacterId": 33,
    "firstFrame": 224,
    "labels": {
      "en": "Range",
      "es": "Ámbito"
    }
  },
  {
    "id": "difference",
    "sourceKeyAttribute": "Difference",
    "sourceCharacterId": 34,
    "firstFrame": 224,
    "labels": {
      "en": "Difference",
      "es": "Diferencia"
    }
  },
  {
    "id": "greatest",
    "sourceKeyAttribute": "Greatest",
    "sourceCharacterId": 35,
    "firstFrame": 224,
    "labels": {
      "en": "Greatest",
      "es": "El mayor"
    }
  },
  {
    "id": "least",
    "sourceKeyAttribute": "Least",
    "sourceCharacterId": 46,
    "firstFrame": 504,
    "labels": {
      "en": "Least",
      "es": "Mínimo"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_DAT001_L01_P018_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-dat001-l01-p018-glossary",
  glossaryTerms: SHARED_DAT001_L01_P018_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L01_P018_SOURCE};
export const SHARED_DAT001_L01_P018_MOVIE = candidate.movie;
export const SHARED_DAT001_L01_P018_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L01_P018_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L01_P018_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L01_P018_RENDERER = candidate.Renderer;
export default animationModule;
