"use client";

import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";
import {SHARED_ALG001_L11_P022_CONFIG, SHARED_ALG001_L11_P022_SOURCE} from "../timelines/shared-alg001-l11-p022";

export const SHARED_ALG001_L11_P022_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterId": 7,
    "firstFrame": 9,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  }
] as const);

const candidate = createPrivateAlgL11SimpleGlossaryCandidate(SHARED_ALG001_L11_P022_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-simple-glossary-tranche1-candidate-v1",
  companionSurfaceId: "shared-alg001-l11-p022-glossary",
  glossaryTerms: SHARED_ALG001_L11_P022_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P022_SOURCE};
export const SHARED_ALG001_L11_P022_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P022_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P022_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P022_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P022_RENDERER = candidate.Renderer;
export default animationModule;
