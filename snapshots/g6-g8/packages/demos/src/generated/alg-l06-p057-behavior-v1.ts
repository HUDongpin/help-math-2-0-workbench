// Generated from P057 source actions, placements and scoped diagnostic. Do not hand-edit.
export const P057_BEHAVIOR_SOURCE = {
  "sourceSha256": "03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31",
  "model": {
    "path": "migrations/shared-alg001-l06-p057/native-v1/source-model-v1.json",
    "bytes": 2084038,
    "sha256": "82d884431bcdf4d231546fa743e6f7696028422aa0ea5c3f183119e34528fdbf"
  },
  "diagnostic": {
    "path": "output/playwright/g678-p057-source-controls-20261003-v1/root-review-v1.json",
    "bytes": 3879,
    "sha256": "1ba1bac7f8a04f22efaf44195dbe1ab1b0fcd6d06d9125ca16e2b0da22c1c3dc"
  },
  "runtime": {
    "swfVersion": 6,
    "rootFrames": 10,
    "rootEntryFrame": 6,
    "fps": 12,
    "mainSpriteId": 312,
    "mainFrames": 856,
    "stage": [
      800,
      600
    ]
  },
  "mainSpriteId": 312,
  "boxSpriteIds": [
    259,
    267
  ],
  "quizFrame": 839,
  "postQuizFrame": 840,
  "mainLastFrame": 856,
  "steps": [
    {
      "frame": 313,
      "controlSpriteId": 190,
      "depth": 59,
      "action": "continue",
      "continueAction": "DefineSprite_312/frame_313/PlaceObject2_189_57/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": true
    },
    {
      "frame": 481,
      "controlSpriteId": 190,
      "depth": 117,
      "action": "continue",
      "continueAction": "DefineSprite_312/frame_481/PlaceObject2_190_117/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": true
    },
    {
      "frame": 629,
      "controlSpriteId": 190,
      "depth": 73,
      "action": "open-box",
      "continueAction": "DefineSprite_312/frame_629/PlaceObject2_189_58/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": false,
      "box": {
        "spriteId": 259,
        "instance": "Mc_box1",
        "startFrame": 1,
        "holdFrame": 15,
        "resetFrame": 20,
        "closeButtonId": 258,
        "closeFrame": 15
      }
    },
    {
      "frame": 788,
      "controlSpriteId": 190,
      "depth": 73,
      "action": "open-box",
      "continueAction": "DefineSprite_312/frame_788/PlaceObject2_189_57/CLIPACTIONRECORD on(release).as",
      "continueHasSourceHitArea": false,
      "box": {
        "spriteId": 267,
        "instance": "Mc_box2",
        "startFrame": 1,
        "holdFrame": 15,
        "resetFrame": 20,
        "closeButtonId": 266,
        "closeFrame": 15
      }
    }
  ],
  "options": [
    {
      "letter": "A",
      "value": "y = 2x + 5",
      "instance": "AnsBtn4",
      "buttonId": 271,
      "right": false,
      "hitBoxPx": [
        546.856,
        280.9,
        708.344,
        318.9
      ]
    },
    {
      "letter": "B",
      "value": "y = 3x + 8",
      "instance": "AnsBtn2",
      "buttonId": 271,
      "right": false,
      "hitBoxPx": [
        547.515,
        324.15,
        705.985,
        362.15
      ]
    },
    {
      "letter": "C",
      "value": "y = 4x + 5",
      "instance": "AnsBtn3",
      "buttonId": 271,
      "right": false,
      "hitBoxPx": [
        546.534,
        369.9,
        707.866,
        407.9
      ]
    },
    {
      "letter": "D",
      "value": "y = 5x \u2013 4",
      "instance": "AnsBtn1",
      "buttonId": 270,
      "right": true,
      "hitBoxPx": [
        549.0089,
        416.05,
        707.7911,
        454.05
      ]
    }
  ],
  "feedback": [
    {
      "spriteId": 77,
      "kind": "right",
      "index": 1,
      "instance": "Mc_Right_Feed1",
      "depth": 200,
      "startFrame": 2,
      "terminal": 27
    },
    {
      "spriteId": 93,
      "kind": "right",
      "index": 2,
      "instance": "Mc_Right_Feed2",
      "depth": 209,
      "startFrame": 2,
      "terminal": 28
    },
    {
      "spriteId": 52,
      "kind": "right",
      "index": 3,
      "instance": "Mc_Right_Feed3",
      "depth": 196,
      "startFrame": 2,
      "terminal": 28
    },
    {
      "spriteId": 105,
      "kind": "right",
      "index": 4,
      "instance": "Mc_Right_Feed4",
      "depth": 219,
      "startFrame": 2,
      "terminal": 25
    },
    {
      "spriteId": 157,
      "kind": "wrong",
      "index": 1,
      "instance": "Mc_Wrong_Feed1",
      "depth": 245,
      "startFrame": 2,
      "terminal": 28
    },
    {
      "spriteId": 117,
      "kind": "wrong",
      "index": 2,
      "instance": "Mc_Wrong_Feed2",
      "depth": 229,
      "startFrame": 2,
      "terminal": 29
    },
    {
      "spriteId": 129,
      "kind": "wrong",
      "index": 3,
      "instance": "Mc_Wrong_Feed3",
      "depth": 235,
      "startFrame": 2,
      "terminal": 28
    }
  ],
  "glossary": [
    {
      "buttonId": 183,
      "ownerSpriteId": 312,
      "key": "Equation",
      "firstFrame": 314,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 183,
      "ownerSpriteId": 312,
      "key": "Equation",
      "firstFrame": 18,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 184,
      "ownerSpriteId": 312,
      "key": "Function",
      "firstFrame": 314,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 184,
      "ownerSpriteId": 312,
      "key": "Function",
      "firstFrame": 18,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 185,
      "ownerSpriteId": 312,
      "key": "Function table",
      "firstFrame": 18,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 193,
      "ownerSpriteId": 312,
      "key": "Input",
      "firstFrame": 314,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 194,
      "ownerSpriteId": 312,
      "key": "Output",
      "firstFrame": 314,
      "lastFrame": 856,
      "rootReachable": true
    },
    {
      "buttonId": 279,
      "ownerSpriteId": 295,
      "key": "Function",
      "firstFrame": 1,
      "lastFrame": 1,
      "rootReachable": true
    },
    {
      "buttonId": 280,
      "ownerSpriteId": 295,
      "key": "Relation",
      "firstFrame": 1,
      "lastFrame": 1,
      "rootReachable": true
    },
    {
      "buttonId": 281,
      "ownerSpriteId": 295,
      "key": "Value",
      "firstFrame": 1,
      "lastFrame": 1,
      "rootReachable": true
    }
  ],
  "help": {
    "spriteId": 295,
    "instance": "Mc_Popup",
    "depth": 274,
    "openButtonId": 14,
    "closeButtonId": 273
  },
  "counterIncrement": "wrong-feedback-terminal",
  "feedbackHasAuthoredHold": false,
  "modernContracts": {
    "nativeContinueForEmptySprite189": true,
    "terminalHold": true,
    "deterministicFeedbackSelection": true,
    "exactOriginalHostPairing": false
  }
} as const;
