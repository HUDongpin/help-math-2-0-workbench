"use client";

import {createPrivateSourceStaticAlgL11IntroTerminalCandidate} from "../private-source-static-alg-l11-intro-terminal-candidate";
import {SHARED_ALG001_L11_P004_CONFIG, SHARED_ALG001_L11_P004_SOURCE} from "../timelines/shared-alg001-l11-p004";

export const SHARED_ALG001_L11_P004_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterId": 332,
    "firstFrame": 1290,
    "lastFrame": 1353,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    },
    "definitions": {
      "en": "This is where one thing stands for another. For example: x + 10 = 12; \"x\" represents 2.",
      "es": "Es cuando una letra se encuentra tomando el lugar de un número, expresando su valor. Por ejemplo: x + 10 = 12; \"x\" representa 2."
    }
  },
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 333,
    "firstFrame": 1290,
    "lastFrame": 1353,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    },
    "definitions": {
      "en": "A mathematical sentence that has the symbols > (greater than), < (less than), ≥ (greater than or equal to), ≤ (less than or equal to), or ≠(not equal).",
      "es": "Una expresión matemática que contiene los símbolos > (mayor que), < (menor que), ≥ (mayor o igual que), ≤ (menor o igual que), o ≠ (no es igual que)."
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL11IntroTerminalCandidate(SHARED_ALG001_L11_P004_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-intro-terminal-tranche1-engineering-v1",
  companionSurfaceId: "shared-alg001-l11-p004-glossary",
  glossaryTerms: SHARED_ALG001_L11_P004_GLOSSARY_TERMS,
  sourceStopDisposition: "explicit-source-terminal-stop",
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P004_SOURCE};
export const SHARED_ALG001_L11_P004_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P004_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P004_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P004_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P004_RENDERER = candidate.Renderer;
export default animationModule;
