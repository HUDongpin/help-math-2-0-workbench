"use client";

import {createPrivateSourceStaticAlgL09Vb06DragCandidate} from "../private-source-static-alg-l09-vb06-drag-candidate";
import {SHARED_ALG001_L09_P012_CONFIG, SHARED_ALG001_L09_P012_SOURCE} from "../timelines/shared-alg001-l09-p012";

export const SHARED_ALG001_L09_P012_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterId": 12,
    "firstFrame": 1,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterId": 13,
    "firstFrame": 1,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  },
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09Vb06DragCandidate(SHARED_ALG001_L09_P012_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-vb06-drag-product-calibration-v1",
  glossaryTerms: SHARED_ALG001_L09_P012_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P012_SOURCE};
export const SHARED_ALG001_L09_P012_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P012_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P012_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P012_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P012_RENDERER = candidate.Renderer;
export default animationModule;
