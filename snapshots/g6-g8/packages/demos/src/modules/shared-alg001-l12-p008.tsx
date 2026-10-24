"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L12_P008_CONFIG, SHARED_ALG001_L12_P008_SOURCE} from "../timelines/shared-alg001-l12-p008";

export const SHARED_ALG001_L12_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "x-axis",
    "sourceKeyAttribute": "X-axis",
    "sourceCharacterId": 7,
    "firstFrame": 1,
    "labels": {
      "en": "X-axis",
      "es": "Eje x"
    }
  },
  {
    "id": "horizontal",
    "sourceKeyAttribute": "Horizontal",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Horizontal",
      "es": "Horizontal"
    }
  },
  {
    "id": "number-line",
    "sourceKeyAttribute": "Number line",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "Number line",
      "es": "Recta numérica"
    }
  },
  {
    "id": "coordinate-plane-cartesian-plane",
    "sourceKeyAttribute": "Coordinate plane/Cartesian Plane",
    "sourceCharacterId": 10,
    "firstFrame": 1,
    "labels": {
      "en": "Coordinate plane/Cartesian Plane",
      "es": "Plano de coordenadas"
    }
  },
  {
    "id": "y-axis",
    "sourceKeyAttribute": "Y-axis",
    "sourceCharacterId": 37,
    "firstFrame": 66,
    "labels": {
      "en": "Y-axis",
      "es": "Eje y"
    }
  },
  {
    "id": "vertical",
    "sourceKeyAttribute": "Vertical",
    "sourceCharacterId": 38,
    "firstFrame": 66,
    "labels": {
      "en": "Vertical",
      "es": "Vertical"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L12_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l12-p008-glossary",
  glossaryTerms: SHARED_ALG001_L12_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L12_P008_SOURCE};
export const SHARED_ALG001_L12_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P008_RENDERER = candidate.Renderer;
export default animationModule;
