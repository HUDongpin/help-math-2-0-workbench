"use client";

import {createPrivateSourceStaticAlgL09GuidedTutorialCandidate} from "../private-source-static-alg-l09-guided-tutorial-candidate";
import type {AlgL09GuidedTutorialBehavior} from "../g678-alg-l09-guided-tutorial";
import {SHARED_ALG001_L09_P038_CONFIG, SHARED_ALG001_L09_P038_SOURCE} from "../timelines/shared-alg001-l09-p038";

export const SHARED_ALG001_L09_P038_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p038",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS08.swf",
    "bytes": 567267,
    "sha256": "453e9b535c6b349e8ed94598e8db555339d67dc15ac4b89042a117379761112a"
  },
  "frameDomain": "sprite-329",
  "frameCount": 934,
  "stops": [
    {
      "id": "step-1",
      "frame": 391,
      "resumeFrame": 392,
      "kind": "continue"
    },
    {
      "id": "step-2",
      "frame": 560,
      "resumeFrame": 561,
      "kind": "continue"
    },
    {
      "id": "help-1",
      "frame": 708,
      "resumeFrame": 709,
      "kind": "help-or-continue"
    },
    {
      "id": "help-2",
      "frame": 865,
      "resumeFrame": 866,
      "kind": "help-or-continue"
    },
    {
      "id": "quiz",
      "frame": 917,
      "resumeFrame": 918,
      "kind": "quiz"
    },
    {
      "id": "terminal",
      "frame": 934,
      "resumeFrame": null,
      "kind": "terminal"
    }
  ],
  "finalQuestion": "What is the value of M?",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "M = 2",
      "correct": true
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "M = 7.5",
      "correct": false
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "M = 15",
      "correct": false
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "M = 20",
      "correct": false
    }
  ],
  "correctChoiceId": "choice-a",
  "maximumWrongAttempts": 2,
  "sourceFeedbackDomainCount": 8
} satisfies AlgL09GuidedTutorialBehavior);

export const SHARED_ALG001_L09_P038_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "acute-angle",
    "sourceKeyAttribute": "Acute angle",
    "sourceCharacterIds": [
      318
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Acute angle",
      "es": "Ángulo agudo"
    }
  },
  {
    "id": "coefficient",
    "sourceKeyAttribute": "Coefficient",
    "sourceCharacterIds": [
      311
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Coefficient",
      "es": "Coeficiente"
    }
  },
  {
    "id": "degree",
    "sourceKeyAttribute": "Degree",
    "sourceCharacterIds": [
      320
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Degree",
      "es": "Grado"
    }
  },
  {
    "id": "denominator",
    "sourceKeyAttribute": "Denominator",
    "sourceCharacterIds": [
      310
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Denominator",
      "es": "Denominador"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      309
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "equivalent",
    "sourceKeyAttribute": "Equivalent",
    "sourceCharacterIds": [
      308
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Equivalent",
      "es": "Equivalente"
    }
  },
  {
    "id": "greater",
    "sourceKeyAttribute": "Greater",
    "sourceCharacterIds": [
      327
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Greater",
      "es": "Mayor que"
    }
  },
  {
    "id": "line",
    "sourceKeyAttribute": "Line",
    "sourceCharacterIds": [
      325
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Line",
      "es": "Línea"
    }
  },
  {
    "id": "measure",
    "sourceKeyAttribute": "Measure",
    "sourceCharacterIds": [
      321
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Measure",
      "es": "Medir"
    }
  },
  {
    "id": "obtuse-angle",
    "sourceKeyAttribute": "Obtuse angle",
    "sourceCharacterIds": [
      323
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Obtuse angle",
      "es": "Ángulo obtuso"
    }
  },
  {
    "id": "proportion",
    "sourceKeyAttribute": "Proportion",
    "sourceCharacterIds": [
      26
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Proportion",
      "es": "Proporción"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      307
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Ratio",
      "es": "Razón"
    }
  },
  {
    "id": "right-angle",
    "sourceKeyAttribute": "Right angle",
    "sourceCharacterIds": [
      322,
      326
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Right Angle",
      "es": "Ángulo recto"
    }
  },
  {
    "id": "square-corner",
    "sourceKeyAttribute": "Square corner",
    "sourceCharacterIds": [
      319
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Square corner",
      "es": "Esquina"
    }
  },
  {
    "id": "straight-angle",
    "sourceKeyAttribute": "Straight angle",
    "sourceCharacterIds": [
      324
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Straight angle",
      "es": "Ángulo extendido"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterIds": [
      19
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  },
  {
    "id": "variable",
    "sourceKeyAttribute": "Variable",
    "sourceCharacterIds": [
      312
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Variable",
      "es": "Variable"
    }
  }
] as const);

export const SHARED_ALG001_L09_P038_HELP_PROMPTS = Object.freeze([
  {
    "stopId": "help-1",
    "text": {
      "en": "Information given: a proportion ; Information needed: What is M?",
      "es": "Dato dado: una proporción. Información necesaria: el valor de M."
    }
  },
  {
    "stopId": "help-2",
    "text": {
      "en": "Multiply both ratios by M. Next, multiply both quantities by 5 Then divide by the coefficient of M. 2 = M or M = 2",
      "es": "Multiplica ambas razones por M, multiplica ambas cantidades por 5 y divide entre el coeficiente de M."
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09GuidedTutorialCandidate(SHARED_ALG001_L09_P038_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-guided-tutorial-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p038-guided-tutorial",
  behavior: SHARED_ALG001_L09_P038_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P038_GLOSSARY_TERMS,
  helpPrompts: SHARED_ALG001_L09_P038_HELP_PROMPTS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P038_SOURCE};
export const SHARED_ALG001_L09_P038_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P038_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P038_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P038_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P038_RENDERER = candidate.Renderer;
export default animationModule;
