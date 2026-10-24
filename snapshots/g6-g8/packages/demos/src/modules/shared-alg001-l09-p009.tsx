"use client";

import {createPrivateSourceStaticAlgL09TerminalStopCandidate} from "../private-source-static-alg-l09-terminal-stop-candidate";
import {SHARED_ALG001_L09_P009_CONFIG, SHARED_ALG001_L09_P009_SOURCE} from "../timelines/shared-alg001-l09-p009";

export const SHARED_ALG001_L09_P009_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterId": 8,
    "firstFrame": 2,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 9,
    "firstFrame": 2,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterId": 10,
    "firstFrame": 2,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterId": 11,
    "firstFrame": 2,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TerminalStopCandidate(SHARED_ALG001_L09_P009_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-terminal-stop-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p009-glossary",
  glossaryTerms: SHARED_ALG001_L09_P009_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P009_SOURCE};
export const SHARED_ALG001_L09_P009_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P009_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P009_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P009_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P009_RENDERER = candidate.Renderer;
export default animationModule;
