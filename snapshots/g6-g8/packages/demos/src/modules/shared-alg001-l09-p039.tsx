"use client";

import {createPrivateSourceStaticAlgL09GuidedTutorialCandidate} from "../private-source-static-alg-l09-guided-tutorial-candidate";
import type {AlgL09GuidedTutorialBehavior} from "../g678-alg-l09-guided-tutorial";
import {SHARED_ALG001_L09_P039_CONFIG, SHARED_ALG001_L09_P039_SOURCE} from "../timelines/shared-alg001-l09-p039";

export const SHARED_ALG001_L09_P039_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p039",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS09.swf",
    "bytes": 641617,
    "sha256": "7d972629424cab7fe6aafdb21d56f7049dc8dd906069d44006361036aac178ca"
  },
  "frameDomain": "sprite-342",
  "frameCount": 1111,
  "stops": [
    {
      "id": "step-1",
      "frame": 534,
      "resumeFrame": 535,
      "kind": "continue"
    },
    {
      "id": "step-2",
      "frame": 704,
      "resumeFrame": 705,
      "kind": "continue"
    },
    {
      "id": "help-1",
      "frame": 852,
      "resumeFrame": 853,
      "kind": "help-or-continue"
    },
    {
      "id": "help-2",
      "frame": 1008,
      "resumeFrame": 1009,
      "kind": "help-or-continue"
    },
    {
      "id": "quiz",
      "frame": 1094,
      "resumeFrame": 1095,
      "kind": "quiz"
    },
    {
      "id": "terminal",
      "frame": 1111,
      "resumeFrame": null,
      "kind": "terminal"
    }
  ],
  "finalQuestion": "Does the caterer use a proportional relationship?",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "non-proportional relationship",
      "correct": true
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "proportional relationship",
      "correct": false
    }
  ],
  "correctChoiceId": "choice-a",
  "maximumWrongAttempts": 2,
  "sourceFeedbackDomainCount": 8
} satisfies AlgL09GuidedTutorialBehavior);

export const SHARED_ALG001_L09_P039_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "acute-angle",
    "sourceKeyAttribute": "Acute angle",
    "sourceCharacterIds": [
      331
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Acute angle",
      "es": "Ángulo agudo"
    }
  },
  {
    "id": "column",
    "sourceKeyAttribute": "Column",
    "sourceCharacterIds": [
      321
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Column",
      "es": "Columna"
    }
  },
  {
    "id": "degree",
    "sourceKeyAttribute": "Degree",
    "sourceCharacterIds": [
      333
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Degree",
      "es": "Grado"
    }
  },
  {
    "id": "equation",
    "sourceKeyAttribute": "Equation",
    "sourceCharacterIds": [
      19
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Equation",
      "es": "Ecuación"
    }
  },
  {
    "id": "greater",
    "sourceKeyAttribute": "Greater",
    "sourceCharacterIds": [
      340
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
      338
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
      334
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Measure",
      "es": "Medir"
    }
  },
  {
    "id": "non-proportional-relationship",
    "sourceKeyAttribute": "Non-proportional relationship",
    "sourceCharacterIds": [
      325
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Non-proportional relationship",
      "es": "Relación no proporcional"
    }
  },
  {
    "id": "obtuse-angle",
    "sourceKeyAttribute": "Obtuse angle",
    "sourceCharacterIds": [
      336
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Obtuse angle",
      "es": "Ángulo obtuso"
    }
  },
  {
    "id": "pair",
    "sourceKeyAttribute": "Pair",
    "sourceCharacterIds": [
      322
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Pair",
      "es": "Par"
    }
  },
  {
    "id": "proportional-relationship",
    "sourceKeyAttribute": "Proportional relationship",
    "sourceCharacterIds": [
      324
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Proportional relationship",
      "es": "Relación proporcional"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      323
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
      335,
      339
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Right Angle",
      "es": "Ángulo recto"
    }
  },
  {
    "id": "simple-simpler-simplest",
    "sourceKeyAttribute": "Simple / Simpler / Simplest",
    "sourceCharacterIds": [
      147
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Simple / Simpler / Simplest",
      "es": "Simple / Más Simple / El Más Simple"
    }
  },
  {
    "id": "square-corner",
    "sourceKeyAttribute": "Square corner",
    "sourceCharacterIds": [
      332
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
      337
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Straight angle",
      "es": "Ángulo extendido"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterIds": [
      111
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "value",
    "sourceKeyAttribute": "Value",
    "sourceCharacterIds": [
      112
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Value",
      "es": "Valor"
    }
  }
] as const);

export const SHARED_ALG001_L09_P039_HELP_PROMPTS = Object.freeze([
  {
    "stopId": "help-1",
    "text": {
      "en": "Information given: The equation G = 2P+10; Information needed: Is the equation a proportional relationship?",
      "es": "Dato dado: G = 2P + 10. Información necesaria: si la ecuación representa una relación proporcional."
    }
  },
  {
    "stopId": "help-2",
    "text": {
      "en": "Make a table of values for the equation. Compare the ratios from the table. If all ratios are equal, it is a proportional relationship. The two ratios are not equal. Non-proportional relationship.",
      "es": "Haz una tabla de valores, compara las razones y observa que no todas son iguales; la relación no es proporcional."
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09GuidedTutorialCandidate(SHARED_ALG001_L09_P039_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-guided-tutorial-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p039-guided-tutorial",
  behavior: SHARED_ALG001_L09_P039_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P039_GLOSSARY_TERMS,
  helpPrompts: SHARED_ALG001_L09_P039_HELP_PROMPTS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P039_SOURCE};
export const SHARED_ALG001_L09_P039_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P039_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P039_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P039_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P039_RENDERER = candidate.Renderer;
export default animationModule;
