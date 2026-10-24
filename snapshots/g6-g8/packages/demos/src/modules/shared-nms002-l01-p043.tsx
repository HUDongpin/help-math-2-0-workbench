"use client";

import {createPrivateSourceStaticAssessmentCandidate} from "../private-source-static-assessment-candidate";
import {SHARED_NMS002_L01_P043_CONFIG, SHARED_NMS002_L01_P043_SOURCE} from "../timelines/shared-nms002-l01-p043";

export const SHARED_NMS002_L01_P043_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "show",
    "sourceKeyAttribute": "Show",
    "sourceCharacterId": 20,
    "firstFrame": 1,
    "labels": {
      "en": "Show",
      "es": "Mostrar"
    }
  },
  {
    "id": "table",
    "sourceKeyAttribute": "Table",
    "sourceCharacterId": 21,
    "firstFrame": 1,
    "labels": {
      "en": "Table",
      "es": "Cuadro"
    }
  },
  {
    "id": "difference",
    "sourceKeyAttribute": "Difference",
    "sourceCharacterId": 22,
    "firstFrame": 1,
    "labels": {
      "en": "Difference",
      "es": "Diferencia"
    }
  }
] as const);

export const SHARED_NMS002_L01_P043_ASSESSMENT = Object.freeze({
  "animationId": "shared-nms002-l01-p043",
  "quizStopFrame": 757,
  "resumeFrame": 758,
  "terminalFrame": 779,
  "answers": [
    {
      "ordinal": 1,
      "instanceName": "AnsBtn1",
      "sourceVisualOrder": 1,
      "sourceCharacterId": 171,
      "sourceTextObjectId": 61,
      "label": {
        "en": "36°",
        "es": "36°"
      },
      "result": "wrong",
      "sourceMatrix": {
        "a": 0.4944000244140625,
        "b": 0,
        "c": 0,
        "d": 0.93182373046875,
        "tx": 152.05,
        "ty": -29.5
      }
    },
    {
      "ordinal": 2,
      "instanceName": "AnsBtn2",
      "sourceVisualOrder": 4,
      "sourceCharacterId": 170,
      "sourceTextObjectId": 65,
      "label": {
        "en": "146°",
        "es": "146°"
      },
      "result": "wrong",
      "sourceMatrix": {
        "a": 0.5843658447265625,
        "b": 0,
        "c": 0,
        "d": 1,
        "tx": 154.2,
        "ty": 90
      }
    },
    {
      "ordinal": 3,
      "instanceName": "AnsBtn3",
      "sourceVisualOrder": 3,
      "sourceCharacterId": 172,
      "sourceTextObjectId": 163,
      "label": {
        "en": "38°",
        "es": "38°"
      },
      "result": "right",
      "sourceMatrix": {
        "a": 0.50604248046875,
        "b": 0,
        "c": 0.00177001953125,
        "d": 0.8723907470703125,
        "tx": 153.6,
        "ty": 48.7
      }
    },
    {
      "ordinal": 4,
      "instanceName": "AnsBtn4",
      "sourceVisualOrder": 2,
      "sourceCharacterId": 171,
      "sourceTextObjectId": 68,
      "label": {
        "en": "37°",
        "es": "37°"
      },
      "result": "wrong",
      "sourceMatrix": {
        "a": 0.51470947265625,
        "b": 0,
        "c": 0,
        "d": 1,
        "tx": 152.95,
        "ty": 11.75
      }
    }
  ],
  "feedbackDomains": [
    {
      "instanceName": "Mc_Wrong_Feed1",
      "sourceObjectId": 186,
      "frameDomain": "sprite-186",
      "frameCount": 31,
      "terminalFrame": 31,
      "activeAtQuizStop": true,
      "kind": "wrong"
    },
    {
      "instanceName": "Mc_Wrong_Feed2",
      "sourceObjectId": 197,
      "frameDomain": "sprite-197",
      "frameCount": 29,
      "terminalFrame": 29,
      "activeAtQuizStop": true,
      "kind": "wrong"
    },
    {
      "instanceName": "Mc_Wrong_Feed3",
      "sourceObjectId": 208,
      "frameDomain": "sprite-208",
      "frameCount": 28,
      "terminalFrame": 28,
      "activeAtQuizStop": true,
      "kind": "wrong"
    },
    {
      "instanceName": "Mc_Right_Feed1",
      "sourceObjectId": 266,
      "frameDomain": "sprite-266",
      "frameCount": 25,
      "terminalFrame": 25,
      "activeAtQuizStop": true,
      "kind": "right"
    },
    {
      "instanceName": "Mc_Right_Feed2",
      "sourceObjectId": 307,
      "frameDomain": "sprite-307",
      "frameCount": 27,
      "terminalFrame": 27,
      "activeAtQuizStop": true,
      "kind": "right"
    },
    {
      "instanceName": "Mc_Right_Feed3",
      "sourceObjectId": 234,
      "frameDomain": "sprite-234",
      "frameCount": 31,
      "terminalFrame": 31,
      "activeAtQuizStop": true,
      "kind": "right"
    },
    {
      "instanceName": "Mc_Right_Feed4",
      "sourceObjectId": 299,
      "frameDomain": "sprite-299",
      "frameCount": 27,
      "terminalFrame": 27,
      "activeAtQuizStop": true,
      "kind": "right"
    }
  ]
} as const);

