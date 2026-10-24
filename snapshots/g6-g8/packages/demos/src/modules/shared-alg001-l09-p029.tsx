"use client";

import {createPrivateSourceStaticAlgL09TiChoiceCandidate} from "../private-source-static-alg-l09-ti-choice-candidate";
import type {AlgL09TiChoiceBehavior} from "../g678-alg-l09-ti-choice";
import {SHARED_ALG001_L09_P029_CONFIG, SHARED_ALG001_L09_P029_SOURCE} from "../timelines/shared-alg001-l09-p029";

export const SHARED_ALG001_L09_P029_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p029",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TI/L9TI07.swf",
    "bytes": 766962,
    "sha256": "ac11180dc224772d864fa318072dd29a465c94f78e74305eec70c9b3ac7af12c"
  },
  "frameDomain": "sprite-383",
  "frameCount": 511,
  "stopFrame": 231,
  "resumeFrame": 232,
  "sourceTerminalStopPresent": true,
  "correctChoice": "choice-c",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "10 miles",
      "sourceButtonCharacterId": 178,
      "sourceButtonDepth": 53,
      "sourceInstanceName": "AnsBtn3",
      "correct": false,
      "wrong": {
        "first": "Hint: 4 / 1 = 60 model feet / d real miles. Try again.",
        "second": "Hint: 4 / 1 = 60 model feet / d real miles."
      }
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "12 miles",
      "sourceButtonCharacterId": 178,
      "sourceButtonDepth": 55,
      "sourceInstanceName": "AnsBtn3",
      "correct": false,
      "wrong": {
        "first": "Hint: 4 / 1 = 60 model feet / d real miles. Try again.",
        "second": "Hint: 4 / 1 = 60 model feet / d real miles."
      }
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "15 miles",
      "sourceButtonCharacterId": 177,
      "sourceButtonDepth": 51,
      "sourceInstanceName": "AnsBtn1",
      "correct": true,
      "wrong": null
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "20 miles",
      "sourceButtonCharacterId": 178,
      "sourceButtonDepth": 57,
      "sourceInstanceName": "AnsBtn3",
      "correct": false,
      "wrong": {
        "first": "Hint: 4 / 1 = 60 model feet / d real miles. Try again.",
        "second": "Hint: 4 / 1 = 60 model feet / d real miles."
      }
    }
  ],
  "maximumWrongAttempts": 2,
  "sourceText": {
    "question": "An engineer built a model for a new public transportation system around the city. Four feet on the model equals one mile in the city. (That means the scale is 4 feet : 1 mile.) How many city miles does 60 feet on the model represent?",
    "correct": "Correct!"
  },
  "sourceFeedbackDomainCount": 8,
  "sourceWrongFeedbackAttemptIncrementComplete": false,
  "maintainedAttemptCounterNormalizesKnownSourceVariantDefect": true
} satisfies AlgL09TiChoiceBehavior);

export const SHARED_ALG001_L09_P029_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "coefficient",
    "sourceKeyAttribute": "Coefficient",
    "sourceCharacterIds": [
      147
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Coefficient",
      "es": "Coeficiente"
    }
  },
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterIds": [
      146
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      145
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterIds": [
      143
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "represent",
    "sourceKeyAttribute": "Represent",
    "sourceCharacterIds": [
      158
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Represent",
      "es": "Representar"
    }
  },
  {
    "id": "scale",
    "sourceKeyAttribute": "Scale",
    "sourceCharacterIds": [
      142
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Scale",
      "es": "Escala"
    }
  },
  {
    "id": "solve",
    "sourceKeyAttribute": "solve",
    "sourceCharacterIds": [
      136
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Solve",
      "es": "Resolver"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterIds": [
      144
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterIds": [
      148
    ],
    "firstFrame": 231,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09TiChoiceCandidate(SHARED_ALG001_L09_P029_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-ti-choice-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p029-ti-choice-quiz",
  behavior: SHARED_ALG001_L09_P029_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P029_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P029_SOURCE};
export const SHARED_ALG001_L09_P029_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P029_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P029_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P029_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P029_RENDERER = candidate.Renderer;
export default animationModule;
