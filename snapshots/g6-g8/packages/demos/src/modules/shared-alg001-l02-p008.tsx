"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L02_P008_CONFIG, SHARED_ALG001_L02_P008_SOURCE} from "../timelines/shared-alg001-l02-p008";

export const SHARED_ALG001_L02_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "constant",
    "sourceKeyAttribute": "Constant",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "Constant",
      "es": "Constante"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "fixed-value",
    "sourceKeyAttribute": "Fixed value",
    "sourceCharacterId": 11,
    "firstFrame": 77,
    "labels": {
      "en": "Fixed value",
      "es": "Valor fijo"
    }
  },
  {
    "id": "change",
    "sourceKeyAttribute": "Change",
    "sourceCharacterId": 12,
    "firstFrame": 77,
    "labels": {
      "en": "Change",
      "es": "Cambiar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L02_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l02-p008-glossary",
  glossaryTerms: SHARED_ALG001_L02_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L02_P008_SOURCE};
export const SHARED_ALG001_L02_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L02_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L02_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L02_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L02_P008_RENDERER = candidate.Renderer;
export default animationModule;
