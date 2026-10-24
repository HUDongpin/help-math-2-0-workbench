"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L01_P008_CONFIG, SHARED_ALG001_L01_P008_SOURCE} from "../timelines/shared-alg001-l01-p008";

export const SHARED_ALG001_L01_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "chart",
    "sourceKeyAttribute": "Chart",
    "sourceCharacterId": 6,
    "firstFrame": 2,
    "labels": {
      "en": "Chart",
      "es": "Gráfico"
    }
  },
  {
    "id": "graph",
    "sourceKeyAttribute": "Graph",
    "sourceCharacterId": 7,
    "firstFrame": 2,
    "labels": {
      "en": "Graph",
      "es": "Gráfico"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L01_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l01-p008-glossary",
  glossaryTerms: SHARED_ALG001_L01_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L01_P008_SOURCE};
export const SHARED_ALG001_L01_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L01_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L01_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L01_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L01_P008_RENDERER = candidate.Renderer;
export default animationModule;
