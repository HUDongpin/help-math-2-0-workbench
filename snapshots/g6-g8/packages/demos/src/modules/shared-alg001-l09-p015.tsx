"use client";

import {createPrivateSourceStaticAlgL09SimpleGlossaryCandidate} from "../private-source-static-alg-l09-simple-glossary-candidate";
import {SHARED_ALG001_L09_P015_CONFIG, SHARED_ALG001_L09_P015_SOURCE} from "../timelines/shared-alg001-l09-p015";

export const SHARED_ALG001_L09_P015_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "spam",
    "sourceKeyAttribute": "Spam",
    "sourceCharacterId": 8,
    "firstFrame": 1,
    "labels": {
      "en": "Spam",
      "es": "Correo basura"
    }
  },
  {
    "id": "e-mail",
    "sourceKeyAttribute": "E-mail",
    "sourceCharacterId": 9,
    "firstFrame": 1,
    "labels": {
      "en": "E-mail",
      "es": "Correo electrónico"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09SimpleGlossaryCandidate(SHARED_ALG001_L09_P015_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-simple-glossary-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p015-glossary",
  glossaryTerms: SHARED_ALG001_L09_P015_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P015_SOURCE};
export const SHARED_ALG001_L09_P015_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P015_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P015_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P015_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P015_RENDERER = candidate.Renderer;
export default animationModule;
