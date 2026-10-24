"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L08_P008_CONFIG, SHARED_ALG001_L08_P008_SOURCE} from "../timelines/shared-alg001-l08-p008";

export const SHARED_ALG001_L08_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "measure",
    "sourceKeyAttribute": "Measure",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Measure",
      "es": "Medir"
    }
  },
  {
    "id": "slope",
    "sourceKeyAttribute": "Slope",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Slope",
      "es": "Pendiente"
    }
  },
  {
    "id": "line",
    "sourceKeyAttribute": "Line",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Line",
      "es": "Línea"
    }
  },
  {
    "id": "steep",
    "sourceKeyAttribute": "Steep",
    "sourceCharacterId": 11,
    "firstFrame": 1,
    "labels": {
      "en": "Steep",
      "es": "Empinar"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 14,
    "firstFrame": 47,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "vertical",
    "sourceKeyAttribute": "Vertical",
    "sourceCharacterId": 15,
    "firstFrame": 47,
    "labels": {
      "en": "Vertical",
      "es": "Vertical"
    }
  },
  {
    "id": "rise",
    "sourceKeyAttribute": "Rise",
    "sourceCharacterId": 18,
    "firstFrame": 129,
    "labels": {
      "en": "Rise",
      "es": "Elevación"
    }
  },
  {
    "id": "run",
    "sourceKeyAttribute": "Run",
    "sourceCharacterId": 19,
    "firstFrame": 129,
    "labels": {
      "en": "Run",
      "es": "Distancia horizontal"
    }
  },
  {
    "id": "horizontal",
    "sourceKeyAttribute": "Horizontal",
    "sourceCharacterId": 20,
    "firstFrame": 129,
    "labels": {
      "en": "Horizontal",
      "es": "Horizontal"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L08_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l08-p008-glossary",
  glossaryTerms: SHARED_ALG001_L08_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L08_P008_SOURCE};
export const SHARED_ALG001_L08_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L08_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L08_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L08_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L08_P008_RENDERER = candidate.Renderer;
export default animationModule;
