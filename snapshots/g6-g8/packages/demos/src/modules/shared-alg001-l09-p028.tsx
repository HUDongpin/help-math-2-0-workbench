"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P028_CONFIG, SHARED_ALG001_L09_P028_SOURCE} from "../timelines/shared-alg001-l09-p028";

export const SHARED_ALG001_L09_P028_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p028",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI06.swf",
    "bytes": 327879,
    "sha256": "a7cf64d6f2d24533cc496e1605dc9fe8753650c72350a79a07ce9a1e99a0d728"
  },
  "frameDomain": "sprite-345",
  "frameCount": 588,
  "stopFrame": 177,
  "resumeFrame": 178,
  "sourceTerminalStopPresent": true,
  "correctChoice": "choice-b",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "non-proportional relationship",
      "sourceButtonCharacterId": 180,
      "sourceButtonDepth": 50,
      "sourceInstanceName": "AnsBtn3",
      "correct": false,
      "wrong": {
        "first": "Find the ratio for each row of numbers in the table. Are all of the ratios equal? Try again.",
        "second": "Find the ratio for each row of numbers in the table. Are all of the ratios equal?"
      }
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "proportional relationship",
      "sourceButtonCharacterId": 179,
      "sourceButtonDepth": 48,
      "sourceInstanceName": "AnsBtn1",
      "correct": true,
      "wrong": null
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "Describe the relationship between the number of people who attend the theater and the money earned by the theater.",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": true,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": false
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P028_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      138
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterIds": [
      141
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  },
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterIds": [
      136
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterIds": [
      139
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "relationship",
    "sourceKeyAttribute": "Relationship",
    "sourceCharacterIds": [
      165
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Relationship",
      "es": "Relación"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "value",
    "sourceCharacterIds": [
      142
    ],
    "firstFrame": 177,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P028_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p028-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P028_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P028_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P028_SOURCE};
export const SHARED_ALG001_L09_P028_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P028_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P028_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P028_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P028_RENDERER = candidate.Renderer;
export default animationModule;
