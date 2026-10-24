"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L06_P012_CONFIG, SHARED_ALG001_L06_P012_SOURCE} from "../timelines/shared-alg001-l06-p012";

export const SHARED_ALG001_L06_P012_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "fahrenheit",
    "sourceKeyAttribute": "Fahrenheit",
    "sourceCharacterId": 10,
    "firstFrame": 2,
    "labels": {
      "en": "Fahrenheit",
      "es": "Fahrenheit"
    }
  },
  {
    "id": "celsius",
    "sourceKeyAttribute": "Celsius",
    "sourceCharacterId": 11,
    "firstFrame": 2,
    "labels": {
      "en": "Celsius",
      "es": "Celsius"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L06_P012_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l06-p012-glossary",
  glossaryTerms: SHARED_ALG001_L06_P012_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P012_SOURCE};
export const SHARED_ALG001_L06_P012_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P012_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P012_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P012_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P012_RENDERER = candidate.Renderer;
export default animationModule;
