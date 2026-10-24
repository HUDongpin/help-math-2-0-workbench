"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L02_P009_CONFIG, SHARED_ALG001_L02_P009_SOURCE} from "../timelines/shared-alg001-l02-p009";

export const SHARED_ALG001_L02_P009_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterId": 9,
    "firstFrame": 3,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 10,
    "firstFrame": 3,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 20,
    "firstFrame": 255,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  },
  {
    "id": "constant",
    "sourceKeyAttribute": "Constant",
    "sourceCharacterId": 36,
    "firstFrame": 431,
    "labels": {
      "en": "Constant",
      "es": "Constante"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L02_P009_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l02-p009-glossary",
  glossaryTerms: SHARED_ALG001_L02_P009_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L02_P009_SOURCE};
export const SHARED_ALG001_L02_P009_MOVIE = candidate.movie;
export const SHARED_ALG001_L02_P009_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L02_P009_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L02_P009_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L02_P009_RENDERER = candidate.Renderer;
export default animationModule;
