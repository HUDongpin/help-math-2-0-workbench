"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P013_CONFIG, SHARED_ALG001_L09_P013_SOURCE} from "../timelines/shared-alg001-l09-p013";

export const SHARED_ALG001_L09_P013_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "scale",
    "sourceKeyAttribute": "Scale",
    "sourceCharacterId": 7,
    "firstFrame": 3,
    "labels": {
      "en": "Scale",
      "es": "Escala"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 8,
    "firstFrame": 3,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "measurement",
    "sourceKeyAttribute": "Measurement",
    "sourceCharacterId": 9,
    "firstFrame": 3,
    "labels": {
      "en": "Measurement",
      "es": "Medición"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P013_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p013-glossary",
  glossaryTerms: SHARED_ALG001_L09_P013_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P013_SOURCE};
export const SHARED_ALG001_L09_P013_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P013_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P013_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P013_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P013_RENDERER = candidate.Renderer;
export default animationModule;
