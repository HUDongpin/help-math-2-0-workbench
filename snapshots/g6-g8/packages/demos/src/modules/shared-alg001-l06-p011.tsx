"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L06_P011_CONFIG, SHARED_ALG001_L06_P011_SOURCE} from "../timelines/shared-alg001-l06-p011";

export const SHARED_ALG001_L06_P011_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "formula",
    "sourceKeyAttribute": "Formula",
    "sourceCharacterId": 7,
    "firstFrame": 2,
    "labels": {
      "en": "Formula",
      "es": "Fórmula"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 8,
    "firstFrame": 2,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "calculate",
    "sourceKeyAttribute": "Calculate",
    "sourceCharacterId": 9,
    "firstFrame": 2,
    "labels": {
      "en": "Calculate",
      "es": "Calcular"
    }
  },
  {
    "id": "measurement",
    "sourceKeyAttribute": "Measurement",
    "sourceCharacterId": 10,
    "firstFrame": 2,
    "labels": {
      "en": "Measurement",
      "es": "Medición"
    }
  },
  {
    "id": "area",
    "sourceKeyAttribute": "Area",
    "sourceCharacterId": 17,
    "firstFrame": 67,
    "labels": {
      "en": "Area",
      "es": "Área"
    }
  },
  {
    "id": "rectangle",
    "sourceKeyAttribute": "Rectangle",
    "sourceCharacterId": 18,
    "firstFrame": 67,
    "labels": {
      "en": "Rectangle",
      "es": "Rectángulo"
    }
  },
  {
    "id": "fahrenheit",
    "sourceKeyAttribute": "Fahrenheit",
    "sourceCharacterId": 32,
    "firstFrame": 348,
    "labels": {
      "en": "Fahrenheit",
      "es": "Fahrenheit"
    }
  },
  {
    "id": "celsius",
    "sourceKeyAttribute": "Celsius",
    "sourceCharacterId": 33,
    "firstFrame": 348,
    "labels": {
      "en": "Celsius",
      "es": "Celsius"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L06_P011_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l06-p011-glossary",
  glossaryTerms: SHARED_ALG001_L06_P011_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P011_SOURCE};
export const SHARED_ALG001_L06_P011_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P011_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P011_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P011_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P011_RENDERER = candidate.Renderer;
export default animationModule;
