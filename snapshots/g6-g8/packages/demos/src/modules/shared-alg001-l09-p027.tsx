"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P027_CONFIG, SHARED_ALG001_L09_P027_SOURCE} from "../timelines/shared-alg001-l09-p027";

export const SHARED_ALG001_L09_P027_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p027",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI05.swf",
    "bytes": 787994,
    "sha256": "d6937e6307b373fa3e2b329648386fe54a2f23161bc62927481e5c42cb5ec2e4"
  },
  "frameDomain": "sprite-383",
  "frameCount": 548,
  "stopFrame": 134,
  "resumeFrame": 135,
  "sourceTerminalStopPresent": false,
  "correctChoice": "choice-a",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "non-proportional relationship",
      "sourceButtonCharacterId": 169,
      "sourceButtonDepth": 44,
      "sourceInstanceName": "AnsBtn1",
      "correct": true,
      "wrong": null
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "proportional relationship",
      "sourceButtonCharacterId": 170,
      "sourceButtonDepth": 46,
      "sourceInstanceName": "AnsBtn3",
      "correct": false,
      "wrong": {
        "first": "Check the ratios of each row of the table. Are they equal? Try again.",
        "second": "Check the ratios of each row of the table. Are they equal?"
      }
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "Describe the relationship of the variables in the equation y = (x – 2)(x – 2).",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": false,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": true
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P027_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      140
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterIds": [
      143
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterIds": [
      141
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      137
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "relationship",
    "sourceKeyAttribute": "Relationship",
    "sourceCharacterIds": [
      152
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Relationship",
      "es": "Relación"
    }
  },
  {
    "id": "row",
    "sourceKeyAttribute": "Row",
    "sourceCharacterIds": [
      138
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Row",
      "es": "Fila"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterIds": [
      144
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterIds": [
      153
    ],
    "firstFrame": 134,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P027_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p027-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P027_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P027_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P027_SOURCE};
export const SHARED_ALG001_L09_P027_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P027_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P027_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P027_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P027_RENDERER = candidate.Renderer;
export default animationModule;
