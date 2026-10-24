"use client";

import {createPrivateSourceStaticAlgL09GuidedTutorialCandidate} from "../private-source-static-alg-l09-guided-tutorial-candidate";
import type {AlgL09GuidedTutorialBehavior} from "../g678-alg-l09-guided-tutorial";
import {SHARED_ALG001_L09_P037_CONFIG, SHARED_ALG001_L09_P037_SOURCE} from "../timelines/shared-alg001-l09-p037";

export const SHARED_ALG001_L09_P037_BEHAVIOR = Object.freeze({
  "animationId": "shared-alg001-l09-p037",
  "source": {
    "path": "G6-G8-shared/ALG001/L9/TS/L9TS07.swf",
    "bytes": 562427,
    "sha256": "29bfe39a4c2ffd7b163b5c03925efad55ae86b4533a19c278e1abf8dbb91cd35"
  },
  "frameDomain": "sprite-307",
  "frameCount": 942,
  "stops": [
    {
      "id": "step-1",
      "frame": 396,
      "resumeFrame": 397,
      "kind": "continue"
    },
    {
      "id": "step-2",
      "frame": 564,
      "resumeFrame": 565,
      "kind": "continue"
    },
    {
      "id": "help-1",
      "frame": 712,
      "resumeFrame": 713,
      "kind": "help-or-continue"
    },
    {
      "id": "help-2",
      "frame": 869,
      "resumeFrame": 870,
      "kind": "help-or-continue"
    },
    {
      "id": "quiz",
      "frame": 925,
      "resumeFrame": 926,
      "kind": "quiz"
    },
    {
      "id": "terminal",
      "frame": 942,
      "resumeFrame": null,
      "kind": "terminal"
    }
  ],
  "finalQuestion": "What is the ratio of socks to shoes?",
  "options": [
    {
      "id": "choice-a",
      "label": "A",
      "value": "1 to 4",
      "correct": false
    },
    {
      "id": "choice-b",
      "label": "B",
      "value": "2 to 9",
      "correct": false
    },
    {
      "id": "choice-c",
      "label": "C",
      "value": "9 to 2",
      "correct": true
    },
    {
      "id": "choice-d",
      "label": "D",
      "value": "18 to 4",
      "correct": false
    }
  ],
  "correctChoiceId": "choice-c",
  "maximumWrongAttempts": 2,
  "sourceFeedbackDomainCount": 8
} satisfies AlgL09GuidedTutorialBehavior);

export const SHARED_ALG001_L09_P037_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "acute-angle",
    "sourceKeyAttribute": "Acute angle",
    "sourceCharacterIds": [
      296
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Acute angle",
      "es": "Ángulo agudo"
    }
  },
  {
    "id": "comparison",
    "sourceKeyAttribute": "Comparison",
    "sourceCharacterIds": [
      286
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Comparison",
      "es": "Comparación"
    }
  },
  {
    "id": "degree",
    "sourceKeyAttribute": "Degree",
    "sourceCharacterIds": [
      298
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Degree",
      "es": "Grado"
    }
  },
  {
    "id": "e-mail",
    "sourceKeyAttribute": "E-mail",
    "sourceCharacterIds": [
      290
    ],
    "firstFrame": 1,
    "labels": {
      "en": "E-mail",
      "es": "Correo electrónico"
    }
  },
  {
    "id": "greater",
    "sourceKeyAttribute": "Greater",
    "sourceCharacterIds": [
      305
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
      303
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
      299
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
      301
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Obtuse angle",
      "es": "Ángulo obtuso"
    }
  },
  {
    "id": "quantity",
    "sourceKeyAttribute": "Quantity",
    "sourceCharacterIds": [
      287
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Quantity",
      "es": "Cantidad"
    }
  },
  {
    "id": "ratio",
    "sourceKeyAttribute": "Ratio",
    "sourceCharacterIds": [
      20
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
      300,
      304
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Right Angle",
      "es": "Ángulo recto"
    }
  },
  {
    "id": "simplest-form",
    "sourceKeyAttribute": "Simplest form",
    "sourceCharacterIds": [
      19
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Simplest Form",
      "es": "Forma más simple"
    }
  },
  {
    "id": "spam",
    "sourceKeyAttribute": "Spam",
    "sourceCharacterIds": [
      288
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Spam",
      "es": "Correo basura"
    }
  },
  {
    "id": "square-corner",
    "sourceKeyAttribute": "Square corner",
    "sourceCharacterIds": [
      297
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
      302
    ],
    "firstFrame": 1,
    "labels": {
      "en": "Straight angle",
      "es": "Ángulo extendido"
    }
  }
] as const);

export const SHARED_ALG001_L09_P037_HELP_PROMPTS = Object.freeze([
  {
    "stopId": "help-1",
    "text": {
      "en": "Information given: number of pairs of socks and number of pairs of shoes; Information needed: How many socks : shoes?",
      "es": "Datos dados: número de pares de calcetines y número de pares de zapatos. Información necesaria: ¿cuántos calcetines por zapatos?"
    }
  },
  {
    "stopId": "help-2",
    "text": {
      "en": "In the ratio “socks : shoes”, socks come first. Replace each word with the correct number. 18:4 Then divide both numbers by a number greater than 1 if possible. 9:2 or 9 to 2",
      "es": "En la razón calcetines : zapatos, los calcetines van primero. Sustituye las palabras por 18:4 y simplifica a 9:2."
    }
  }
] as const);

const candidate = createPrivateSourceStaticAlgL09GuidedTutorialCandidate(SHARED_ALG001_L09_P037_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-guided-tutorial-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p037-guided-tutorial",
  behavior: SHARED_ALG001_L09_P037_BEHAVIOR,
  glossaryTerms: SHARED_ALG001_L09_P037_GLOSSARY_TERMS,
  helpPrompts: SHARED_ALG001_L09_P037_HELP_PROMPTS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P037_SOURCE};
export const SHARED_ALG001_L09_P037_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P037_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P037_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P037_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P037_RENDERER = candidate.Renderer;
export default animationModule;
