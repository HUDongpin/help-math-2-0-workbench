"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P023_CONFIG, SHARED_ALG001_L09_P023_SOURCE} from "../timelines/shared-alg001-l09-p023";

export const SHARED_ALG001_L09_P023_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "scale",
    "sourceKeyAttribute": "Scale",
    "sourceCharacterId": 61,
    "firstFrame": 11,
    "labels": {
      "en": "Scale",
      "es": "Escala"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P023_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p023-glossary",
  glossaryTerms: SHARED_ALG001_L09_P023_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P023_SOURCE};
export const SHARED_ALG001_L09_P023_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P023_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P023_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P023_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P023_RENDERER = candidate.Renderer;
export default animationModule;
