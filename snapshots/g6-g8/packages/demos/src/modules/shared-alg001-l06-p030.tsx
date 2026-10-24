"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L06_P030_CONFIG, SHARED_ALG001_L06_P030_SOURCE} from "../timelines/shared-alg001-l06-p030";

export const SHARED_ALG001_L06_P030_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "function",
    "sourceKeyAttribute": "Function",
    "sourceCharacterId": 58,
    "firstFrame": 461,
    "labels": {
      "en": "Function",
      "es": "Función"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L06_P030_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l06-p030-glossary",
  glossaryTerms: SHARED_ALG001_L06_P030_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L06_P030_SOURCE};
export const SHARED_ALG001_L06_P030_MOVIE = candidate.movie;
export const SHARED_ALG001_L06_P030_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L06_P030_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L06_P030_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L06_P030_RENDERER = candidate.Renderer;
export default animationModule;
