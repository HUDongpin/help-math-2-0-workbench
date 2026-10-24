"use client";

import {createPrivateSourceStaticInstructionGlossaryCandidate} from "../private-source-static-instruction-glossary-candidate";
import {SHARED_ALG001_L08_P017_CONFIG, SHARED_ALG001_L08_P017_SOURCE} from "../timelines/shared-alg001-l08-p017";

export const SHARED_ALG001_L08_P017_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "linear-equation",
    "sourceKeyAttribute": "Linear equation",
    "sourceCharacterId": 7,
    "firstFrame": 3,
    "labels": {
      "en": "Linear equation",
      "es": "Ecuación lineal"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterId": 8,
    "firstFrame": 3,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "graph",
    "sourceKeyAttribute": "Graph",
    "sourceCharacterId": 9,
    "firstFrame": 3,
    "labels": {
      "en": "Graph",
      "es": "Gráfico"
    }
  },
  {
    "id": "line",
    "sourceKeyAttribute": "Line",
    "sourceCharacterId": 10,
    "firstFrame": 3,
    "labels": {
      "en": "Line",
      "es": "Línea"
    }
  }
] as const);

const candidate = createPrivateSourceStaticInstructionGlossaryCandidate(SHARED_ALG001_L08_P017_CONFIG, Object.freeze({
  calibrationId: "g678-in02-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l08-p017-glossary",
  glossaryTerms: SHARED_ALG001_L08_P017_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L08_P017_SOURCE};
export const SHARED_ALG001_L08_P017_MOVIE = candidate.movie;
export const SHARED_ALG001_L08_P017_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L08_P017_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L08_P017_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L08_P017_RENDERER = candidate.Renderer;
export default animationModule;
