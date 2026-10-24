"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L09_P014_CONFIG, SHARED_ALG001_L09_P014_SOURCE} from "../timelines/shared-alg001-l09-p014";

export const SHARED_ALG001_L09_P014_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "spam",
    "sourceKeyAttribute": "Spam",
    "sourceCharacterId": 7,
    "firstFrame": 4,
    "labels": {
      "en": "Spam",
      "es": "Correo basura"
    }
  },
  {
    "id": "e-mail",
    "sourceKeyAttribute": "E-mail",
    "sourceCharacterId": 8,
    "firstFrame": 4,
    "labels": {
      "en": "E-mail",
      "es": "Correo electrónico"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L09_P014_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p014-glossary",
  glossaryTerms: SHARED_ALG001_L09_P014_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P014_SOURCE};
export const SHARED_ALG001_L09_P014_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P014_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P014_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P014_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P014_RENDERER = candidate.Renderer;
export default animationModule;
