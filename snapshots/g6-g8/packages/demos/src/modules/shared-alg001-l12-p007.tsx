"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L12_P007_CONFIG, SHARED_ALG001_L12_P007_SOURCE} from "../timelines/shared-alg001-l12-p007";

export const SHARED_ALG001_L12_P007_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "coordinate-plane-cartesian-plane",
    "sourceKeyAttribute": "Coordinate plane/Cartesian Plane",
    "sourceCharacterId": 8,
    "firstFrame": 40,
    "labels": {
      "en": "Coordinate plane/Cartesian Plane",
      "es": "Plano de coordenadas"
    }
  },
  {
    "id": "grid",
    "sourceKeyAttribute": "Grid",
    "sourceCharacterId": 9,
    "firstFrame": 40,
    "labels": {
      "en": "Grid",
      "es": "Cuadrícula"
    }
  },
  {
    "id": "point",
    "sourceKeyAttribute": "Point",
    "sourceCharacterId": 10,
    "firstFrame": 40,
    "labels": {
      "en": "Point",
      "es": "Punto"
    }
  },
  {
    "id": "ordered-pair",
    "sourceKeyAttribute": "Ordered pair",
    "sourceCharacterId": 13,
    "firstFrame": 107,
    "labels": {
      "en": "Ordered pair",
      "es": "Par ordenado"
    }
  },
  {
    "id": "coordinate",
    "sourceKeyAttribute": "Coordinate",
    "sourceCharacterId": 14,
    "firstFrame": 107,
    "labels": {
      "en": "Coordinate",
      "es": "Coordenada"
    }
  },
  {
    "id": "perpendicular-lines",
    "sourceKeyAttribute": "Perpendicular lines",
    "sourceCharacterId": 18,
    "firstFrame": 146,
    "labels": {
      "en": "Perpendicular lines",
      "es": "Líneas perpendiculares"
    }
  },
  {
    "id": "number-line",
    "sourceKeyAttribute": "Number line",
    "sourceCharacterId": 19,
    "firstFrame": 146,
    "labels": {
      "en": "Number line",
      "es": "Recta numérica"
    }
  },
  {
    "id": "y-axis",
    "sourceKeyAttribute": "Y-axis",
    "sourceCharacterId": 24,
    "firstFrame": 200,
    "labels": {
      "en": "Y-axis",
      "es": "Eje y"
    }
  },
  {
    "id": "vertical",
    "sourceKeyAttribute": "Vertical",
    "sourceCharacterId": 25,
    "firstFrame": 200,
    "labels": {
      "en": "Vertical",
      "es": "Vertical"
    }
  },
  {
    "id": "x-axis",
    "sourceKeyAttribute": "X-axis",
    "sourceCharacterId": 26,
    "firstFrame": 200,
    "labels": {
      "en": "X-axis",
      "es": "Eje x"
    }
  },
  {
    "id": "horizontal",
    "sourceKeyAttribute": "Horizontal",
    "sourceCharacterId": 27,
    "firstFrame": 200,
    "labels": {
      "en": "Horizontal",
      "es": "Horizontal"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L12_P007_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l12-p007-glossary",
  glossaryTerms: SHARED_ALG001_L12_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L12_P007_SOURCE};
export const SHARED_ALG001_L12_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P007_RENDERER = candidate.Renderer;
export default animationModule;
