"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L12_P016_CONFIG, SHARED_ALG001_L12_P016_SOURCE} from "../timelines/shared-alg001-l12-p016";

export const SHARED_ALG001_L12_P016_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "coordinate-plane",
    "sourceKeyAttribute": "Coordinate plane",
    "sourceCharacterId": 34,
    "firstFrame": 8,
    "labels": {
      "en": "Coordinate plane",
      "es": "Plano de coordenadas"
    }
  },
  {
    "id": "point",
    "sourceKeyAttribute": "Point",
    "sourceCharacterId": 35,
    "firstFrame": 8,
    "labels": {
      "en": "Point",
      "es": "Punto"
    }
  },
  {
    "id": "ordered-pair",
    "sourceKeyAttribute": "Ordered pair",
    "sourceCharacterId": 38,
    "firstFrame": 63,
    "labels": {
      "en": "Ordered pair",
      "es": "Par ordenado"
    }
  },
  {
    "id": "coordinates",
    "sourceKeyAttribute": "Coordinates",
    "sourceCharacterId": 39,
    "firstFrame": 63,
    "labels": {
      "en": "Coordinates",
      "es": "Coordenadas"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 42,
    "firstFrame": 98,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  },
  {
    "id": "perpendicular",
    "sourceKeyAttribute": "Perpendicular",
    "sourceCharacterId": 43,
    "firstFrame": 98,
    "labels": {
      "en": "Perpendicular",
      "es": "Perpendicular"
    }
  },
  {
    "id": "number-line",
    "sourceKeyAttribute": "Number line",
    "sourceCharacterId": 44,
    "firstFrame": 98,
    "labels": {
      "en": "Number line",
      "es": "Recta numérica"
    }
  },
  {
    "id": "horizontal",
    "sourceKeyAttribute": "Horizontal",
    "sourceCharacterId": 47,
    "firstFrame": 162,
    "labels": {
      "en": "Horizontal",
      "es": "Horizontal"
    }
  },
  {
    "id": "x-axis",
    "sourceKeyAttribute": "X-axis",
    "sourceCharacterId": 48,
    "firstFrame": 162,
    "labels": {
      "en": "X-axis",
      "es": "Eje x"
    }
  },
  {
    "id": "vertical",
    "sourceKeyAttribute": "Vertical",
    "sourceCharacterId": 49,
    "firstFrame": 162,
    "labels": {
      "en": "Vertical",
      "es": "Vertical"
    }
  },
  {
    "id": "y-axis",
    "sourceKeyAttribute": "Y-axis",
    "sourceCharacterId": 50,
    "firstFrame": 162,
    "labels": {
      "en": "Y-axis",
      "es": "Eje y"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L12_P016_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l12-p016-glossary",
  glossaryTerms: SHARED_ALG001_L12_P016_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L12_P016_SOURCE};
export const SHARED_ALG001_L12_P016_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P016_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P016_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P016_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P016_RENDERER = candidate.Renderer;
export default animationModule;
