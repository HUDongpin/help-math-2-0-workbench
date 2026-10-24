// Generated from the pinned P033 source plan and exact page actions. Do not hand-edit.
import type {TwoAttemptBinding} from '../source-two-attempt-feedback-quiz-v1';
export const P033_BEHAVIOR_SOURCE={
  "sourceSha256": "fb11fd842f3f0948cf5b00bf3b7b63bde86f0af9bf41bb2f9e3a762a1daad071",
  "sourcePlanSha256": "8d3feaabd38f66bb4428fc6e249c3ebacfaece89552fed49a6429a30c0d96490",
  "binding": {
    "mainSpriteId": 190,
    "quizFrame": 52,
    "postQuizFrame": 53,
    "mainLastFrame": 385,
    "correctAnswer": 1,
    "answerCharacters": {
      "1": 20,
      "2": 19,
      "3": 19,
      "4": 19
    },
    "wrongFirst": "A set of ordered pairs is a function unless two or more pairs have the same x-coordinate. Try again.",
    "wrongLater": "A set of ordered pairs is a function unless two or more pairs have the same x-coordinate.",
    "branches": [
      {
        "spriteId": 78,
        "kind": "right",
        "index": 1,
        "terminal": 25
      },
      {
        "spriteId": 119,
        "kind": "right",
        "index": 2,
        "terminal": 27
      },
      {
        "spriteId": 46,
        "kind": "right",
        "index": 3,
        "terminal": 31
      },
      {
        "spriteId": 111,
        "kind": "right",
        "index": 4,
        "terminal": 27
      },
      {
        "spriteId": 147,
        "kind": "wrong",
        "index": 1,
        "terminal": 31,
        "hold": 22,
        "closePlacementFirst": 16,
        "closeButton": 139,
        "closeJump": 23
      },
      {
        "spriteId": 161,
        "kind": "wrong",
        "index": 2,
        "terminal": 29,
        "hold": 23,
        "closePlacementFirst": 16,
        "closeButton": 156,
        "closeJump": 24
      },
      {
        "spriteId": 175,
        "kind": "wrong",
        "index": 3,
        "terminal": 28,
        "hold": 20,
        "closePlacementFirst": 13,
        "closeButton": 170,
        "closeJump": 21
      }
    ]
  }
} as const satisfies {sourceSha256:string;sourcePlanSha256:string;binding:TwoAttemptBinding};