export const SHARED_NMS002_L01_P043_FEEDBACK_LABELS = Object.freeze([
  {
    "instanceName": "Mc_Wrong_Feed1",
    "labels": {
      "en": "OH! NO",
      "es": "OH! NO"
    }
  },
  {
    "instanceName": "Mc_Wrong_Feed2",
    "labels": {
      "en": "Try Again!",
      "es": "Try Again!"
    }
  },
  {
    "instanceName": "Mc_Wrong_Feed3",
    "labels": {
      "en": "incorrect!",
      "es": "incorrect!"
    }
  },
  {
    "instanceName": "Mc_Right_Feed1",
    "labels": {
      "en": "Excellent!",
      "es": "Excellent!"
    }
  },
  {
    "instanceName": "Mc_Right_Feed2",
    "labels": {
      "en": "Excellent!",
      "es": "Excellent!"
    }
  },
  {
    "instanceName": "Mc_Right_Feed3",
    "labels": {
      "en": "YOU GOT IT!",
      "es": "YOU GOT IT!"
    }
  },
  {
    "instanceName": "Mc_Right_Feed4",
    "labels": {
      "en": "Awesome!",
      "es": "Awesome!"
    }
  }
] as const);

export const SHARED_NMS002_L01_P043_HINT = Object.freeze({
  "title": {
    "en": "Need More Help",
    "es": "Need More Help"
  },
  "lines": {
    "en": [
      "Difference means to subtract.",
      "Example: 10,000 – 3,500 means the difference between 10,000 and 3,500."
    ],
    "es": [
      "Difference means to subtract.",
      "Example: 10,000 – 3,500 means the difference between 10,000 and 3,500."
    ]
  }
} as const);

const candidate = createPrivateSourceStaticAssessmentCandidate(SHARED_NMS002_L01_P043_CONFIG, Object.freeze({
  calibrationId: "g678-ts07-nms-l1-product-calibration-v1",
  companionSurfaceId: "shared-nms002-l01-p043-assessment",
  assessment: SHARED_NMS002_L01_P043_ASSESSMENT,
  glossaryTerms: SHARED_NMS002_L01_P043_GLOSSARY_TERMS,
  feedbackLabels: SHARED_NMS002_L01_P043_FEEDBACK_LABELS,
  hint: SHARED_NMS002_L01_P043_HINT,
  sourceTextLanguage: "en",
  spanishTextParityAccepted: false,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_NMS002_L01_P043_SOURCE};
export const SHARED_NMS002_L01_P043_MOVIE = candidate.movie;
export const SHARED_NMS002_L01_P043_RUNTIME = candidate.runtime;
export const SHARED_NMS002_L01_P043_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_NMS002_L01_P043_SCENARIOS = candidate.scenarios;
export const SHARED_NMS002_L01_P043_RENDERER = candidate.Renderer;
export default animationModule;
