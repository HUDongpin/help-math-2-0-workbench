"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P025_CONFIG, SHARED_ALG001_L09_P025_SOURCE} from "../timelines/shared-alg001-l09-p025";

export const SHARED_ALG001_L09_P025_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p025",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI03.swf",
    "bytes": 690429,
    "sha256": "3269083d54867d5096200e5d971fb666783ab899ee2431e6918892b0357e034f"
  },
  "frameDomain": "sprite-362",
  "frameCount": 288,
  "stopFrame": 68,
  "resumeFrame": 69,
  "sourceTerminalStopPresent": true,
  "correctChoice": "choice-c",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "2:3",
      "sourceButtonCharacterId": 168,
      "sourceButtonDepth": 54,
      "sourceInstanceName": "AnsBtn1",
      "correct": false,
      "wrong": {
        "first": "The ratio cannot be simplified. Try again.",
        "second": "The ratio cannot be simplified."
      }
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "3:4",
      "sourceButtonCharacterId": 168,
      "sourceButtonDepth": 58,
      "sourceInstanceName": "AnsBtn2",
      "correct": false,
      "wrong": {
        "first": "The ratio cannot be simplified. Try again.",
        "second": "The ratio cannot be simplified."
      }
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "27 to 38",
      "sourceButtonCharacterId": 169,
      "sourceButtonDepth": 56,
      "sourceInstanceName": "AnsBtn3",
      "correct": true,
      "wrong": null
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "38 to 27",
      "sourceButtonCharacterId": 170,
      "sourceButtonDepth": 60,
      "sourceInstanceName": "AnsBtn4",
      "correct": false,
      "wrong": {
        "first": "The number in the numerator should be the first number. Try again.",
        "second": "The number in the numerator should be the first number."
      }
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "Which ratio is equivalent to 27/38?",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": false,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": true
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P025_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterIds": [
      139
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterIds": [
      140,
      155
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "numerator",
    "sourceKeyAttribute": "Numerator",
    "sourceCharacterIds": [
      142
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Numerator",
      "es": "Numerador"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      141,
      151
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "simplest-form",
    "sourceKeyAttribute": "Simplest form",
    "sourceCharacterIds": [
      144
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Simplest Form",
      "es": "Forma más simple"
    }
  },
  {
    "id": "simplify",
    "sourceKeyAttribute": "Simplify",
    "sourceCharacterIds": [
      143
    ],
    "firstFrame": 68,
    "labels": {
      "en": "Simplify",
      "es": "Simplificar"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P025_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p025-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P025_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P025_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P025_SOURCE};
export const SHARED_ALG001_L09_P025_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P025_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P025_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P025_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P025_RENDERER = candidate.Renderer;
export default animationModule;
