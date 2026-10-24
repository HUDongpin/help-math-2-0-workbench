"use client";

import {createPrivateSourceStaticAlgL11IntroTerminalCandidate} from "../private-source-static-alg-l11-intro-terminal-candidate";
import {SHARED_ALG001_L11_P003_CONFIG, SHARED_ALG001_L11_P003_SOURCE} from "../timelines/shared-alg001-l11-p003";

export const SHARED_ALG001_L11_P003_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "inequality",
    "sourceKeyAttribute": "Inequality",
    "sourceCharacterId": 228,
    "firstFrame": 697,
    "lastFrame": 994,
    "labels": {
      "en": "Inequality",
      "es": "Desigualdad"
    },
    "definitions": {
      "en": "A mathematical sentence that has the symbols > (greater than), < (less than), ≥ (greater than or equal to), ≤ (less than or equal to), or ≠(not equal).",
      "es": "Una expresión matemática que contiene los símbolos > (mayor que), < (menor que), ≥ (mayor o igual que), ≤ (menor o igual que), o ≠ (no es igual que)."
    }
  },
  {
    "id": "sentence",
    "sourceKeyAttribute": "Sentence",
    "sourceCharacterId": 229,
    "firstFrame": 697,
    "lastFrame": 994,
    "labels": {
      "en": "Sentence",
      "es": "Expresión"
    },
    "definitions": {
      "en": "A mathematical sentence is one in which a fact or complete idea is expressed. For example: an equation like 2x + 7 = 45 is a mathematical sentence.",
      "es": "Es una expresión en la que un hecho o idea completa es establecida. Por ejemplo: Una ecuación como 2x + 7= 45 es una expresión matemática."
    }
  },
  {
    "id": "symbol",
    "sourceKeyAttribute": "Symbol",
    "sourceCharacterId": 233,
    "firstFrame": 737,
    "lastFrame": 994,
    "labels": {
      "en": "Symbol",
      "es": "Símbolo"
    },
    "definitions": {
      "en": "A mark, sign or symbol which represents something. For example: the symbol for addition is +.",
      "es": "Es un signo o marca que representa algo. Por ejemplo: el símbolo de la suma es el +."
    }
  },
  {
    "id": "greater-than",
    "sourceKeyAttribute": "Greater than",
    "sourceCharacterId": 234,
    "firstFrame": 737,
    "lastFrame": 994,
    "labels": {
      "en": "Greater than",
      "es": "Mayor que"
    },
    "definitions": {
      "en": "Bigger or larger than something else in size or quantity.",
      "es": "Más grande o largo que algo más en tamaño o cantidad."
    }
  },
  {
    "id": "less-than",
    "sourceKeyAttribute": "Less than",
    "sourceCharacterId": 237,
    "firstFrame": 771,
    "lastFrame": 994,
    "labels": {
      "en": "Less than",
      "es": "Menor que"
    },
    "definitions": {
      "en": "Smaller in size or quantity.",
      "es": "Más pequeño que algo en cantidad."
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL11IntroTerminalCandidate(SHARED_ALG001_L11_P003_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-intro-terminal-tranche1-engineering-v1",
  companionSurfaceId: "shared-alg001-l11-p003-glossary",
  glossaryTerms: SHARED_ALG001_L11_P003_GLOSSARY_TERMS,
  sourceStopDisposition: "no-explicit-source-terminal-stop-modern-once-clamp",
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P003_SOURCE};
export const SHARED_ALG001_L11_P003_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P003_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P003_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P003_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P003_RENDERER = candidate.Renderer;
export default animationModule;
