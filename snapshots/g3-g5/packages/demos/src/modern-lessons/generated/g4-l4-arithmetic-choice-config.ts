// Generated from pinned own page sources; edit generator/recipe.
import type {ArithmeticChoiceConfig} from '../g4-l4-arithmetic-choice';
export const G4_L4_ARITHMETIC_CHOICE_CONFIGS = [
  {
    "animationId": "course-g04-l04-in-009",
    "placementId": "g04-l04-placement-025",
    "sourceSha256": "28bafe9b1045bd23e9cadd4cd4261bfaf61b97dc324b9d8e1486ef4bbeb8efc1",
    "rootFrame": 6,
    "frameDomain": "sprite-266",
    "frameCount": 122,
    "fps": 12,
    "activityFrame": 70,
    "questions": [
      {
        "id": "exercise",
        "frame": 70,
        "firstFrame": 1,
        "lastFrameExclusive": 123,
        "prompt": "Click the sum.",
        "answers": [
          {
            "id": "left",
            "text": "122",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-266/depth-8/generation-1"
          },
          {
            "id": "middle",
            "text": "212",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-266/depth-10/generation-1"
          },
          {
            "id": "right",
            "text": "222",
            "correct": true,
            "sourceButton": 19,
            "sourceInstance": "sprite-266/depth-6/generation-1"
          }
        ],
        "wrongExplanation": "Did you remember to carry? Try again."
      }
    ],
    "binding": {
      "schemaVersion": 1,
      "version": "g04-l04-placement-025-native-arithmetic-choice-r1",
      "placementId": "g04-l04-placement-025",
      "animationId": "course-g04-l04-in-009",
      "sourceSwfSha256": "28bafe9b1045bd23e9cadd4cd4261bfaf61b97dc324b9d8e1486ef4bbeb8efc1",
      "template": "exercise",
      "blocks": [
        {
          "id": "root-title",
          "role": "title",
          "language": "en",
          "readingOrder": 0,
          "sourceTextIds": [
            "character-2/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "prompt",
          "role": "question",
          "language": "en",
          "readingOrder": 1,
          "sourceTextIds": [
            "character-17/run-0",
            "character-6/run-0",
            "character-6/run-1",
            "character-6/run-2"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "top",
          "role": "label",
          "language": "en",
          "readingOrder": 2,
          "sourceTextIds": [
            "character-15/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "bottom",
          "role": "label",
          "language": "en",
          "readingOrder": 3,
          "sourceTextIds": [
            "character-14/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "operator",
          "role": "label",
          "language": "en",
          "readingOrder": 4,
          "sourceTextIds": [
            "character-16/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-left",
          "role": "answer",
          "language": "en",
          "readingOrder": 5,
          "sourceTextIds": [
            "character-11/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-middle",
          "role": "answer",
          "language": "en",
          "readingOrder": 6,
          "sourceTextIds": [
            "character-12/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-right",
          "role": "answer",
          "language": "en",
          "readingOrder": 7,
          "sourceTextIds": [
            "character-10/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "feedback-correct-1-rocket",
          "role": "feedback",
          "language": "en",
          "readingOrder": 8,
          "sourceTextIds": [
            "character-115/run-0",
            "character-116/run-0",
            "character-117/run-0",
            "character-118/run-0",
            "character-119/run-0",
            "character-120/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 9,
          "sourceTextIds": [
            "character-130/run-0",
            "character-131/run-0",
            "character-133/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 10,
          "sourceTextIds": [
            "character-169/run-0",
            "character-170/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 11,
          "sourceTextIds": [
            "character-229/run-0",
            "character-230/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-4",
          "role": "feedback",
          "language": "en",
          "readingOrder": 12,
          "sourceTextIds": [
            "character-189/run-0",
            "character-190/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 13,
          "sourceTextIds": [
            "character-70/run-0",
            "character-71/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 14,
          "sourceTextIds": [
            "character-47/run-0",
            "character-48/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 15,
          "sourceTextIds": [
            "character-81/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "wrong-explanation",
          "role": "feedback",
          "language": "en",
          "readingOrder": 16,
          "sourceTextIds": [
            "character-30"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "close",
          "role": "label",
          "language": "en",
          "readingOrder": 17,
          "sourceTextIds": [
            "character-32/run-0"
          ],
          "valueSource": "source-static"
        }
      ]
    },
    "text": {
      "root-title": "Addition & Subtraction: Learn It",
      "prompt": "Click the sum.",
      "top": "137",
      "bottom": "85",
      "operator": "+",
      "answer-left": "122",
      "answer-middle": "212",
      "answer-right": "222",
      "feedback-correct-1-rocket": "ROCKET",
      "feedback-correct-1": "Great Job!",
      "feedback-correct-2": "Good Job!",
      "feedback-correct-3": "Excellent!",
      "feedback-correct-4": "YOU GOT IT!",
      "feedback-wrong-1": "OH! NO",
      "feedback-wrong-2": "OH! NO",
      "feedback-wrong-3": "That's incorrect!",
      "wrong-explanation": "Did you remember to carry? Try again.",
      "close": "Close"
    },
    "prompt": {
      "tokens": [
        {
          "text": "Click ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "the ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "sum.",
          "color": "rgba(0,0,204,1.0)",
          "term": true
        }
      ],
      "alpha": [
        [
          1,
          0
        ],
        [
          2,
          0.16796875
        ],
        [
          3,
          0.33203125
        ],
        [
          4,
          0.5
        ],
        [
          5,
          0.66796875
        ],
        [
          6,
          0.83203125
        ],
        [
          7,
          1
        ]
      ],
      "aliasAlpha": [
        [
          1,
          0
        ],
        [
          60,
          1
        ],
        [
          61,
          0
        ],
        [
          62,
          1
        ],
        [
          63,
          0
        ],
        [
          64,
          1
        ],
        [
          65,
          0
        ]
      ],
      "aliasColor": "rgba(255,0,255,1.0)"
    },
    "mainValues": [
      {
        "id": "top",
        "character": 15,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "bottom",
        "character": 14,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "operator",
        "character": 16,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      }
    ],
    "ruleAlpha": [
      [
        1,
        0
      ],
      [
        2,
        0.25
      ],
      [
        3,
        0.5
      ],
      [
        4,
        0.75
      ],
      [
        5,
        1
      ]
    ],
    "answerFrames": {
      "left": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          76,
          {
            "alpha": 0.83203125,
            "travel": 0
          }
        ],
        [
          77,
          {
            "alpha": 0.66796875,
            "travel": 0
          }
        ],
        [
          78,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          79,
          {
            "alpha": 0.33203125,
            "travel": 0
          }
        ],
        [
          80,
          {
            "alpha": 0.16796875,
            "travel": 0
          }
        ],
        [
          81,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "middle": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          76,
          {
            "alpha": 0.83203125,
            "travel": 0
          }
        ],
        [
          77,
          {
            "alpha": 0.66796875,
            "travel": 0
          }
        ],
        [
          78,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          79,
          {
            "alpha": 0.33203125,
            "travel": 0
          }
        ],
        [
          80,
          {
            "alpha": 0.16796875,
            "travel": 0
          }
        ],
        [
          81,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "right": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          82,
          {
            "alpha": 1,
            "travel": 0.25
          }
        ],
        [
          83,
          {
            "alpha": 1,
            "travel": 0.5
          }
        ],
        [
          84,
          {
            "alpha": 1,
            "travel": 0.75
          }
        ],
        [
          85,
          {
            "alpha": 1,
            "travel": 1
          }
        ]
      ]
    },
    "layout": {
      "choiceFigureRem": 17.5,
      "choiceWidthRem": 5.5,
      "choiceCentersRem": [
        2.75,
        8.75,
        14.75
      ],
      "mathFontRem": 1.5,
      "keyboardScrollStep": 44
    },
    "feedback": [
      {
        "id": "correct-1",
        "kind": "correct",
        "variant": 1,
        "sourceInstanceId": "sprite-266/depth-59/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-134",
        "endFrame": 26,
        "labels": [
          {
            "id": "feedback-correct-1-rocket",
            "alpha": [
              [
                1,
                0
              ],
              [
                2,
                0.01171875
              ],
              [
                3,
                0.2578125
              ],
              [
                4,
                0.5078125
              ],
              [
                5,
                0.75390625
              ],
              [
                6,
                1
              ],
              [
                10,
                0.66796875
              ],
              [
                11,
                0.33203125
              ],
              [
                12,
                0
              ]
            ],
            "sourceCharacters": [
              115,
              116,
              117,
              118,
              119,
              120
            ]
          },
          {
            "id": "feedback-correct-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                10,
                0.33203125
              ],
              [
                11,
                0.66796875
              ],
              [
                12,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              130,
              131,
              133
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-2",
        "kind": "correct",
        "variant": 2,
        "sourceInstanceId": "sprite-266/depth-77/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-174",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-correct-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                12,
                0.33203125
              ],
              [
                13,
                0.66796875
              ],
              [
                14,
                1
              ],
              [
                25,
                0.66796875
              ],
              [
                26,
                0.33203125
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              169,
              170
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-3",
        "kind": "correct",
        "variant": 3,
        "sourceInstanceId": "sprite-266/depth-127/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-232",
        "endFrame": 25,
        "labels": [
          {
            "id": "feedback-correct-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                9,
                1
              ],
              [
                21,
                0.75
              ],
              [
                22,
                0.5
              ],
              [
                23,
                0.25
              ],
              [
                24,
                0
              ]
            ],
            "sourceCharacters": [
              229,
              230
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-4",
        "kind": "correct",
        "variant": 4,
        "sourceInstanceId": "sprite-266/depth-116/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-200",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-correct-4",
            "alpha": [
              [
                1,
                0
              ],
              [
                6,
                1
              ],
              [
                27,
                0.75
              ],
              [
                28,
                0.5
              ],
              [
                29,
                0.25
              ],
              [
                30,
                0
              ]
            ],
            "sourceCharacters": [
              189,
              190
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "wrong-1",
        "kind": "wrong",
        "variant": 1,
        "sourceInstanceId": "sprite-266/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-75",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-wrong-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                9,
                1
              ],
              [
                24,
                0.7890625
              ],
              [
                25,
                0.58203125
              ],
              [
                26,
                0.37109375
              ],
              [
                27,
                0.16015625
              ],
              [
                28,
                0.08203125
              ],
              [
                29,
                0
              ]
            ],
            "sourceCharacters": [
              70,
              71
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            17,
            0.16796875
          ],
          [
            18,
            0.33203125
          ],
          [
            19,
            0.5
          ],
          [
            20,
            0.66796875
          ],
          [
            21,
            0.83203125
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            17,
            23
          ]
        ],
        "closeActivityId": "close-wrong-1",
        "closeButton": 39
      },
      {
        "id": "wrong-2",
        "kind": "wrong",
        "variant": 2,
        "sourceInstanceId": "sprite-266/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-61",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-wrong-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.33203125
              ],
              [
                4,
                0.66796875
              ],
              [
                5,
                1
              ],
              [
                7,
                0
              ],
              [
                16,
                1
              ],
              [
                24,
                0.75
              ],
              [
                25,
                0.5
              ],
              [
                26,
                0.25
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              47,
              48
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-2",
        "closeButton": 39
      },
      {
        "id": "wrong-3",
        "kind": "wrong",
        "variant": 3,
        "sourceInstanceId": "sprite-266/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-103",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                4,
                1
              ],
              [
                24,
                0.72265625
              ],
              [
                25,
                0.44140625
              ],
              [
                26,
                0.22265625
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              81
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-3",
        "closeButton": 39
      }
    ],
    "activities": [
      {
        "id": "correct-1",
        "sourceInstanceId": "sprite-266/depth-59/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-134",
        "startFrame": 2,
        "endFrame": 26,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-1.mp3",
          "sha256": "ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af",
          "firstFrame": 2,
          "lastFrame": 26,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-2",
        "sourceInstanceId": "sprite-266/depth-77/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-174",
        "startFrame": 2,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-2.mp3",
          "sha256": "409b8ceceb0f8193edd69b9a8e8ea361bf7fadff3d465a761bce899568f72038",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-3",
        "sourceInstanceId": "sprite-266/depth-127/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-232",
        "startFrame": 2,
        "endFrame": 25,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-3.mp3",
          "sha256": "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
          "firstFrame": 2,
          "lastFrame": 25,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-4",
        "sourceInstanceId": "sprite-266/depth-116/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-200",
        "startFrame": 2,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-4.mp3",
          "sha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1",
        "sourceInstanceId": "sprite-266/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-75",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g05-l01-ti-010/wrong-1.mp3",
          "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
          "firstFrame": 3,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1-outro",
        "sourceInstanceId": "sprite-266/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-75",
        "startFrame": 23,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g05-l01-ti-010/wrong-1.mp3",
          "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
          "firstFrame": 3,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-1",
          "firstFrame": 17,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-1",
        "sourceInstanceId": "sprite-266/depth-37/generation-1/sprite-75/depth-11/generation-1/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2",
        "sourceInstanceId": "sprite-266/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-61",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-3.mp3",
          "sha256": "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2-outro",
        "sourceInstanceId": "sprite-266/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-61",
        "startFrame": 23,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-3.mp3",
          "sha256": "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-2",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-2",
        "sourceInstanceId": "sprite-266/depth-31/generation-1/sprite-61/depth-5/generation-2/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3",
        "sourceInstanceId": "sprite-266/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-103",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3-outro",
        "sourceInstanceId": "sprite-266/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "frameDomain": "sprite-103",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-3",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-3",
        "sourceInstanceId": "sprite-266/depth-49/generation-1/sprite-103/depth-9/generation-1/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 70,
          "lastFrameExclusive": 71
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          70
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      }
    ],
    "term": {
      "button": 8,
      "key": "Sum",
      "word": "sum",
      "entryId": "en-0672-54cac7269120",
      "activeFrames": [
        [
          2,
          123
        ]
      ]
    },
    "keyTerms": {
      "indexLanguage": "en",
      "sourceAssetId": "ELKTEG4.xml",
      "sourceSha256": "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      "entryIds": [
        "en-0672-54cac7269120"
      ]
    },
    "sourceAudio": [
      {
        "id": "source-main",
        "sourceCueId": "sprite-266-original-stream",
        "frame": 7,
        "endFrame": 123,
        "frameDomain": "sprite-266",
        "language": "en",
        "spokenLanguage": "undetermined",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-009/main.mp3",
        "sha256": "6a3c7718bd176dd0d40371003dceb0ddf7e2ed561c9a0484323855fc4f77fd80",
        "scenario": "source-static-frame"
      }
    ]
  },
  {
    "animationId": "course-g04-l04-in-013",
    "placementId": "g04-l04-placement-029",
    "sourceSha256": "fc05639c8f626cf9ce4f8e8a5638c62898437e5d016285199f9a865b5c4a4751",
    "rootFrame": 6,
    "frameDomain": "sprite-191",
    "frameCount": 141,
    "fps": 12,
    "activityFrame": 62,
    "questions": [
      {
        "id": "exercise",
        "frame": 62,
        "firstFrame": 1,
        "lastFrameExclusive": 142,
        "prompt": "Click the difference.",
        "answers": [
          {
            "id": "left",
            "text": "29",
            "correct": true,
            "sourceButton": 20,
            "sourceInstance": "sprite-191/depth-6/generation-1"
          },
          {
            "id": "middle",
            "text": "31",
            "correct": false,
            "sourceButton": 21,
            "sourceInstance": "sprite-191/depth-10/generation-1"
          },
          {
            "id": "right",
            "text": "39",
            "correct": false,
            "sourceButton": 19,
            "sourceInstance": "sprite-191/depth-8/generation-1"
          }
        ],
        "wrongExplanation": "Did you remember to borrow? Try again."
      }
    ],
    "binding": {
      "schemaVersion": 1,
      "version": "g04-l04-placement-029-native-arithmetic-choice-r1",
      "placementId": "g04-l04-placement-029",
      "animationId": "course-g04-l04-in-013",
      "sourceSwfSha256": "fc05639c8f626cf9ce4f8e8a5638c62898437e5d016285199f9a865b5c4a4751",
      "template": "exercise",
      "blocks": [
        {
          "id": "root-title",
          "role": "title",
          "language": "en",
          "readingOrder": 0,
          "sourceTextIds": [
            "character-2/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "prompt",
          "role": "question",
          "language": "en",
          "readingOrder": 1,
          "sourceTextIds": [
            "character-17/run-0",
            "character-6/run-0",
            "character-6/run-1",
            "character-6/run-2"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "top",
          "role": "label",
          "language": "en",
          "readingOrder": 2,
          "sourceTextIds": [
            "character-15/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "bottom",
          "role": "label",
          "language": "en",
          "readingOrder": 3,
          "sourceTextIds": [
            "character-14/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "operator",
          "role": "label",
          "language": "en",
          "readingOrder": 4,
          "sourceTextIds": [
            "character-16/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-left",
          "role": "answer",
          "language": "en",
          "readingOrder": 5,
          "sourceTextIds": [
            "character-10/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-middle",
          "role": "answer",
          "language": "en",
          "readingOrder": 6,
          "sourceTextIds": [
            "character-12/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-right",
          "role": "answer",
          "language": "en",
          "readingOrder": 7,
          "sourceTextIds": [
            "character-11/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "feedback-correct-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 8,
          "sourceTextIds": [
            "character-155/run-0",
            "character-156/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 9,
          "sourceTextIds": [
            "character-173/run-0",
            "character-174/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 10,
          "sourceTextIds": [
            "character-106/run-0",
            "character-107/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-4",
          "role": "feedback",
          "language": "en",
          "readingOrder": 11,
          "sourceTextIds": [
            "character-184/run-0",
            "character-185/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 12,
          "sourceTextIds": [
            "character-27/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 13,
          "sourceTextIds": [
            "character-90/run-0",
            "character-91/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 14,
          "sourceTextIds": [
            "character-69/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "wrong-explanation",
          "role": "feedback",
          "language": "en",
          "readingOrder": 15,
          "sourceTextIds": [
            "character-43"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "close",
          "role": "label",
          "language": "en",
          "readingOrder": 16,
          "sourceTextIds": [
            "character-45/run-0"
          ],
          "valueSource": "source-static"
        }
      ]
    },
    "text": {
      "root-title": "Addition & Subtraction: Learn It",
      "prompt": "Click the difference.",
      "top": "86",
      "bottom": "57",
      "operator": "−",
      "answer-left": "29",
      "answer-middle": "31",
      "answer-right": "39",
      "feedback-correct-1": "YOU GOT IT!",
      "feedback-correct-2": "Correct!",
      "feedback-correct-3": "Excellent!",
      "feedback-correct-4": "Great Job!",
      "feedback-wrong-1": "That's incorrect!",
      "feedback-wrong-2": "Incorrect!",
      "feedback-wrong-3": "Try Again!",
      "wrong-explanation": "Did you remember to borrow? Try again.",
      "close": "Close"
    },
    "prompt": {
      "tokens": [
        {
          "text": "Click ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "the ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "difference.",
          "color": "rgba(0,0,204,1.0)",
          "term": true
        }
      ],
      "alpha": [
        [
          1,
          0
        ],
        [
          2,
          0.16796875
        ],
        [
          3,
          0.33203125
        ],
        [
          4,
          0.5
        ],
        [
          5,
          0.66796875
        ],
        [
          6,
          0.83203125
        ],
        [
          7,
          1
        ]
      ],
      "aliasAlpha": [
        [
          1,
          0
        ],
        [
          49,
          1
        ],
        [
          50,
          0
        ],
        [
          51,
          1
        ],
        [
          52,
          0
        ],
        [
          53,
          1
        ],
        [
          54,
          0
        ],
        [
          55,
          1
        ],
        [
          56,
          0
        ]
      ],
      "aliasColor": "rgba(255,0,255,1.0)"
    },
    "mainValues": [
      {
        "id": "top",
        "character": 15,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "bottom",
        "character": 14,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "operator",
        "character": 16,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      }
    ],
    "ruleAlpha": [
      [
        1,
        0
      ],
      [
        2,
        0.25
      ],
      [
        3,
        0.5
      ],
      [
        4,
        0.75
      ],
      [
        5,
        1
      ]
    ],
    "answerFrames": {
      "left": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          73,
          {
            "alpha": 1,
            "travel": 0.20035398230088497
          }
        ],
        [
          74,
          {
            "alpha": 1,
            "travel": 0.4
          }
        ],
        [
          75,
          {
            "alpha": 1,
            "travel": 0.6
          }
        ],
        [
          76,
          {
            "alpha": 1,
            "travel": 0.8
          }
        ],
        [
          77,
          {
            "alpha": 1,
            "travel": 1
          }
        ]
      ],
      "middle": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          67,
          {
            "alpha": 0.80078125,
            "travel": 0
          }
        ],
        [
          68,
          {
            "alpha": 0.6015625,
            "travel": 0
          }
        ],
        [
          69,
          {
            "alpha": 0.3984375,
            "travel": 0
          }
        ],
        [
          70,
          {
            "alpha": 0.19921875,
            "travel": 0
          }
        ],
        [
          71,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "right": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          67,
          {
            "alpha": 0.80078125,
            "travel": 0
          }
        ],
        [
          68,
          {
            "alpha": 0.6015625,
            "travel": 0
          }
        ],
        [
          69,
          {
            "alpha": 0.3984375,
            "travel": 0
          }
        ],
        [
          70,
          {
            "alpha": 0.19921875,
            "travel": 0
          }
        ],
        [
          71,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ]
    },
    "layout": {
      "choiceFigureRem": 17.5,
      "choiceWidthRem": 5.5,
      "choiceCentersRem": [
        2.75,
        8.75,
        14.75
      ],
      "mathFontRem": 1.5,
      "keyboardScrollStep": 44
    },
    "feedback": [
      {
        "id": "correct-1",
        "kind": "correct",
        "variant": 1,
        "sourceInstanceId": "sprite-191/depth-70/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-162",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-correct-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                13,
                0.33203125
              ],
              [
                14,
                0.66796875
              ],
              [
                15,
                1
              ],
              [
                24,
                0.75
              ],
              [
                25,
                0.5
              ],
              [
                26,
                0.25
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              155,
              156
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-2",
        "kind": "correct",
        "variant": 2,
        "sourceInstanceId": "sprite-191/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-178",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-correct-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                12,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              173,
              174
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-3",
        "kind": "correct",
        "variant": 3,
        "sourceInstanceId": "sprite-191/depth-61/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-109",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-correct-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                5,
                1
              ],
              [
                23,
                0.75
              ],
              [
                24,
                0.5
              ],
              [
                25,
                0.25
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              106,
              107
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-4",
        "kind": "correct",
        "variant": 4,
        "sourceInstanceId": "sprite-191/depth-89/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-190",
        "endFrame": 25,
        "labels": [
          {
            "id": "feedback-correct-4",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.19921875
              ],
              [
                4,
                0.3984375
              ],
              [
                5,
                0.55078125
              ],
              [
                6,
                0.69921875
              ],
              [
                7,
                0.8515625
              ],
              [
                8,
                1
              ],
              [
                20,
                0.83203125
              ],
              [
                21,
                0.66796875
              ],
              [
                22,
                0.5
              ],
              [
                23,
                0.33203125
              ],
              [
                24,
                0.16796875
              ],
              [
                25,
                0
              ]
            ],
            "sourceCharacters": [
              184,
              185
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "wrong-1",
        "kind": "wrong",
        "variant": 1,
        "sourceInstanceId": "sprite-191/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-62",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                4,
                1
              ],
              [
                24,
                0.72265625
              ],
              [
                25,
                0.44140625
              ],
              [
                26,
                0.22265625
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              27
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-1",
        "closeButton": 52
      },
      {
        "id": "wrong-2",
        "kind": "wrong",
        "variant": 2,
        "sourceInstanceId": "sprite-191/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-97",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-wrong-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.33203125
              ],
              [
                4,
                0.66796875
              ],
              [
                5,
                1
              ],
              [
                27,
                0.75
              ],
              [
                28,
                0.5
              ],
              [
                29,
                0.25
              ],
              [
                30,
                0
              ]
            ],
            "sourceCharacters": [
              90,
              91
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-2",
        "closeButton": 52
      },
      {
        "id": "wrong-3",
        "kind": "wrong",
        "variant": 3,
        "sourceInstanceId": "sprite-191/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-73",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                7,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              69
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            17,
            0.16796875
          ],
          [
            18,
            0.33203125
          ],
          [
            19,
            0.5
          ],
          [
            20,
            0.66796875
          ],
          [
            21,
            0.83203125
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            17,
            23
          ]
        ],
        "closeActivityId": "close-wrong-3",
        "closeButton": 52
      }
    ],
    "activities": [
      {
        "id": "correct-1",
        "sourceInstanceId": "sprite-191/depth-70/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-162",
        "startFrame": 2,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-006/correct-1.mp3",
          "sha256": "1b7f35c62c832068bd2e0e54246c591df18f08e9ff8c77527e6f3ba03650246f",
          "firstFrame": 3,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-2",
        "sourceInstanceId": "sprite-191/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-178",
        "startFrame": 2,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-ti-002/sprite-205.mp3",
          "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-3",
        "sourceInstanceId": "sprite-191/depth-61/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-109",
        "startFrame": 2,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-006/correct-3.mp3",
          "sha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-4",
        "sourceInstanceId": "sprite-191/depth-89/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-190",
        "startFrame": 2,
        "endFrame": 25,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ts-008/correct-4.wav",
          "sha256": "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8",
          "firstFrame": 1,
          "lastFrame": 13,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1",
        "sourceInstanceId": "sprite-191/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-62",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1-outro",
        "sourceInstanceId": "sprite-191/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-62",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-1",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-1",
        "sourceInstanceId": "sprite-191/depth-21/generation-1/sprite-62/depth-9/generation-1/sprite-53/depth-3/generation-1/button-52/record-10",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "buttonPress": {
          "sourceButtonId": 52
        },
        "frameDomain": "sprite-51",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2",
        "sourceInstanceId": "sprite-191/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-97",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-1.mp3",
          "sha256": "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2-outro",
        "sourceInstanceId": "sprite-191/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-97",
        "startFrame": 23,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-1.mp3",
          "sha256": "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-2",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-2",
        "sourceInstanceId": "sprite-191/depth-55/generation-1/sprite-97/depth-4/generation-2/sprite-53/depth-3/generation-1/button-52/record-10",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "buttonPress": {
          "sourceButtonId": 52
        },
        "frameDomain": "sprite-51",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3",
        "sourceInstanceId": "sprite-191/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-73",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-2.mp3",
          "sha256": "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3-outro",
        "sourceInstanceId": "sprite-191/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "frameDomain": "sprite-73",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-2.mp3",
          "sha256": "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-3",
          "firstFrame": 17,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-3",
        "sourceInstanceId": "sprite-191/depth-31/generation-1/sprite-73/depth-12/generation-1/sprite-53/depth-3/generation-1/button-52/record-10",
        "parentLifetime": {
          "firstFrame": 62,
          "lastFrameExclusive": 63
        },
        "buttonPress": {
          "sourceButtonId": 52
        },
        "frameDomain": "sprite-51",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          62
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      }
    ],
    "term": {
      "button": 8,
      "key": "Difference",
      "word": "difference",
      "entryId": "en-0155-d8a218e0d238",
      "activeFrames": [
        [
          2,
          142
        ]
      ]
    },
    "keyTerms": {
      "indexLanguage": "en",
      "sourceAssetId": "ELKTEG4.xml",
      "sourceSha256": "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      "entryIds": [
        "en-0155-d8a218e0d238"
      ]
    },
    "sourceAudio": [
      {
        "id": "source-main",
        "sourceCueId": "sprite-191-original-stream",
        "frame": 7,
        "endFrame": 142,
        "frameDomain": "sprite-191",
        "language": "en",
        "spokenLanguage": "undetermined",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-013/main.mp3",
        "sha256": "7e882b1d14fc55fca82ba7eec5ee8e1bc3bfba824d82986294b92cddeb2f67c7",
        "scenario": "source-static-frame"
      }
    ]
  },
  {
    "animationId": "course-g04-l04-in-018",
    "placementId": "g04-l04-placement-034",
    "sourceSha256": "f7eff516f74ca1c4a5ce73af2511962b6c5492fd7fd3e84361885fa90057190b",
    "rootFrame": 6,
    "frameDomain": "sprite-179",
    "frameCount": 145,
    "fps": 12,
    "activityFrame": 98,
    "questions": [
      {
        "id": "exercise",
        "frame": 98,
        "firstFrame": 1,
        "lastFrameExclusive": 146,
        "prompt": "Click the sum.",
        "answers": [
          {
            "id": "left",
            "text": "12.46",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-179/depth-8/generation-1"
          },
          {
            "id": "middle",
            "text": "12.56",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-179/depth-10/generation-1"
          },
          {
            "id": "right",
            "text": "13.56",
            "correct": true,
            "sourceButton": 19,
            "sourceInstance": "sprite-179/depth-6/generation-1"
          }
        ],
        "wrongExplanation": "Did you remember to carry? Try again."
      }
    ],
    "binding": {
      "schemaVersion": 1,
      "version": "g04-l04-placement-034-native-arithmetic-choice-r1",
      "placementId": "g04-l04-placement-034",
      "animationId": "course-g04-l04-in-018",
      "sourceSwfSha256": "f7eff516f74ca1c4a5ce73af2511962b6c5492fd7fd3e84361885fa90057190b",
      "template": "exercise",
      "blocks": [
        {
          "id": "root-title",
          "role": "title",
          "language": "en",
          "readingOrder": 0,
          "sourceTextIds": [
            "character-2/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "prompt",
          "role": "question",
          "language": "en",
          "readingOrder": 1,
          "sourceTextIds": [
            "character-17/run-0",
            "character-6/run-0",
            "character-6/run-1",
            "character-6/run-2"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "top",
          "role": "label",
          "language": "en",
          "readingOrder": 2,
          "sourceTextIds": [
            "character-15/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "bottom",
          "role": "label",
          "language": "en",
          "readingOrder": 3,
          "sourceTextIds": [
            "character-14/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "operator",
          "role": "label",
          "language": "en",
          "readingOrder": 4,
          "sourceTextIds": [
            "character-16/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-left",
          "role": "answer",
          "language": "en",
          "readingOrder": 5,
          "sourceTextIds": [
            "character-11/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-middle",
          "role": "answer",
          "language": "en",
          "readingOrder": 6,
          "sourceTextIds": [
            "character-12/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-right",
          "role": "answer",
          "language": "en",
          "readingOrder": 7,
          "sourceTextIds": [
            "character-10/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "feedback-correct-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 8,
          "sourceTextIds": [
            "character-115/run-0",
            "character-116/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 9,
          "sourceTextIds": [
            "character-164/run-0",
            "character-165/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 10,
          "sourceTextIds": [
            "character-139/run-0",
            "character-140/run-0",
            "character-144/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-4",
          "role": "feedback",
          "language": "en",
          "readingOrder": 11,
          "sourceTextIds": [
            "character-126/run-0",
            "character-127/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 12,
          "sourceTextIds": [
            "character-81/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 13,
          "sourceTextIds": [
            "character-47/run-0",
            "character-48/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 14,
          "sourceTextIds": [
            "character-70/run-0",
            "character-71/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "wrong-explanation",
          "role": "feedback",
          "language": "en",
          "readingOrder": 15,
          "sourceTextIds": [
            "character-30"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "close",
          "role": "label",
          "language": "en",
          "readingOrder": 16,
          "sourceTextIds": [
            "character-32/run-0"
          ],
          "valueSource": "source-static"
        }
      ]
    },
    "text": {
      "root-title": "Addition & Subtraction: Learn It",
      "prompt": "Click the sum.",
      "top": "9.87",
      "bottom": "3.69",
      "operator": "+",
      "answer-left": "12.46",
      "answer-middle": "12.56",
      "answer-right": "13.56",
      "feedback-correct-1": "Correct!",
      "feedback-correct-2": "Well done!",
      "feedback-correct-3": "Excellent!",
      "feedback-correct-4": "Great Job!",
      "feedback-wrong-1": "That's incorrect!",
      "feedback-wrong-2": "OH! NO",
      "feedback-wrong-3": "OH! NO",
      "wrong-explanation": "Did you remember to carry? Try again.",
      "close": "Close"
    },
    "prompt": {
      "tokens": [
        {
          "text": "Click ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "the ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "sum.",
          "color": "rgba(0,0,204,1.0)",
          "term": true
        }
      ],
      "alpha": [
        [
          1,
          0
        ],
        [
          2,
          0.16796875
        ],
        [
          3,
          0.33203125
        ],
        [
          4,
          0.5
        ],
        [
          5,
          0.66796875
        ],
        [
          6,
          0.83203125
        ],
        [
          7,
          1
        ]
      ],
      "aliasAlpha": [
        [
          1,
          0
        ],
        [
          84,
          1
        ],
        [
          85,
          0
        ],
        [
          86,
          1
        ],
        [
          87,
          0
        ],
        [
          88,
          1
        ],
        [
          89,
          0
        ]
      ],
      "aliasColor": "rgba(255,0,255,1.0)"
    },
    "mainValues": [
      {
        "id": "top",
        "character": 15,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "bottom",
        "character": 14,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "operator",
        "character": 16,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      }
    ],
    "ruleAlpha": [
      [
        1,
        0
      ],
      [
        2,
        0.25
      ],
      [
        3,
        0.5
      ],
      [
        4,
        0.75
      ],
      [
        5,
        1
      ]
    ],
    "answerFrames": {
      "left": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          105,
          {
            "alpha": 0.83203125,
            "travel": 0
          }
        ],
        [
          106,
          {
            "alpha": 0.66796875,
            "travel": 0
          }
        ],
        [
          107,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          108,
          {
            "alpha": 0.33203125,
            "travel": 0
          }
        ],
        [
          109,
          {
            "alpha": 0.16796875,
            "travel": 0
          }
        ],
        [
          110,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "middle": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          105,
          {
            "alpha": 0.83203125,
            "travel": 0
          }
        ],
        [
          106,
          {
            "alpha": 0.66796875,
            "travel": 0
          }
        ],
        [
          107,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          108,
          {
            "alpha": 0.33203125,
            "travel": 0
          }
        ],
        [
          109,
          {
            "alpha": 0.16796875,
            "travel": 0
          }
        ],
        [
          110,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "right": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          112,
          {
            "alpha": 1,
            "travel": 0.1668059036480089
          }
        ],
        [
          113,
          {
            "alpha": 1,
            "travel": 0.3333333333333333
          }
        ],
        [
          114,
          {
            "alpha": 1,
            "travel": 0.5001392369813422
          }
        ],
        [
          115,
          {
            "alpha": 1,
            "travel": 0.6666666666666666
          }
        ],
        [
          116,
          {
            "alpha": 1,
            "travel": 0.8334725703146756
          }
        ],
        [
          117,
          {
            "alpha": 1,
            "travel": 1
          }
        ]
      ]
    },
    "layout": {
      "choiceFigureRem": 17.5,
      "choiceWidthRem": 5.5,
      "choiceCentersRem": [
        2.75,
        8.75,
        14.75
      ],
      "mathFontRem": 1.5,
      "keyboardScrollStep": 44
    },
    "feedback": [
      {
        "id": "correct-1",
        "kind": "correct",
        "variant": 1,
        "sourceInstanceId": "sprite-179/depth-59/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-120",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-correct-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                12,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              115,
              116
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-2",
        "kind": "correct",
        "variant": 2,
        "sourceInstanceId": "sprite-179/depth-118/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-166",
        "endFrame": 33,
        "labels": [
          {
            "id": "feedback-correct-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                13,
                0.33203125
              ],
              [
                14,
                0.66796875
              ],
              [
                15,
                1
              ],
              [
                25,
                0.875
              ],
              [
                26,
                0.75
              ],
              [
                27,
                0.625
              ],
              [
                28,
                0.5
              ],
              [
                29,
                0.375
              ],
              [
                30,
                0.25
              ],
              [
                31,
                0.125
              ],
              [
                32,
                0
              ]
            ],
            "sourceCharacters": [
              164,
              165
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-3",
        "kind": "correct",
        "variant": 3,
        "sourceInstanceId": "sprite-179/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-146",
        "endFrame": 32,
        "labels": [
          {
            "id": "feedback-correct-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                12,
                0.25
              ],
              [
                13,
                0.5
              ],
              [
                14,
                0.75
              ],
              [
                15,
                1
              ],
              [
                27,
                0.80078125
              ],
              [
                28,
                0.6015625
              ],
              [
                29,
                0.3984375
              ],
              [
                30,
                0.19921875
              ],
              [
                31,
                0
              ]
            ],
            "sourceCharacters": [
              139,
              140,
              144
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-4",
        "kind": "correct",
        "variant": 4,
        "sourceInstanceId": "sprite-179/depth-69/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-132",
        "endFrame": 25,
        "labels": [
          {
            "id": "feedback-correct-4",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.19921875
              ],
              [
                4,
                0.3984375
              ],
              [
                5,
                0.55078125
              ],
              [
                6,
                0.69921875
              ],
              [
                7,
                0.8515625
              ],
              [
                8,
                1
              ],
              [
                20,
                0.83203125
              ],
              [
                21,
                0.66796875
              ],
              [
                22,
                0.5
              ],
              [
                23,
                0.33203125
              ],
              [
                24,
                0.16796875
              ],
              [
                25,
                0
              ]
            ],
            "sourceCharacters": [
              126,
              127
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "wrong-1",
        "kind": "wrong",
        "variant": 1,
        "sourceInstanceId": "sprite-179/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-103",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                4,
                1
              ],
              [
                24,
                0.72265625
              ],
              [
                25,
                0.44140625
              ],
              [
                26,
                0.22265625
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              81
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-1",
        "closeButton": 39
      },
      {
        "id": "wrong-2",
        "kind": "wrong",
        "variant": 2,
        "sourceInstanceId": "sprite-179/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-61",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-wrong-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.33203125
              ],
              [
                4,
                0.66796875
              ],
              [
                5,
                1
              ],
              [
                7,
                0
              ],
              [
                16,
                1
              ],
              [
                24,
                0.75
              ],
              [
                25,
                0.5
              ],
              [
                26,
                0.25
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              47,
              48
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-2",
        "closeButton": 39
      },
      {
        "id": "wrong-3",
        "kind": "wrong",
        "variant": 3,
        "sourceInstanceId": "sprite-179/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-75",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-wrong-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                9,
                1
              ],
              [
                24,
                0.7890625
              ],
              [
                25,
                0.58203125
              ],
              [
                26,
                0.37109375
              ],
              [
                27,
                0.16015625
              ],
              [
                28,
                0.08203125
              ],
              [
                29,
                0
              ]
            ],
            "sourceCharacters": [
              70,
              71
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            17,
            0.16796875
          ],
          [
            18,
            0.33203125
          ],
          [
            19,
            0.5
          ],
          [
            20,
            0.66796875
          ],
          [
            21,
            0.83203125
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            17,
            23
          ]
        ],
        "closeActivityId": "close-wrong-3",
        "closeButton": 39
      }
    ],
    "activities": [
      {
        "id": "correct-1",
        "sourceInstanceId": "sprite-179/depth-59/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-120",
        "startFrame": 2,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-ti-002/sprite-205.mp3",
          "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-2",
        "sourceInstanceId": "sprite-179/depth-118/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-166",
        "startFrame": 2,
        "endFrame": 33,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-ti-002/sprite-252.mp3",
          "sha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e",
          "firstFrame": 3,
          "lastFrame": 33,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-3",
        "sourceInstanceId": "sprite-179/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-146",
        "startFrame": 2,
        "endFrame": 32,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-ti-002/sprite-231.mp3",
          "sha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
          "firstFrame": 3,
          "lastFrame": 32,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-4",
        "sourceInstanceId": "sprite-179/depth-69/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-132",
        "startFrame": 2,
        "endFrame": 25,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ts-008/correct-4.wav",
          "sha256": "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8",
          "firstFrame": 1,
          "lastFrame": 13,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1",
        "sourceInstanceId": "sprite-179/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-103",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1-outro",
        "sourceInstanceId": "sprite-179/depth-49/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-103",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-1",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-1",
        "sourceInstanceId": "sprite-179/depth-49/generation-1/sprite-103/depth-9/generation-1/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2",
        "sourceInstanceId": "sprite-179/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-61",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-3.mp3",
          "sha256": "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2-outro",
        "sourceInstanceId": "sprite-179/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-61",
        "startFrame": 23,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-3.mp3",
          "sha256": "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-2",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-2",
        "sourceInstanceId": "sprite-179/depth-31/generation-1/sprite-61/depth-5/generation-2/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3",
        "sourceInstanceId": "sprite-179/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-75",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g05-l01-ti-010/wrong-1.mp3",
          "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
          "firstFrame": 3,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3-outro",
        "sourceInstanceId": "sprite-179/depth-37/generation-1",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "frameDomain": "sprite-75",
        "startFrame": 23,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g05-l01-ti-010/wrong-1.mp3",
          "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
          "firstFrame": 3,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-3",
          "firstFrame": 17,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-3",
        "sourceInstanceId": "sprite-179/depth-37/generation-1/sprite-75/depth-11/generation-1/sprite-40/depth-3/generation-1/button-39/record-10",
        "parentLifetime": {
          "firstFrame": 98,
          "lastFrameExclusive": 99
        },
        "buttonPress": {
          "sourceButtonId": 39
        },
        "frameDomain": "sprite-38",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          98
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      }
    ],
    "term": {
      "button": 8,
      "key": "Sum",
      "word": "sum",
      "entryId": "en-0672-54cac7269120",
      "activeFrames": [
        [
          2,
          146
        ]
      ]
    },
    "keyTerms": {
      "indexLanguage": "en",
      "sourceAssetId": "ELKTEG4.xml",
      "sourceSha256": "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      "entryIds": [
        "en-0672-54cac7269120"
      ]
    },
    "sourceAudio": [
      {
        "id": "source-main",
        "sourceCueId": "sprite-179-original-stream",
        "frame": 7,
        "endFrame": 146,
        "frameDomain": "sprite-179",
        "language": "en",
        "spokenLanguage": "undetermined",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-018/main.mp3",
        "sha256": "d4f272a5c1cdda3315cb28eb8470c7b810cc56fa3b97be05c0aecc83196308b6",
        "scenario": "source-static-frame"
      }
    ]
  },
  {
    "animationId": "course-g04-l04-in-019",
    "placementId": "g04-l04-placement-035",
    "sourceSha256": "9405b73c95a967d9afcd7ab1066cfdba84755d097ef19a35bc788493c8422d70",
    "rootFrame": 6,
    "frameDomain": "sprite-259",
    "frameCount": 131,
    "fps": 12,
    "activityFrame": 102,
    "questions": [
      {
        "id": "exercise",
        "frame": 102,
        "firstFrame": 1,
        "lastFrameExclusive": 132,
        "prompt": "Click the difference.",
        "answers": [
          {
            "id": "left",
            "text": "5.06",
            "correct": true,
            "sourceButton": 19,
            "sourceInstance": "sprite-259/depth-6/generation-1"
          },
          {
            "id": "middle",
            "text": "5.14",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-259/depth-10/generation-1"
          },
          {
            "id": "right",
            "text": "5.16",
            "correct": false,
            "sourceButton": 20,
            "sourceInstance": "sprite-259/depth-8/generation-1"
          }
        ],
        "wrongExplanation": "Did you remember to borrow? Try again."
      }
    ],
    "binding": {
      "schemaVersion": 1,
      "version": "g04-l04-placement-035-native-arithmetic-choice-r1",
      "placementId": "g04-l04-placement-035",
      "animationId": "course-g04-l04-in-019",
      "sourceSwfSha256": "9405b73c95a967d9afcd7ab1066cfdba84755d097ef19a35bc788493c8422d70",
      "template": "exercise",
      "blocks": [
        {
          "id": "root-title",
          "role": "title",
          "language": "en",
          "readingOrder": 0,
          "sourceTextIds": [
            "character-2/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "prompt",
          "role": "question",
          "language": "en",
          "readingOrder": 1,
          "sourceTextIds": [
            "character-17/run-0",
            "character-6/run-0",
            "character-6/run-1",
            "character-6/run-2"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "top",
          "role": "label",
          "language": "en",
          "readingOrder": 2,
          "sourceTextIds": [
            "character-15/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "bottom",
          "role": "label",
          "language": "en",
          "readingOrder": 3,
          "sourceTextIds": [
            "character-14/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "operator",
          "role": "label",
          "language": "en",
          "readingOrder": 4,
          "sourceTextIds": [
            "character-16/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-left",
          "role": "answer",
          "language": "en",
          "readingOrder": 5,
          "sourceTextIds": [
            "character-10/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-middle",
          "role": "answer",
          "language": "en",
          "readingOrder": 6,
          "sourceTextIds": [
            "character-12/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "answer-right",
          "role": "answer",
          "language": "en",
          "readingOrder": 7,
          "sourceTextIds": [
            "character-11/run-0"
          ],
          "valueSource": "source-static"
        },
        {
          "id": "feedback-correct-1-rocket",
          "role": "feedback",
          "language": "en",
          "readingOrder": 8,
          "sourceTextIds": [
            "character-108/run-0",
            "character-109/run-0",
            "character-110/run-0",
            "character-111/run-0",
            "character-112/run-0",
            "character-113/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 9,
          "sourceTextIds": [
            "character-123/run-0",
            "character-124/run-0",
            "character-126/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 10,
          "sourceTextIds": [
            "character-162/run-0",
            "character-163/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 11,
          "sourceTextIds": [
            "character-222/run-0",
            "character-223/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-correct-4",
          "role": "feedback",
          "language": "en",
          "readingOrder": 12,
          "sourceTextIds": [
            "character-182/run-0",
            "character-183/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-1",
          "role": "feedback",
          "language": "en",
          "readingOrder": 13,
          "sourceTextIds": [
            "character-26/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-2",
          "role": "feedback",
          "language": "en",
          "readingOrder": 14,
          "sourceTextIds": [
            "character-89/run-0",
            "character-90/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "feedback-wrong-3",
          "role": "feedback",
          "language": "en",
          "readingOrder": 15,
          "sourceTextIds": [
            "character-68/run-0"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "wrong-explanation",
          "role": "feedback",
          "language": "en",
          "readingOrder": 16,
          "sourceTextIds": [
            "character-42"
          ],
          "valueSource": "maintained-page-state"
        },
        {
          "id": "close",
          "role": "label",
          "language": "en",
          "readingOrder": 17,
          "sourceTextIds": [
            "character-44/run-0"
          ],
          "valueSource": "source-static"
        }
      ]
    },
    "text": {
      "root-title": "Addition & Subtraction: Learn It",
      "prompt": "Click the difference.",
      "top": "9.31",
      "bottom": "4.25",
      "operator": "−",
      "answer-left": "5.06",
      "answer-middle": "5.14",
      "answer-right": "5.16",
      "feedback-correct-1-rocket": "ROCKET",
      "feedback-correct-1": "Great Job!",
      "feedback-correct-2": "Good Job!",
      "feedback-correct-3": "Excellent!",
      "feedback-correct-4": "YOU GOT IT!",
      "feedback-wrong-1": "That's incorrect!",
      "feedback-wrong-2": "Incorrect!",
      "feedback-wrong-3": "Try Again!",
      "wrong-explanation": "Did you remember to borrow? Try again.",
      "close": "Close"
    },
    "prompt": {
      "tokens": [
        {
          "text": "Click ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "the ",
          "color": "rgba(0,0,0,1.0)",
          "term": false
        },
        {
          "text": "difference.",
          "color": "rgba(0,0,204,1.0)",
          "term": true
        }
      ],
      "alpha": [
        [
          1,
          0
        ],
        [
          2,
          0.16796875
        ],
        [
          3,
          0.33203125
        ],
        [
          4,
          0.5
        ],
        [
          5,
          0.66796875
        ],
        [
          6,
          0.83203125
        ],
        [
          7,
          1
        ]
      ],
      "aliasAlpha": [
        [
          1,
          0
        ],
        [
          86,
          1
        ],
        [
          87,
          0
        ],
        [
          88,
          1
        ],
        [
          89,
          0
        ],
        [
          90,
          1
        ],
        [
          91,
          0
        ],
        [
          92,
          1
        ],
        [
          93,
          0
        ]
      ],
      "aliasColor": "rgba(255,0,255,1.0)"
    },
    "mainValues": [
      {
        "id": "top",
        "character": 15,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "bottom",
        "character": 14,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      },
      {
        "id": "operator",
        "character": 16,
        "alpha": [
          [
            1,
            0
          ],
          [
            2,
            0.25
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.75
          ],
          [
            5,
            1
          ]
        ]
      }
    ],
    "ruleAlpha": [
      [
        1,
        0
      ],
      [
        2,
        0.25
      ],
      [
        3,
        0.5
      ],
      [
        4,
        0.75
      ],
      [
        5,
        1
      ]
    ],
    "answerFrames": {
      "left": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          115,
          {
            "alpha": 1,
            "travel": 0.2000793965859468
          }
        ],
        [
          116,
          {
            "alpha": 1,
            "travel": 0.39976181024215957
          }
        ],
        [
          117,
          {
            "alpha": 1,
            "travel": 0.5998412068281064
          }
        ],
        [
          118,
          {
            "alpha": 1,
            "travel": 0.7999206034140532
          }
        ],
        [
          119,
          {
            "alpha": 1,
            "travel": 1
          }
        ]
      ],
      "middle": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          109,
          {
            "alpha": 0.80078125,
            "travel": 0
          }
        ],
        [
          110,
          {
            "alpha": 0.6015625,
            "travel": 0
          }
        ],
        [
          111,
          {
            "alpha": 0.3984375,
            "travel": 0
          }
        ],
        [
          112,
          {
            "alpha": 0.19921875,
            "travel": 0
          }
        ],
        [
          113,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ],
      "right": [
        [
          1,
          {
            "alpha": 0,
            "travel": 0
          }
        ],
        [
          2,
          {
            "alpha": 0.25,
            "travel": 0
          }
        ],
        [
          3,
          {
            "alpha": 0.5,
            "travel": 0
          }
        ],
        [
          4,
          {
            "alpha": 0.75,
            "travel": 0
          }
        ],
        [
          5,
          {
            "alpha": 1,
            "travel": 0
          }
        ],
        [
          109,
          {
            "alpha": 0.80078125,
            "travel": 0
          }
        ],
        [
          110,
          {
            "alpha": 0.6015625,
            "travel": 0
          }
        ],
        [
          111,
          {
            "alpha": 0.3984375,
            "travel": 0
          }
        ],
        [
          112,
          {
            "alpha": 0.19921875,
            "travel": 0
          }
        ],
        [
          113,
          {
            "alpha": 0,
            "travel": 0
          }
        ]
      ]
    },
    "layout": {
      "choiceFigureRem": 17.5,
      "choiceWidthRem": 5.5,
      "choiceCentersRem": [
        2.75,
        8.75,
        14.75
      ],
      "mathFontRem": 1.5,
      "keyboardScrollStep": 44
    },
    "feedback": [
      {
        "id": "correct-1",
        "kind": "correct",
        "variant": 1,
        "sourceInstanceId": "sprite-259/depth-61/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-127",
        "endFrame": 26,
        "labels": [
          {
            "id": "feedback-correct-1-rocket",
            "alpha": [
              [
                1,
                0
              ],
              [
                2,
                0.01171875
              ],
              [
                3,
                0.2578125
              ],
              [
                4,
                0.5078125
              ],
              [
                5,
                0.75390625
              ],
              [
                6,
                1
              ],
              [
                10,
                0.66796875
              ],
              [
                11,
                0.33203125
              ],
              [
                12,
                0
              ]
            ],
            "sourceCharacters": [
              108,
              109,
              110,
              111,
              112,
              113
            ]
          },
          {
            "id": "feedback-correct-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                10,
                0.33203125
              ],
              [
                11,
                0.66796875
              ],
              [
                12,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              123,
              124,
              126
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-2",
        "kind": "correct",
        "variant": 2,
        "sourceInstanceId": "sprite-259/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-167",
        "endFrame": 27,
        "labels": [
          {
            "id": "feedback-correct-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                12,
                0.33203125
              ],
              [
                13,
                0.66796875
              ],
              [
                14,
                1
              ],
              [
                25,
                0.66796875
              ],
              [
                26,
                0.33203125
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              162,
              163
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-3",
        "kind": "correct",
        "variant": 3,
        "sourceInstanceId": "sprite-259/depth-129/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-225",
        "endFrame": 25,
        "labels": [
          {
            "id": "feedback-correct-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                9,
                1
              ],
              [
                21,
                0.75
              ],
              [
                22,
                0.5
              ],
              [
                23,
                0.25
              ],
              [
                24,
                0
              ]
            ],
            "sourceCharacters": [
              222,
              223
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "correct-4",
        "kind": "correct",
        "variant": 4,
        "sourceInstanceId": "sprite-259/depth-118/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-193",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-correct-4",
            "alpha": [
              [
                1,
                0
              ],
              [
                6,
                1
              ],
              [
                27,
                0.75
              ],
              [
                28,
                0.5
              ],
              [
                29,
                0.25
              ],
              [
                30,
                0
              ]
            ],
            "sourceCharacters": [
              182,
              183
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ]
        ],
        "popupFrames": [],
        "closeActivityId": null,
        "closeButton": null
      },
      {
        "id": "wrong-1",
        "kind": "wrong",
        "variant": 1,
        "sourceInstanceId": "sprite-259/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-61",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-1",
            "alpha": [
              [
                1,
                0
              ],
              [
                4,
                1
              ],
              [
                24,
                0.72265625
              ],
              [
                25,
                0.44140625
              ],
              [
                26,
                0.22265625
              ],
              [
                27,
                0
              ]
            ],
            "sourceCharacters": [
              26
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-1",
        "closeButton": 51
      },
      {
        "id": "wrong-2",
        "kind": "wrong",
        "variant": 2,
        "sourceInstanceId": "sprite-259/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-96",
        "endFrame": 31,
        "labels": [
          {
            "id": "feedback-wrong-2",
            "alpha": [
              [
                1,
                0
              ],
              [
                3,
                0.33203125
              ],
              [
                4,
                0.66796875
              ],
              [
                5,
                1
              ],
              [
                27,
                0.75
              ],
              [
                28,
                0.5
              ],
              [
                29,
                0.25
              ],
              [
                30,
                0
              ]
            ],
            "sourceCharacters": [
              89,
              90
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            14,
            0.109375
          ],
          [
            15,
            0.22265625
          ],
          [
            16,
            0.33203125
          ],
          [
            17,
            0.4453125
          ],
          [
            18,
            0.5546875
          ],
          [
            19,
            0.66796875
          ],
          [
            20,
            0.77734375
          ],
          [
            21,
            0.890625
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            14,
            23
          ]
        ],
        "closeActivityId": "close-wrong-2",
        "closeButton": 51
      },
      {
        "id": "wrong-3",
        "kind": "wrong",
        "variant": 3,
        "sourceInstanceId": "sprite-259/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-72",
        "endFrame": 28,
        "labels": [
          {
            "id": "feedback-wrong-3",
            "alpha": [
              [
                1,
                0
              ],
              [
                7,
                1
              ],
              [
                24,
                0.66796875
              ],
              [
                25,
                0.33203125
              ],
              [
                26,
                0
              ]
            ],
            "sourceCharacters": [
              68
            ]
          }
        ],
        "popupAlpha": [
          [
            1,
            0
          ],
          [
            17,
            0.16796875
          ],
          [
            18,
            0.33203125
          ],
          [
            19,
            0.5
          ],
          [
            20,
            0.66796875
          ],
          [
            21,
            0.83203125
          ],
          [
            22,
            1
          ],
          [
            23,
            0
          ]
        ],
        "popupFrames": [
          [
            17,
            23
          ]
        ],
        "closeActivityId": "close-wrong-3",
        "closeButton": 51
      }
    ],
    "activities": [
      {
        "id": "correct-1",
        "sourceInstanceId": "sprite-259/depth-61/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-127",
        "startFrame": 2,
        "endFrame": 26,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-1.mp3",
          "sha256": "ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af",
          "firstFrame": 2,
          "lastFrame": 26,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-2",
        "sourceInstanceId": "sprite-259/depth-79/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-167",
        "startFrame": 2,
        "endFrame": 27,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-2.mp3",
          "sha256": "409b8ceceb0f8193edd69b9a8e8ea361bf7fadff3d465a761bce899568f72038",
          "firstFrame": 2,
          "lastFrame": 27,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-3",
        "sourceInstanceId": "sprite-259/depth-129/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-225",
        "startFrame": 2,
        "endFrame": 25,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-3.mp3",
          "sha256": "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
          "firstFrame": 2,
          "lastFrame": 25,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "correct-4",
        "sourceInstanceId": "sprite-259/depth-118/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-193",
        "startFrame": 2,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/correct-4.mp3",
          "sha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1",
        "sourceInstanceId": "sprite-259/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-61",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-1-outro",
        "sourceInstanceId": "sprite-259/depth-21/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-61",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l01-ti-005/wrong-1.mp3",
          "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-1",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-1",
        "sourceInstanceId": "sprite-259/depth-21/generation-1/sprite-61/depth-9/generation-1/sprite-52/depth-3/generation-1/button-51/record-10",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "buttonPress": {
          "sourceButtonId": 51
        },
        "frameDomain": "sprite-50",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2",
        "sourceInstanceId": "sprite-259/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-96",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-1.mp3",
          "sha256": "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-2-outro",
        "sourceInstanceId": "sprite-259/depth-55/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-96",
        "startFrame": 23,
        "endFrame": 31,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-1.mp3",
          "sha256": "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1",
          "firstFrame": 2,
          "lastFrame": 31,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-2",
          "firstFrame": 14,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-2",
        "sourceInstanceId": "sprite-259/depth-55/generation-1/sprite-96/depth-4/generation-2/sprite-52/depth-3/generation-1/button-51/record-10",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "buttonPress": {
          "sourceButtonId": 51
        },
        "frameDomain": "sprite-50",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3",
        "sourceInstanceId": "sprite-259/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-72",
        "startFrame": 2,
        "endFrame": 22,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-2.mp3",
          "sha256": "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      },
      {
        "id": "wrong-3-outro",
        "sourceInstanceId": "sprite-259/depth-31/generation-1",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "frameDomain": "sprite-72",
        "startFrame": 23,
        "endFrame": 28,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g03-l01-ti-006/wrong-2.mp3",
          "sha256": "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0",
          "firstFrame": 2,
          "lastFrame": 28,
          "language": "shared",
          "spokenLanguage": "undetermined"
        },
        "entryFromActivity": {
          "id": "wrong-3",
          "firstFrame": 17,
          "lastFrame": 22
        }
      },
      {
        "id": "close-wrong-3",
        "sourceInstanceId": "sprite-259/depth-31/generation-1/sprite-72/depth-12/generation-1/sprite-52/depth-3/generation-1/button-51/record-10",
        "parentLifetime": {
          "firstFrame": 102,
          "lastFrameExclusive": 103
        },
        "buttonPress": {
          "sourceButtonId": 51
        },
        "frameDomain": "sprite-50",
        "startFrame": 1,
        "endFrame": 5,
        "fps": 12,
        "parentFrames": [
          102
        ],
        "audio": {
          "source": "/lesson-typography-v1/audio/course-g04-l03-gs-002/companion-ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38.mp3",
          "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
          "firstFrame": 1,
          "lastFrame": 5,
          "language": "shared",
          "spokenLanguage": "undetermined"
        }
      }
    ],
    "term": {
      "button": 8,
      "key": "Difference",
      "word": "difference",
      "entryId": "en-0155-d8a218e0d238",
      "activeFrames": [
        [
          2,
          132
        ]
      ]
    },
    "keyTerms": {
      "indexLanguage": "en",
      "sourceAssetId": "ELKTEG4.xml",
      "sourceSha256": "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      "entryIds": [
        "en-0155-d8a218e0d238"
      ]
    },
    "sourceAudio": [
      {
        "id": "source-main",
        "sourceCueId": "sprite-259-original-stream",
        "frame": 7,
        "endFrame": 132,
        "frameDomain": "sprite-259",
        "language": "en",
        "spokenLanguage": "undetermined",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-019/main.mp3",
        "sha256": "52782f780896206064b90be630cec0d160c7c33f773961ee94a568558d4f2ec9",
        "scenario": "source-static-frame"
      }
    ]
  }
] as const satisfies readonly ArithmeticChoiceConfig[];
export const G4_L4_ARITHMETIC_CHOICE_HOST_AUDIO_CANDIDATES = {
  "course-g04-l04-in-009": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l04-in-009-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-009/spanish-host-narration.mp3",
        "sha256": "47ffa0fbc05d071f5283dc6d89988175f6f50f85b61fab1857df75c9cf159f8c",
        "durationMs": 8712,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-266"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  },
  "course-g04-l04-in-013": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l04-in-013-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-013/spanish-host-narration.mp3",
        "sha256": "90b4852ec069a1d6cc6b726c3383d9f3d093a3de907dd1891e4179aadae73d61",
        "durationMs": 12000,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-191"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  },
  "course-g04-l04-in-018": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l04-in-018-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-018/spanish-host-narration.mp3",
        "sha256": "049b86231efe97c96aa073fa01250252210f96829e826d381389c50d9fd62e47",
        "durationMs": 14304,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-179"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  },
  "course-g04-l04-in-019": {
    "audioCues": [],
    "audioTracks": [
      {
        "id": "course-g04-l04-in-019-spanish-host-narration",
        "label": "Spanish Audio",
        "language": "es",
        "source": "/lesson-typography-v1/audio/course-g04-l04-in-019/spanish-host-narration.mp3",
        "sha256": "2ace900ed20e2f86a36ad95126b3927977239445cdc79a17beea331dfbca01e8",
        "durationMs": 8568,
        "activation": "user",
        "visibleWhen": [
          "es"
        ],
        "frameDomains": [
          "sprite-259"
        ],
        "timelineBehavior": "pause-while-playing"
      }
    ]
  }
} as const;
