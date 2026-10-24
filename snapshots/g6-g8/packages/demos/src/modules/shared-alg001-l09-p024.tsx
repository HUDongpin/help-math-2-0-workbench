"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P024_CONFIG, SHARED_ALG001_L09_P024_SOURCE} from "../timelines/shared-alg001-l09-p024";

export const SHARED_ALG001_L09_P024_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p024",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI02.swf",
    "bytes": 244529,
    "sha256": "9c04f29855a05de5a3bc84418416449898f9ac179fc8012418c018391cadc377"
  },
  "frameDomain": "sprite-345",
  "frameCount": 352,
  "stopFrame": 132,
  "resumeFrame": 133,
  "sourceTerminalStopPresent": true,
  "correctChoice": "choice-b",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "2:3",
      "sourceButtonCharacterId": 165,
      "sourceButtonDepth": 51,
      "sourceInstanceName": "AnsBtn1",
      "correct": false,
      "wrong": {
        "first": "It’s oranges:apples not apples:oranges. Try again.",
        "second": "It’s oranges:apples not apples:oranges."
      }
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "3:2",
      "sourceButtonCharacterId": 166,
      "sourceButtonDepth": 53,
      "sourceInstanceName": "AnsBtn3",
      "correct": true,
      "wrong": null
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "6:9",
      "sourceButtonCharacterId": 167,
      "sourceButtonDepth": 55,
      "sourceInstanceName": "AnsBtn2",
      "correct": false,
      "wrong": {
        "first": "It’s oranges:apples not apples:oranges. Try again.",
        "second": "It’s oranges:apples not apples:oranges."
      }
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "9:6",
      "sourceButtonCharacterId": 168,
      "sourceButtonDepth": 57,
      "sourceInstanceName": "AnsBtn4",
      "correct": false,
      "wrong": {
        "first": "Simplify the ratio. Try again.",
        "second": "Simplify the ratio."
      }
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "Joni’s mom bought 6 apples and 9 oranges. What is the ratio of oranges to apples? Choose the answer in its simplest form.",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": true,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": false
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P024_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterIds": [
      143
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "factors",
    "sourceKeyAttribute": "Factors",
    "sourceCharacterIds": [
      144
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Factors",
      "es": "Factores"
    }
  },
  {
    "id": "greater",
    "sourceKeyAttribute": "Greater",
    "sourceCharacterIds": [
      141
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Greater",
      "es": "Mayor que"
    }
  },
  {
    "id": "numerator",
    "sourceKeyAttribute": "Numerator",
    "sourceCharacterIds": [
      142
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Numerator",
      "es": "Numerador"
    }
  },
  {
    "id": "order",
    "sourceKeyAttribute": "Order",
    "sourceCharacterIds": [
      138
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Order",
      "es": "Orden"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      137,
      151
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "simplest-form",
    "sourceKeyAttribute": "Simplest form",
    "sourceCharacterIds": [
      140,
      152
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Simplest Form",
      "es": "Forma más simple"
    }
  },
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterIds": [
      139
    ],
    "firstFrame": 132,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P024_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p024-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P024_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P024_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P024_SOURCE};
export const SHARED_ALG001_L09_P024_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P024_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P024_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P024_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P024_RENDERER = candidate.Renderer;
export default animationModule;
