// Generated from P058 source actions, placements and scoped diagnostic. Do not hand-edit.
export const P058_BEHAVIOR_SOURCE = {
  "sourceSha256": "79bd9d4896d7b297a4df928711c92f1bd2b9f78b976f8399fc9e640d9704c4d3",
  "model": {
    "path": "migrations/shared-alg001-l06-p058/native-v1/source-model-v1.json",
    "bytes": 2190983,
    "sha256": "0241cb5d6f0427442f56d6ac9a5188e56f9c2a7394134ab2b897092003f22c04"
  },
  "diagnostic": {
    "path": "output/playwright/g678-p058-source-controls-20261003-v1/root-review-v1.json",
    "bytes": 3841,
    "sha256": "5a7a393d2e7d40572d90f3dbc8cb164749345e64bbaa4a68998a3805c9a2924c"
  },
  "runtime": {
    "swfVersion": 6,
    "rootFrames": 10,
    "rootEntryFrame": 6,
    "fps": 12,
    "mainSpriteId": 285,
    "mainFrames": 951,
    "stage": [
      800,
      600
    ]
  },
  "mainSpriteId": 285,
  "boxSpriteIds": [
    242,
    252
  ],
  "quizFrame": 934,
  "postQuizFrame": 935,
  "mainLastFrame": 951,
  "steps": [
    {
      "frame": 403,
      "controlSpriteId": 177,
      "depth": 59,
      "action": "continue",
      "continueAction": "DefineSprite_285/frame_403/PlaceObject2_176_57/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": true
    },
    {
      "frame": 571,
      "controlSpriteId": 177,
      "depth": 108,
      "action": "continue",
      "continueAction": "DefineSprite_285/frame_571/PlaceObject2_177_108/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": true
    },
    {
      "frame": 720,
      "controlSpriteId": 177,
      "depth": 64,
      "action": "open-box",
      "continueAction": "DefineSprite_285/frame_720/PlaceObject2_176_58/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": false,
      "box": {
        "spriteId": 242,
        "instance": "Mc_box1",
        "startFrame": 1,
        "holdFrame": 15,
        "resetFrame": 20,
        "closeButtonId": 241,
        "closeFrame": 15
      }
    },
    {
      "frame": 878,
      "controlSpriteId": 177,
      "depth": 64,
      "action": "open-box",
      "continueAction": "DefineSprite_285/frame_878/PlaceObject2_176_57/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": false,
      "box": {
        "spriteId": 252,
        "instance": "Mc_box2",
        "startFrame": 1,
        "holdFrame": 15,
        "resetFrame": 20,
        "closeButtonId": 251,
        "closeFrame": 15
      }
    }
  ],
  "options": [
    {
      "letter": "A",
      "value": "The strength is staying the same.",
      "instance": "AnsBtn4",
      "buttonId": 256,
      "right": false,
      "hitBoxPx": [
        546.7222,
        249.4945,
        736.3778,
        297.9055
      ]
    },
    {
      "letter": "B",
      "value": "The strength is getting higher.",
      "instance": "AnsBtn3",
      "buttonId": 256,
      "right": false,
      "hitBoxPx": [
        546.5212,
        306.286,
        712.8788,
        350.914
      ]
    },
    {
      "letter": "C",
      "value": "The strength is getting lower.  ",
      "instance": "AnsBtn1",
      "buttonId": 255,
      "right": true,
      "hitBoxPx": [
        546.7853,
        363.3969,
        716.3147,
        410.3031
      ]
    },
    {
      "letter": "D",
      "value": "The strength is at its lowest.",
      "instance": "AnsBtn2",
      "buttonId": 256,
      "right": false,
      "hitBoxPx": [
        547.338,
        416.1093,
        714.962,
        462.0907
      ]
    }
  ],
  "feedback": [
    {
      "spriteId": 97,
      "kind": "right",
      "index": 1,
      "instance": "Mc_Right_Feed1",
      "depth": 270,
      "startFrame": 2,
      "terminal": 33
    },
    {
      "spriteId": 76,
      "kind": "right",
      "index": 2,
      "instance": "Mc_Right_Feed2",
      "depth": 231,
      "startFrame": 2,
      "terminal": 32
    },
    {
      "spriteId": 62,
      "kind": "right",
      "index": 3,
      "instance": "Mc_Right_Feed3",
      "depth": 220,
      "startFrame": 2,
      "terminal": 31
    },
    {
      "spriteId": 36,
      "kind": "right",
      "index": 4,
      "instance": "Mc_Right_Feed4",
      "depth": 214,
      "startFrame": 2,
      "terminal": 28
    },
    {
      "spriteId": 129,
      "kind": "wrong",
      "index": 1,
      "instance": "Mc_Wrong_Feed1",
      "depth": 294,
      "startFrame": 2,
      "terminal": 31
    },
    {
      "spriteId": 115,
      "kind": "wrong",
      "index": 2,
      "instance": "Mc_Wrong_Feed2",
      "depth": 288,
      "startFrame": 2,
      "terminal": 28
    },
    {
      "spriteId": 140,
      "kind": "wrong",
      "index": 3,
      "instance": "Mc_Wrong_Feed3",
      "depth": 305,
      "startFrame": 2,
      "terminal": 29
    }
  ],
  "glossary": [
    {
      "buttonId": 170,
      "ownerSpriteId": 268,
      "key": "Graph",
      "firstFrame": 1,
      "lastFrame": 1,
      "rootReachable": true
    },
    {
      "buttonId": 170,
      "ownerSpriteId": 285,
      "key": "Graph",
      "firstFrame": 18,
      "lastFrame": 951,
      "rootReachable": true
    },
    {
      "buttonId": 171,
      "ownerSpriteId": 268,
      "key": "Function",
      "firstFrame": 1,
      "lastFrame": 1,
      "rootReachable": true
    },
    {
      "buttonId": 171,
      "ownerSpriteId": 285,
      "key": "Function",
      "firstFrame": 18,
      "lastFrame": 951,
      "rootReachable": true
    },
    {
      "buttonId": 172,
      "ownerSpriteId": 285,
      "key": "Time",
      "firstFrame": 18,
      "lastFrame": 951,
      "rootReachable": true
    }
  ],
  "help": {
    "spriteId": 268,
    "instance": "Mc_Popup",
    "depth": 337,
    "openButtonId": 13,
    "closeButtonId": 258
  },
  "counterIncrement": "wrong-feedback-terminal",
  "feedbackHasAuthoredHold": false,
  "rightTerminalSourceOrder": [
    "stop",
    "disableQuiz",
    "clearQuizSection",
    "parentPlay",
    "resetFeedback1"
  ],
  "sharedReducerEquivalence": "Parent play schedules the next timeline tick; feedback reset occurs in the same source terminal action. Shared reducer atomically retires selected feedback and resumes main; no intermediate observable page input or original timing-parity claim.",
  "modernContracts": {
    "nativeContinueForEmptySprite176": true,
    "terminalHold": true,
    "deterministicFeedbackSelection": true,
    "exactOriginalHostPairing": false
  }
} as const;
