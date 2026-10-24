"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_DAT001_L01_P008_CONFIG, SHARED_DAT001_L01_P008_SOURCE} from "../timelines/shared-dat001-l01-p008";

export const SHARED_DAT001_L01_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 45,
    "firstFrame": 38,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 46,
    "firstFrame": 38,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "total",
    "sourceKeyAttribute": "Total",
    "sourceCharacterId": 47,
    "firstFrame": 38,
    "labels": {
      "en": "Total",
      "es": "Total"
    }
  },
  {
    "id": "data",
    "sourceKeyAttribute": "Data",
    "sourceCharacterId": 58,
    "firstFrame": 272,
    "labels": {
      "en": "Data",
      "es": "Datos"
    }
  },
  {
    "id": "range",
    "sourceKeyAttribute": "Range",
    "sourceCharacterId": 59,
    "firstFrame": 272,
    "labels": {
      "en": "Range",
      "es": "Ámbito"
    }
  },
  {
    "id": "difference",
    "sourceKeyAttribute": "Difference",
    "sourceCharacterId": 60,
    "firstFrame": 272,
    "labels": {
      "en": "Difference",
      "es": "Diferencia"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 61,
    "firstFrame": 272,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "greatest",
    "sourceKeyAttribute": "Greatest",
    "sourceCharacterId": 64,
    "firstFrame": 315,
    "labels": {
      "en": "Greatest",
      "es": "El mayor"
    }
  },
  {
    "id": "least",
    "sourceKeyAttribute": "Least",
    "sourceCharacterId": 65,
    "firstFrame": 315,
    "labels": {
      "en": "Least",
      "es": "Mínimo"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_DAT001_L01_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-dat001-l01-p008-glossary",
  glossaryTerms: SHARED_DAT001_L01_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_DAT001_L01_P008_SOURCE};
export const SHARED_DAT001_L01_P008_MOVIE = candidate.movie;
export const SHARED_DAT001_L01_P008_RUNTIME = candidate.runtime;
export const SHARED_DAT001_L01_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_DAT001_L01_P008_SCENARIOS = candidate.scenarios;
export const SHARED_DAT001_L01_P008_RENDERER = candidate.Renderer;
export default animationModule;
