"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P026_CONFIG, SHARED_ALG001_L09_P026_SOURCE} from "../timelines/shared-alg001-l09-p026";

export const SHARED_ALG001_L09_P026_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p026",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI04.swf",
    "bytes": 380502,
    "sha256": "66a6b74f351f9f58df17862f2e482dd1406a8b8f974aab1dd9b093b4fc8234a9"
  },
  "frameDomain": "sprite-336",
  "frameCount": 731,
  "stopFrame": 84,
  "resumeFrame": 85,
  "sourceTerminalStopPresent": true,
  "correctChoice": "choice-a",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "x = 36",
      "sourceButtonCharacterId": 173,
      "sourceButtonDepth": 60,
      "sourceInstanceName": "AnsBtn3",
      "correct": true,
      "wrong": null
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "x = 38",
      "sourceButtonCharacterId": 172,
      "sourceButtonDepth": 58,
      "sourceInstanceName": "AnsBtn1",
      "correct": false,
      "wrong": {
        "first": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right. Try again.",
        "second": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right."
      }
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "x = 46",
      "sourceButtonCharacterId": 174,
      "sourceButtonDepth": 62,
      "sourceInstanceName": "AnsBtn2",
      "correct": false,
      "wrong": {
        "first": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right. Try again.",
        "second": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right."
      }
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "x = 64",
      "sourceButtonCharacterId": 174,
      "sourceButtonDepth": 64,
      "sourceInstanceName": "AnsBtn4",
      "correct": false,
      "wrong": {
        "first": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right. Try again.",
        "second": "To solve the proportion, first multiply both ratios by the denominator of the ratio on the left. Next multiply both sides of the equation by the denominator on the right."
      }
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "Solve the proportion 6/8 = x/48.",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": true,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": false
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P026_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "coefficient",
    "sourceKeyAttribute": "Coefficient",
    "sourceCharacterIds": [
      142
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Coefficient",
      "es": "Coeficiente"
    }
  },
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterIds": [
      141
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      138
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterIds": [
      144,
      151
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "solve",
    "sourceKeyAttribute": "Solve",
    "sourceCharacterIds": [
      154
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterIds": [
      143
    ],
    "firstFrame": 84,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P026_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p026-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P026_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P026_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P026_SOURCE};
export const SHARED_ALG001_L09_P026_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P026_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P026_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P026_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P026_RENDERER = candidate.Renderer;
export default animationModule;
