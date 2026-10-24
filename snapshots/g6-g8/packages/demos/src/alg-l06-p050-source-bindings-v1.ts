// Generated from pinned P050 source by derive-source-model-v1.py. Do not hand-edit.
export const P050_SOURCE = {
  "sourceSha256": "4353f9cbd7e60043baa8f59c7f5193fcd930778ace4b918ab56f2953f306937e",
  "modelSha256": "928ca5042b469795ae207921638d44ffd212034e8eb33e954d943b1721c05fb7",
  "runtime": {
    "stage": [
      800,
      600
    ],
    "fps": 12,
    "rootFrames": 10,
    "rootEntryFrame": 6,
    "mainSpriteId": 489,
    "mainFrames": 674,
    "background": "#b8d8f7"
  },
  "behavior": {
    "selection": "random-without-replacement",
    "questionCount": 10,
    "correctPoints": 10,
    "wrongPoints": 0,
    "firstQuestionFrame": 663,
    "beginFrame": 662,
    "finalFrame": 673,
    "wrong": {
      "spriteId": 380,
      "startFrame": 2,
      "popupSpriteId": 379,
      "popupFirstFrame": 17,
      "holdFrame": 23,
      "closeButtonId": 376,
      "closeJump": 24,
      "endFrame": 28,
      "advanceAfterClose": true,
      "branchCount": 3,
      "allBranchesSameSprite": true
    },
    "score": {
      "spriteId": 265,
      "startFrame": 2,
      "normalEndFrame": 10,
      "hundredStartFrame": 11,
      "hundredEndFrame": 20,
      "textId": 262
    },
    "directions": {
      "spriteId": 24,
      "openButtonIds": [
        257,
        259
      ],
      "closeButtonId": 18,
      "sourceTextIds": [
        19,
        20,
        21,
        22,
        23
      ],
      "repeatsAudio": false
    },
    "introStart": {
      "buttonId": 34,
      "jumpsTo": 662,
      "startsGame": true
    },
    "introSkip": {
      "buttonId": 38,
      "jumpsTo": 662,
      "startsGame": false
    },
    "beginStart": {
      "buttonId": 253,
      "requestsNextQuestionOnEnterFrame": true
    },
    "finalStart": {
      "buttonId": 253,
      "reinitializesGame": false,
      "sourceEffect": "next draw increments count beyond ten and returns to Final"
    },
    "unresolved": [
      "Mc_Final has no placed instance in this SWF",
      "_parent.enableButton has no page definition",
      "Q6 wrong button calls _parent.showWrongFeed before page-local showWrongFeed",
      "Original host enableQuizButton/disableQuizButton and gSound binding",
      "Original AVM1 RNG state, audible sync and unselected sprite345 runtime appearance"
    ]
  },
  "questions": [
    {
      "number": 1,
      "label": "Q1",
      "frame": 663,
      "correctChoice": "D",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 276,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            393.1467,
            152.8238,
            559.5938,
            286.6065
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 240,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              167.2507,
              424.9624,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 276,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            393.4066,
            288.8238,
            558.5927,
            422.6065
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 256,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              305.2507,
              424.2632,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 276,
          "depth": 275,
          "correct": false,
          "hitBoxPx": [
            567.5447,
            152.8238,
            736.5673,
            286.6065
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 248,
            "overlap": 1.0,
            "boxPx": [
              576.5055,
              167.3818,
              595.9959,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 277,
          "depth": 281,
          "correct": true,
          "hitBoxPx": [
            565.2376,
            290.1811,
            736.6781,
            423.1477
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 264,
            "overlap": 1.0,
            "boxPx": [
              577.0736,
              305.3818,
              598.4431,
              322.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 358,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 2,
      "label": "Q2",
      "frame": 664,
      "correctChoice": "A",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 277,
          "depth": 281,
          "correct": true,
          "hitBoxPx": [
            393.2885,
            153.1811,
            559.6662,
            286.1477
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 240,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              167.2507,
              424.9624,
              184.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 389,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            393.4066,
            288.8238,
            558.5927,
            422.6065
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 268,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              305.2507,
              424.2632,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 389,
          "depth": 275,
          "correct": false,
          "hitBoxPx": [
            568.6643,
            152.8238,
            746.6982,
            286.6065
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 260,
            "overlap": 1.0,
            "boxPx": [
              576.5055,
              167.3818,
              595.9959,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 389,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            567.3006,
            291.8238,
            737.6409,
            425.6065
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 248,
            "overlap": 1.0,
            "boxPx": [
              577.0736,
              305.3818,
              598.4431,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 358,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 3,
      "label": "Q3",
      "frame": 665,
      "correctChoice": "B",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 402,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            394.7174,
            152.8238,
            558.6409,
            286.6065
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 240,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              167.2507,
              424.9624,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 277,
          "depth": 281,
          "correct": true,
          "hitBoxPx": [
            392.1065,
            291.1811,
            559.6159,
            424.1477
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 267,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              305.2507,
              424.2632,
              322.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 402,
          "depth": 275,
          "correct": false,
          "hitBoxPx": [
            566.0084,
            152.8238,
            737.6633,
            286.6065
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 259,
            "overlap": 1.0,
            "boxPx": [
              576.5055,
              167.3818,
              595.9959,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 402,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            566.084,
            291.8238,
            732.6351,
            425.6065
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 248,
            "overlap": 1.0,
            "boxPx": [
              577.0736,
              305.3818,
              598.4431,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 358,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 4,
      "label": "Q4",
      "frame": 666,
      "correctChoice": "D",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 411,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            393.4243,
            151.8238,
            558.664,
            285.6065
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 240,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              167.2507,
              424.9624,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 411,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            394.034,
            291.8238,
            560.5851,
            425.6065
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 266,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              305.2507,
              424.2632,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 411,
          "depth": 275,
          "correct": false,
          "hitBoxPx": [
            565.6103,
            152.8238,
            734.2751,
            286.6065
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 258,
            "overlap": 1.0,
            "boxPx": [
              576.5055,
              167.3818,
              595.9959,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 412,
          "depth": 281,
          "correct": true,
          "hitBoxPx": [
            566.8982,
            291.1811,
            730.6877,
            424.1477
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 248,
            "overlap": 1.0,
            "boxPx": [
              577.0736,
              305.3818,
              598.4431,
              322.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 358,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 5,
      "label": "Q5",
      "frame": 667,
      "correctChoice": "C",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 420,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            394.4066,
            151.8238,
            559.5927,
            285.6065
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 240,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              167.2507,
              424.9624,
              184.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 420,
          "depth": 275,
          "correct": false,
          "hitBoxPx": [
            391.9546,
            290.8738,
            563.6158,
            424.6565
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 266,
            "overlap": 1.0,
            "boxPx": [
              403.9425,
              305.2507,
              424.2632,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 412,
          "depth": 281,
          "correct": true,
          "hitBoxPx": [
            568.7082,
            152.1311,
            733.7256,
            285.0977
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 258,
            "overlap": 1.0,
            "boxPx": [
              576.5055,
              167.3818,
              595.9959,
              184.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 420,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            568.3458,
            291.8238,
            733.6328,
            425.6065
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 248,
            "overlap": 1.0,
            "boxPx": [
              577.0736,
              305.3818,
              598.4431,
              322.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 432,
      "correctFeedbackEndFrame": 25
    },
    {
      "number": 6,
      "label": "Q6",
      "frame": 668,
      "correctChoice": "A",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 443,
          "depth": 275,
          "correct": true,
          "hitBoxPx": [
            383.9985,
            346.4953,
            540.5515,
            374.4546
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 136,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              352.2507,
              414.9624,
              369.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 444,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            382.9985,
            388.5477,
            539.5515,
            418.5057
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 160,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              397.2507,
              414.2632,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": true
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 444,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            567.9985,
            345.5389,
            724.5515,
            373.4108
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 152,
            "overlap": 1.0,
            "boxPx": [
              579.5055,
              352.3818,
              598.9959,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": true
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 444,
          "depth": 281,
          "correct": false,
          "hitBoxPx": [
            568.9985,
            390.5414,
            725.5515,
            418.5084
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 144,
            "overlap": 1.0,
            "boxPx": [
              580.0736,
              397.3818,
              601.4431,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was A.",
          "unboundParentWrongCall": true
        }
      ],
      "correctFeedbackSpriteId": 432,
      "correctFeedbackEndFrame": 25
    },
    {
      "number": 7,
      "label": "Q7",
      "frame": 669,
      "correctChoice": "B",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 459,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            382.7485,
            346.1389,
            539.3015,
            374.0108
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 136,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              352.2507,
              414.9624,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 458,
          "depth": 275,
          "correct": true,
          "hitBoxPx": [
            385.7485,
            390.2367,
            542.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 160,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              397.2507,
              414.2632,
              414.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 459,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            569.7485,
            346.1389,
            726.3015,
            374.0108
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 152,
            "overlap": 1.0,
            "boxPx": [
              579.5055,
              352.3818,
              598.9959,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 459,
          "depth": 281,
          "correct": false,
          "hitBoxPx": [
            570.7485,
            390.1389,
            727.3015,
            418.0108
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 144,
            "overlap": 1.0,
            "boxPx": [
              580.0736,
              397.3818,
              601.4431,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 432,
      "correctFeedbackEndFrame": 25
    },
    {
      "number": 8,
      "label": "Q8",
      "frame": 670,
      "correctChoice": "C",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 463,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            384.7485,
            345.2367,
            541.3015,
            373.0128
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 136,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              352.2507,
              414.9624,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 463,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            384.7485,
            390.2367,
            541.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 160,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              397.2507,
              414.2632,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 458,
          "depth": 275,
          "correct": true,
          "hitBoxPx": [
            569.7485,
            346.2367,
            726.3015,
            374.0128
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 152,
            "overlap": 1.0,
            "boxPx": [
              579.5055,
              352.3818,
              598.9959,
              369.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 463,
          "depth": 281,
          "correct": false,
          "hitBoxPx": [
            570.7485,
            390.2367,
            727.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 144,
            "overlap": 1.0,
            "boxPx": [
              580.0736,
              397.3818,
              601.4431,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was C.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 479,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 9,
      "label": "Q9",
      "frame": 671,
      "correctChoice": "D",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 482,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            384.7485,
            346.2367,
            541.3015,
            374.0128
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 136,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              352.2507,
              414.9624,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 482,
          "depth": 281,
          "correct": false,
          "hitBoxPx": [
            384.7485,
            389.2367,
            541.3015,
            417.0128
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 160,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              397.2507,
              414.2632,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 482,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            570.7485,
            346.2367,
            727.3015,
            374.0128
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 152,
            "overlap": 1.0,
            "boxPx": [
              579.5055,
              352.3818,
              598.9959,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was D.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 458,
          "depth": 275,
          "correct": true,
          "hitBoxPx": [
            569.7485,
            390.2367,
            726.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 144,
            "overlap": 1.0,
            "boxPx": [
              580.0736,
              397.3818,
              601.4431,
              414.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 479,
      "correctFeedbackEndFrame": 28
    },
    {
      "number": 10,
      "label": "Q10",
      "frame": 672,
      "correctChoice": "B",
      "options": [
        {
          "letter": "A",
          "instance": "AnsBtn1",
          "buttonId": 459,
          "depth": 281,
          "correct": false,
          "hitBoxPx": [
            385.7485,
            345.2367,
            542.3015,
            373.0128
          ],
          "sourceLetter": {
            "textId": 162,
            "letter": "A",
            "depth": 136,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              352.2507,
              414.9624,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "B",
          "instance": "AnsBtn2",
          "buttonId": 458,
          "depth": 275,
          "correct": true,
          "hitBoxPx": [
            383.7485,
            390.2367,
            540.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 166,
            "letter": "B",
            "depth": 160,
            "overlap": 1.0,
            "boxPx": [
              393.9425,
              397.2507,
              414.2632,
              414.3376
            ]
          },
          "wrongText": null,
          "unboundParentWrongCall": false
        },
        {
          "letter": "C",
          "instance": "AnsBtn3",
          "buttonId": 459,
          "depth": 279,
          "correct": false,
          "hitBoxPx": [
            569.7485,
            346.2367,
            726.3015,
            374.0128
          ],
          "sourceLetter": {
            "textId": 164,
            "letter": "C",
            "depth": 152,
            "overlap": 1.0,
            "boxPx": [
              579.5055,
              352.3818,
              598.9959,
              369.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        },
        {
          "letter": "D",
          "instance": "AnsBtn4",
          "buttonId": 459,
          "depth": 277,
          "correct": false,
          "hitBoxPx": [
            570.7485,
            390.2367,
            727.3015,
            418.0128
          ],
          "sourceLetter": {
            "textId": 168,
            "letter": "D",
            "depth": 144,
            "overlap": 1.0,
            "boxPx": [
              580.0736,
              397.3818,
              601.4431,
              414.3376
            ]
          },
          "wrongText": "Sorry, the correct answer was B.",
          "unboundParentWrongCall": false
        }
      ],
      "correctFeedbackSpriteId": 479,
      "correctFeedbackEndFrame": 28
    }
  ]
} as const;
