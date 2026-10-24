"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L01_P021_CONFIG, SHARED_ALG001_L01_P021_SOURCE} from "../timelines/shared-alg001-l01-p021";

export const SHARED_ALG001_L01_P021_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "number-line",
    "sourceKeyAttribute": "Number line",
    "sourceCharacterId": 32,
    "firstFrame": 64,
    "labels": {
      "en": "Number line",
      "es": "Recta numérica"
    }
  },
  {
    "id": "order",
    "sourceKeyAttribute": "Order",
    "sourceCharacterId": 33,
    "firstFrame": 64,
    "labels": {
      "en": "Order",
      "es": "Orden"
    }
  },
  {
    "id": "real-numbers",
    "sourceKeyAttribute": "Real numbers",
    "sourceCharacterId": 34,
    "firstFrame": 64,
    "labels": {
      "en": "Real Numbers",
      "es": "Números reales"
    }
  },
  {
    "id": "perpendicular",
    "sourceKeyAttribute": "Perpendicular",
    "sourceCharacterId": 62,
    "firstFrame": 295,
    "labels": {
      "en": "Perpendicular",
      "es": "Perpendicular"
    }
  },
  {
    "id": "intersect",
    "sourceKeyAttribute": "Intersect",
    "sourceCharacterId": 63,
    "firstFrame": 295,
    "labels": {
      "en": "Intersect",
      "es": "Intersecar"
    }
  },
  {
    "id": "origin",
    "sourceKeyAttribute": "Origin",
    "sourceCharacterId": 64,
    "firstFrame": 295,
    "labels": {
      "en": "Origin",
      "es": "Origen"
    }
  },
  {
    "id": "coordinate-plane-cartesian-plane",
    "sourceKeyAttribute": "Coordinate plane/Cartesian plane",
    "sourceCharacterId": 67,
    "firstFrame": 376,
    "labels": {
      "en": "Coordinate plane/Cartesian Plane",
      "es": "Plano de coordenadas"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L01_P021_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l01-p021-glossary",
  glossaryTerms: SHARED_ALG001_L01_P021_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L01_P021_SOURCE};
export const SHARED_ALG001_L01_P021_MOVIE = candidate.movie;
export const SHARED_ALG001_L01_P021_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L01_P021_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L01_P021_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L01_P021_RENDERER = candidate.Renderer;
export default animationModule;
