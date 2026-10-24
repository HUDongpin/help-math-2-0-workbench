"use client";

import {createPrivateSourceStaticVocabularyGlossaryCandidate} from "../private-source-static-vocabulary-glossary-candidate";
import {SHARED_ALG001_L01_P007_CONFIG, SHARED_ALG001_L01_P007_SOURCE} from "../timelines/shared-alg001-l01-p007";

export const SHARED_ALG001_L01_P007_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "relationship",
    "sourceKeyAttribute": "Relationship",
    "sourceCharacterId": 6,
    "firstFrame": 53,
    "labels": {
      "en": "Relationship",
      "es": "Relación"
    }
  },
  {
    "id": "set",
    "sourceKeyAttribute": "Set",
    "sourceCharacterId": 7,
    "firstFrame": 53,
    "labels": {
      "en": "Set",
      "es": "Conjunto"
    }
  },
  {
    "id": "graph",
    "sourceKeyAttribute": "Graph",
    "sourceCharacterId": 8,
    "firstFrame": 53,
    "labels": {
      "en": "Graph",
      "es": "Gráfico"
    }
  },
  {
    "id": "coordinate-plane",
    "sourceKeyAttribute": "Coordinate plane",
    "sourceCharacterId": 11,
    "firstFrame": 110,
    "labels": {
      "en": "Coordinate plane",
      "es": "Plano de coordenadas"
    }
  },
  {
    "id": "number-line",
    "sourceKeyAttribute": "Number line",
    "sourceCharacterId": 12,
    "firstFrame": 110,
    "labels": {
      "en": "Number line",
      "es": "Recta numérica"
    }
  }
] as const);

const candidate = createPrivateSourceStaticVocabularyGlossaryCandidate(SHARED_ALG001_L01_P007_CONFIG, Object.freeze({
  calibrationId: "g678-vb02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l01-p007-glossary",
  glossaryTerms: SHARED_ALG001_L01_P007_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L01_P007_SOURCE};
export const SHARED_ALG001_L01_P007_MOVIE = candidate.movie;
export const SHARED_ALG001_L01_P007_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L01_P007_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L01_P007_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L01_P007_RENDERER = candidate.Renderer;
export default animationModule;
