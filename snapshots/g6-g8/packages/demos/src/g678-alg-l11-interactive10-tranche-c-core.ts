import type {LessonHostCapabilityDescriptor} from "./lesson-host-contract";

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PREFIX =
  "g678-alg-l11-interactive10-tranche-c" as const;

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_AUDIT = Object.freeze({
  path: "catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json",
  bytes: 400065,
  sha256: "45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578",
  exactPlacementCount: 10,
  sourceAuditP0Count: 0,
  sourceAuditP1Count: 0,
} as const);

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false, registrationCandidate: false,
  productCalibrationPassed: false, browserCalibrationPassed: false,
  engineeringPreviewReady: false, authoritativeOriginalRuntime: false,
  behaviorAccepted: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  releaseEligible: false, released: false, published: false,
} as const);

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_SPEC = Object.freeze({
  audit: G678_ALG_L11_INTERACTIVE10_TRANCHE_C_AUDIT,
  exactPlacementCount: 10, currentJavaScriptImplementedPlacementCount: 10,
  candidateModuleMaturity: "private-current-js", domRendererImplemented: true,
  registrationCandidatePlacementCount: 0,
  currentJavaScriptRegisteredPlacementCount: 0,
  productCalibrationPassed: false, browserProductCalibrationPassed: false,
  wholeLessonEngineeringPreviewReady: false, scaleOutAuthorized: false,
  releaseAuthorized: false, published: false,
  acceptanceEffects: G678_ALG_L11_INTERACTIVE10_TRANCHE_C_EFFECTS,
} as const);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES = deepFreeze([
  {
    "animationId": "shared-alg001-l11-p006",
    "sectionCode": "VB",
    "sectionPageOrdinal": 2,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/VB/L11VB03.swf",
      "bytes": 60698,
      "sha256": "99e16233803ad705db3c00602aa01c987e072fe5a25b92a8f17b68a5228e464b"
    },
    "familyId": "l11-random-audio-label-timeline",
    "implementationLane": "compiler-assisted-random-audio-state-adapter",
    "mainTimeline": {
      "objectId": 50,
      "frameCount": 53,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "enableButton",
      "play"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11VB03.mp3",
      "bytes": 49392,
      "sha256": "12b83734f9549040ade1a2b17a0e52721e08e7e275f2de54a0b71355df75c78e",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "random-audio-label-timeline",
      "choiceStopFrame": 24,
      "terminalStopFrame": 53,
      "selectionScript": {
        "path": "DefineSprite_30/frame_2/DoAction.as",
        "bytes": 267,
        "sha256": "8ce47ab8e286b7de15213df8000f92d7533e6a541f10c304c4d42fe770a5b5cb"
      },
      "labelWindows": [
        {
          "label": "S1",
          "startFrame": 3,
          "returnFrame": 16,
          "soundStreamBlockCount": 15
        },
        {
          "label": "S2",
          "startFrame": 18,
          "returnFrame": 27,
          "soundStreamBlockCount": 13
        },
        {
          "label": "S3",
          "startFrame": 31,
          "returnFrame": 36,
          "soundStreamBlockCount": 9
        },
        {
          "label": "S4",
          "startFrame": 40,
          "returnFrame": 54,
          "soundStreamBlockCount": 16
        }
      ],
      "answerBindings": [
        {
          "instanceName": "Opt_1",
          "objectId": 22,
          "depths": [
            6
          ],
          "correct": true,
          "sourceTextProjection": [
            "x",
            ">",
            "5"
          ],
          "semanticProjection": "x > 5"
        },
        {
          "instanceName": "Opt_2",
          "objectId": 26,
          "depths": [
            24,
            26
          ],
          "correct": false,
          "sourceVisualProjection": "DefineShape3_25"
        }
      ],
      "correctScript": {
        "path": "DefineSprite_50/frame_24/PlaceObject2_22_6/CLIPACTIONRECORD on(release).as",
        "bytes": 84,
        "sha256": "7ac1d17838e64b4de4a5cf447ec5891398b8311d3cb401e9a43941dab8e1e05e"
      },
      "wrongScripts": [
        {
          "path": "DefineSprite_50/frame_24/PlaceObject2_26_24/CLIPACTIONRECORD on(release).as",
          "bytes": 165,
          "sha256": "ee8a2f7fea67f66c194de88f4c7aef82ab5ac11fc39f282afb15a90131ff1348"
        },
        {
          "path": "DefineSprite_50/frame_24/PlaceObject2_26_26/CLIPACTIONRECORD on(release).as",
          "bytes": 165,
          "sha256": "ee8a2f7fea67f66c194de88f4c7aef82ab5ac11fc39f282afb15a90131ff1348"
        }
      ],
      "returnScripts": [
        {
          "path": "DefineSprite_30/frame_16/DoAction.as",
          "bytes": 42,
          "sha256": "df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3"
        },
        {
          "path": "DefineSprite_30/frame_27/DoAction.as",
          "bytes": 42,
          "sha256": "df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3"
        },
        {
          "path": "DefineSprite_30/frame_36/DoAction.as",
          "bytes": 42,
          "sha256": "df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3"
        },
        {
          "path": "DefineSprite_30/frame_54/DoAction.as",
          "bytes": 42,
          "sha256": "df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3"
        }
      ],
      "embeddedAudioStructure": {
        "randomSpriteObjectId": 30,
        "randomSpriteFrameCount": 55,
        "randomSpriteAudioTagCount": 54,
        "swfSoundStreamHeadCount": 4,
        "swfSoundStreamBlockCount": 143,
        "structuralMapPassed": true,
        "listeningAcceptancePassed": false
      },
      "deterministicImplementationBoundary": "candidate adapter must inject and receipt a deterministic S1-S4 choice; Replay seed policy is not authorized by this source audit"
    }
  },
  {
    "animationId": "shared-alg001-l11-p008",
    "sectionCode": "VB",
    "sectionPageOrdinal": 4,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/VB/L11VB05.swf",
      "bytes": 337089,
      "sha256": "5875c3606fdc2e8c110ee5b3bbd24140d83dd76e5df15e7aacfc80fdaf9240e3"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 176,
      "frameCount": 178,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11VB05.mp3",
      "bytes": 73920,
      "sha256": "0e1fd5f5c334643f45edf49c016902d91c7e248e209783ece3a505458764869f",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 68,
      "geometryMode": "text-row",
      "geometrySetSha256": "ce8ce9a32cdf2224a861685b46429dd878a57302b10fdab0aff987b43e07e717",
      "tryMutationModel": "feedback-endpoint",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "This is a graph of the inequality: the absolute value of x is less than 3. Try again.",
          "afterSelection": 0,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "This is a graph of the inequality: the absolute value of x is less than 3.",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "52cd68730e9b54319a1c6ab2ac8b97453cfa07e4177be5d037124964f80187d6",
        "endpointScriptSequenceSha256": "e15e07594e6ffaf11077f371cb19f647a0e8fd3b28f9f34c48599980fa407568"
      },
      "correctScript": {
        "path": "DefineButton2_170/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_171/BUTTONCONDACTION on(release).as",
          "bytes": 363,
          "sha256": "016e76e5ee6d3d0070f2a3c70e92f8750fb93690a32148b1f19a7a05459d71d5"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "A",
            "x > 3",
            "_"
          ],
          "geometrySha256": "b06dc6df91f8832069176276ea1524d6c6465bcac5501f02e6940e72a2d49a67",
          "hitTarget": {
            "name": "AnsBtn1",
            "objectId": 171,
            "transX": -4429,
            "transY": -941,
            "placementFragmentSha256": "a3d7326fba10d56ff9fedd34ec36afa2037b01d3d23054b5a560039b658f5e91"
          },
          "visibleObjectCount": 4,
          "visibleObjectProjectionSha256": "5da4950cdca7028432d070a12451992daa6145276dbad6187eb59030db9bad48",
          "sourceTextCount": 3,
          "sourceShapeCount": 1
        },
        {
          "slot": "B",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "B",
            "_",
            "3 < x < 3"
          ],
          "geometrySha256": "2922f8f8d50f7b66053dc2bbf530582fa3612732e5426e1d1f0a190b5ef41ceb",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 170,
            "transX": -3974,
            "transY": 82,
            "placementFragmentSha256": "b7ec42ecaa5f91fe1b1bd90383683231135071ed3749b094b867ef937bdde256"
          },
          "visibleObjectCount": 4,
          "visibleObjectProjectionSha256": "edae5faf3a29ecac47557699cf4bd74e9d605fa9a68b187b94218fd383f702a6",
          "sourceTextCount": 3,
          "sourceShapeCount": 1
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "C",
            "x < 3"
          ],
          "geometrySha256": "899ebe9671de2cae598ad0eb43c389580ec1c1d3bcce3db3d74cd594e92a62d9",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 171,
            "transX": -4532,
            "transY": 1082,
            "placementFragmentSha256": "ed2bbeb4fb7b57f88e01ae6e1371aa7a70834cd5904562490d8f52e875fd0886"
          },
          "visibleObjectCount": 3,
          "visibleObjectProjectionSha256": "a95988c5820e353f5bb04f29b5168dd7e4b317c55daf0296b8917abff809ded5",
          "sourceTextCount": 2,
          "sourceShapeCount": 1
        },
        {
          "slot": "D",
          "present": false,
          "absence": {
            "unpairedNamedButtonAbsent": true,
            "visibleLabelAbsent": true
          }
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p009",
    "sectionCode": "VB",
    "sectionPageOrdinal": 5,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/VB/L11VB06.swf",
      "bytes": 259884,
      "sha256": "be0691900b2a6f0da6e991e42ddd828b5447b3e9cd4cc521861f34cbc153ae59"
    },
    "familyId": "l11-two-try-need-more-help",
    "implementationLane": "compiler-assisted-two-try-help-state-adapter",
    "mainTimeline": {
      "objectId": 65,
      "frameCount": 431,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "enableQuizButton",
      "gotoAndPlay",
      "play"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11VB06.mp3",
      "bytes": 130704,
      "sha256": "f1dd59f74dd06b0d683910c4c0a9ea2e9da3ce6861eeb12882dd5526ac2e9605",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "two-try-need-more-help",
      "mainTimeline": {
        "objectId": 65,
        "frameCount": 431
      },
      "nestedTimeline": {
        "objectId": 43,
        "frameCount": 70,
        "stopFrames": [
          1,
          64
        ],
        "closeTargetFrame": 65,
        "completionFrame": 70,
        "popupObjectId": 19
      },
      "closeButton": {
        "objectId": 15,
        "instanceName": "BtnClose",
        "script": {
          "path": "DefineButton2_15/BUTTONCONDACTION on(release).as",
          "bytes": 46,
          "sha256": "91b0d59a74d5e9c0b28a5771190db49d5fd52ebfacd9018e1f6b12f70d400f15"
        }
      },
      "sourceParentChain": {
        "mainToNested": {
          "parentObjectId": 65,
          "frame": 1,
          "depth": 36,
          "objectId": 43,
          "name": "Mc_Wrong_Feed3",
          "placementFragmentSha256": "79571d256fca212bb0b1b7c9615b14d4c59a6604c15cd66203fff82f6cc71f9f"
        },
        "nestedToPopup": {
          "parentObjectId": 43,
          "frame": 38,
          "depth": 1,
          "objectId": 19,
          "name": "Mc_Feed_Popup",
          "placementFragmentSha256": "399b028ff89040d71ae5fc7d78b8011411cdb9a40706f21a420a03b105c3afcd"
        },
        "popupFrameCount": 1,
        "popupToCloseButton": {
          "parentObjectId": 19,
          "frame": 1,
          "depth": 1,
          "objectId": 15,
          "name": "BtnClose",
          "placementFragmentSha256": "022fb0fb254916014d0d30cb83cf31062a1333fc814dd948de21ed465c6e7122"
        },
        "closeButtonDefinitionType": "DefineButton2"
      },
      "stopScripts": [
        {
          "path": "DefineSprite_43/frame_1/DoAction.as",
          "bytes": 9,
          "sha256": "3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655"
        },
        {
          "path": "DefineSprite_43/frame_64/DoAction.as",
          "bytes": 9,
          "sha256": "3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655"
        }
      ],
      "completionScript": {
        "path": "DefineSprite_43/frame_70/DoAction.as",
        "bytes": 235,
        "sha256": "806e16c9b17ac8872b22282973f851e58129094f13d83e56f7b0098102b908ce"
      },
      "exactStaticSequence": [
        "nested frame 64 stops with feedback popup present",
        "BtnClose source action requests _parent.gotoAndPlay(65)",
        "nested frame 70 returns itself to frame 1 and increments quizTryCount",
        "at quizTryCount >= 2 it resets count, clears quizSection, and plays parent"
      ],
      "runtimeParentBindingEstablished": false,
      "runtimeParentBindingBlocker": "BtnClose is physically nested in the one-frame popup sprite; authoritative runtime must establish which timeline _parent resolves before product calibration"
    }
  },
  {
    "animationId": "shared-alg001-l11-p010",
    "sectionCode": "VB",
    "sectionPageOrdinal": 6,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/VB/L11VB07.swf",
      "bytes": 224821,
      "sha256": "fbd57827ff58fa20f070aeaa4f126048b2777c702ec29eb5ca23001972642366"
    },
    "familyId": "l11-two-try-need-more-help",
    "implementationLane": "compiler-assisted-two-try-help-state-adapter",
    "mainTimeline": {
      "objectId": 75,
      "frameCount": 394,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "enableQuizButton",
      "gotoAndPlay",
      "play"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11VB07.mp3",
      "bytes": 168336,
      "sha256": "00ba0f8ba8fabd094fb73e188eab6ed21cd695f96ee98e18d3b0bdb693343e40",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "two-try-need-more-help",
      "mainTimeline": {
        "objectId": 75,
        "frameCount": 394
      },
      "nestedTimeline": {
        "objectId": 58,
        "frameCount": 70,
        "stopFrames": [
          1,
          64
        ],
        "closeTargetFrame": 65,
        "completionFrame": 70,
        "popupObjectId": 34
      },
      "closeButton": {
        "objectId": 31,
        "instanceName": "BtnClose",
        "script": {
          "path": "DefineButton2_31/BUTTONCONDACTION on(release).as",
          "bytes": 46,
          "sha256": "91b0d59a74d5e9c0b28a5771190db49d5fd52ebfacd9018e1f6b12f70d400f15"
        }
      },
      "sourceParentChain": {
        "mainToNested": {
          "parentObjectId": 75,
          "frame": 1,
          "depth": 51,
          "objectId": 58,
          "name": "Mc_Wrong_Feed3",
          "placementFragmentSha256": "38a04332783efd3a80d4739510168479cad1bf54ebe6afbbe8ab9f6a75753a2b"
        },
        "nestedToPopup": {
          "parentObjectId": 58,
          "frame": 38,
          "depth": 1,
          "objectId": 34,
          "name": "Mc_Feed_Popup",
          "placementFragmentSha256": "c649a4ced1d695342a9e476bddcf866e37eb293cd71436f6bd0190b6d57aa0aa"
        },
        "popupFrameCount": 1,
        "popupToCloseButton": {
          "parentObjectId": 34,
          "frame": 1,
          "depth": 1,
          "objectId": 31,
          "name": "BtnClose",
          "placementFragmentSha256": "048f9351d414058dab0707fab9b30a75d9108f0b77fc347b3124dbc4b6a56476"
        },
        "closeButtonDefinitionType": "DefineButton2"
      },
      "stopScripts": [
        {
          "path": "DefineSprite_58/frame_1/DoAction.as",
          "bytes": 9,
          "sha256": "3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655"
        },
        {
          "path": "DefineSprite_58/frame_64/DoAction.as",
          "bytes": 9,
          "sha256": "3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655"
        }
      ],
      "completionScript": {
        "path": "DefineSprite_58/frame_70/DoAction.as",
        "bytes": 235,
        "sha256": "806e16c9b17ac8872b22282973f851e58129094f13d83e56f7b0098102b908ce"
      },
      "exactStaticSequence": [
        "nested frame 64 stops with feedback popup present",
        "BtnClose source action requests _parent.gotoAndPlay(65)",
        "nested frame 70 returns itself to frame 1 and increments quizTryCount",
        "at quizTryCount >= 2 it resets count, clears quizSection, and plays parent"
      ],
      "runtimeParentBindingEstablished": false,
      "runtimeParentBindingBlocker": "BtnClose is physically nested in the one-frame popup sprite; authoritative runtime must establish which timeline _parent resolves before product calibration"
    }
  },
  {
    "animationId": "shared-alg001-l11-p011",
    "sectionCode": "VB",
    "sectionPageOrdinal": 7,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/VB/L11VB08.swf",
      "bytes": 398309,
      "sha256": "c7c2b870244b6723cc97a44668ef9bf0f1e594f8fb803acd61d596c1981736e2"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 185,
      "frameCount": 320,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11VB08.mp3",
      "bytes": 91728,
      "sha256": "c675d5a4409b020883b74fe44332efff932bc2ab3d8f29dbf1cf3dd85cb93100",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 87,
      "geometryMode": "text-row",
      "geometrySetSha256": "6cf4c65519ba459ed719a70d48935597cdefc4e8d8a0f871ffbed136349fe3ef",
      "tryMutationModel": "feedback-endpoint",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "Remember that when you multiply or divide by a negative number in an inequality you must reverse the direction of the inequality symbol. Try again.",
          "afterSelection": 0,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "Remember that when you multiply or divide by a negative number in an inequality you must reverse the direction of the inequality symbol.",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "6f4a6d024a50c23754f12f929ddf0d068530cbde9e2036f89ee08d00e8d9cdd5",
        "endpointScriptSequenceSha256": "e15e07594e6ffaf11077f371cb19f647a0e8fd3b28f9f34c48599980fa407568"
      },
      "correctScript": {
        "path": "DefineButton2_168/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_169/BUTTONCONDACTION on(release).as",
          "bytes": 487,
          "sha256": "2010fd0fa5ef578aea3ec0814d43f7961b3121fad63297c8f84b5221fc8b7a81"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "A",
            "x < 2",
            "_",
            "_"
          ],
          "geometrySha256": "6a73e330c631aee6090a23b3d09f8302c20b35384eb503d4327c456be313095c",
          "hitTarget": {
            "name": "AnsBtn1",
            "objectId": 169,
            "transX": -4663,
            "transY": -1698,
            "placementFragmentSha256": "8cb96960066069f73672bd6361209445e30dda22306351e35a286ecb77ef339f"
          },
          "visibleObjectCount": 5,
          "visibleObjectProjectionSha256": "d04d6dae7eaad2860aba7938069c79fe127eb593591929ab7db7cda34d642ec7",
          "sourceTextCount": 4,
          "sourceShapeCount": 1
        },
        {
          "slot": "B",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "B",
            "x < 10",
            "_",
            "_"
          ],
          "geometrySha256": "ce50b951352a89f101fdb853157ac4f55aa7e4a13adc6c32ff745982e0373a78",
          "hitTarget": {
            "name": "AnsBtn4",
            "objectId": 169,
            "transX": -4553,
            "transY": -697,
            "placementFragmentSha256": "5112758048d93f1f7ddf4943299b49b204e051e4eee3d96c0c68d1a32d35648c"
          },
          "visibleObjectCount": 5,
          "visibleObjectProjectionSha256": "ba5240206a23c1b50b1c1f6d66aaf19637fa4b5d5e5816099b0a3476a685667e",
          "sourceTextCount": 4,
          "sourceShapeCount": 1
        },
        {
          "slot": "C",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "C",
            "x > 2",
            "_"
          ],
          "geometrySha256": "836a34efa597458bcd92b38492e634b071e980742a0eee0a936cef1de151bedb",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 168,
            "transX": -4712,
            "transY": 343,
            "placementFragmentSha256": "358bcafc542afd0813c215c2333089491cb14de7982c35f21ea03714806675fc"
          },
          "visibleObjectCount": 4,
          "visibleObjectProjectionSha256": "3274ea7734dc79fa58708d145302bf2994082df7a009ffad9bdb601a37d3546a",
          "sourceTextCount": 3,
          "sourceShapeCount": 1
        },
        {
          "slot": "D",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "D",
            "x < 10",
            "_"
          ],
          "geometrySha256": "427397991e9536656a66cbced60c77fff911b7cdfd4601b2a0ba46957048d5c7",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 169,
            "transX": -4668,
            "transY": 1365,
            "placementFragmentSha256": "89e0ebedd7d3e1280162b0d8172b581b0ff7e1868c2469992d2a10d48dbfdde6"
          },
          "visibleObjectCount": 4,
          "visibleObjectProjectionSha256": "bb3957ee0ab55566ff57efc04e45dbcfa101d872bb29085a4eb4454647e4498c",
          "sourceTextCount": 3,
          "sourceShapeCount": 1
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p014",
    "sectionCode": "IN",
    "sectionPageOrdinal": 3,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/IN/L11IN04.swf",
      "bytes": 817534,
      "sha256": "06deceb1a665fce790adec00774176d48451e237e545467dabdf93b2ef7c9ce1"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 177,
      "frameCount": 220,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11IN04.mp3",
      "bytes": 166656,
      "sha256": "aed61c700c895fa013747661517c900958c75fd49c4a4fa6c589ef80f568814a",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 137,
      "geometryMode": "text-row",
      "geometrySetSha256": "f754403cc77ac4b7bafef5be5eb6dcef6c837ed04e7d735206f16a08f5274eed",
      "tryMutationModel": "selection",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "Find the symbol for greater than or equal to. Try again!",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "Find the symbol for greater than or equal to. ",
          "afterSelection": 2,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "3d8d764e395984d8e289bb8be9ca0a3b9eaa9a373b0900d788f96fd3a409a38a",
        "endpointScriptSequenceSha256": "fdb0de96b4cb28b25f297d12bfdd760535e8585f6a182bb7e9c2182779b72258"
      },
      "correctScript": {
        "path": "DefineButton2_28/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_27/BUTTONCONDACTION on(release).as",
          "bytes": 334,
          "sha256": "8e85d889529146e596e2689489d26437473cd714fa83a6144de69b5846134e10"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "A",
            "age =16"
          ],
          "geometrySha256": "c572087ad68face79bafc6ba67cd44ecc91102f0d51d71680d55b44d073ef504",
          "hitTarget": {
            "name": "AnsBtn1",
            "objectId": 27,
            "transX": -5268,
            "transY": -2022,
            "placementFragmentSha256": "4c836b60dc9b1542c99c7918ebd22110aaeb2c722c8c59896823701351e4ddbb"
          },
          "visibleObjectCount": 2,
          "visibleObjectProjectionSha256": "ccf2ce88a34274e7c8fe43c4b2f60dbe55ea84b0d10ffd5c31f8ddba8021943a",
          "sourceTextCount": 2,
          "sourceShapeCount": 0
        },
        {
          "slot": "B",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "B",
            "age <16"
          ],
          "geometrySha256": "2b91d3df1895adcf42fcd75a69277be045e75240122dc6b983297fa1a54b58c5",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 27,
            "transX": -5198,
            "transY": -870,
            "placementFragmentSha256": "31786b80069a3fd2a8e6d82622962e82939619265441180d5dfa0d555147c1be"
          },
          "visibleObjectCount": 5,
          "visibleObjectProjectionSha256": "259f4247a7e72198c7414915f231e6b01dacce3861cc12e1cdae24a71686a3fa",
          "sourceTextCount": 2,
          "sourceShapeCount": 3
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "C",
            "16 > age"
          ],
          "geometrySha256": "eb1c0d25ef812560d6141690b1df9ff877a37be4c23a6fe02a013aca4c2cc136",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 27,
            "transX": -5232,
            "transY": 258,
            "placementFragmentSha256": "6904d4ce315eb750247efcda527f7a627ca963b40cf7cd65e242b6e717f39457"
          },
          "visibleObjectCount": 2,
          "visibleObjectProjectionSha256": "9e0c9db66138b128a6882aca4654a7c4b489dded05ed5e1497ffb16866c37217",
          "sourceTextCount": 2,
          "sourceShapeCount": 0
        },
        {
          "slot": "D",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "D",
            "age >16",
            "_"
          ],
          "geometrySha256": "7d82507912359f158e2cf01913849862675af492a4287a5adc7e5e7d21ac01f0",
          "hitTarget": {
            "name": "AnsBtn4",
            "objectId": 28,
            "transX": -5284,
            "transY": 1398,
            "placementFragmentSha256": "f8ab0e8d31b962115905b9456c663cf5d7bb56fec713d7416baa59014ef26a29"
          },
          "visibleObjectCount": 4,
          "visibleObjectProjectionSha256": "791831f62fdade88db9fa7e2271f03a1da61dc5fe75fa84b5c4c24a12b6a1458",
          "sourceTextCount": 3,
          "sourceShapeCount": 1
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p019",
    "sectionCode": "IN",
    "sectionPageOrdinal": 8,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/IN/L11IN09.swf",
      "bytes": 242927,
      "sha256": "f9fe0392510752ffd9bd91b96f623b1c508b919913f8b78ace3d3ceaebaa5c63"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 205,
      "frameCount": 361,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11IN09.mp3",
      "bytes": 196560,
      "sha256": "f0942b307c8074ce9663ff106d2cf00cdd86a16118c1b86f0e61f485784f7724",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 239,
      "geometryMode": "number-line-row",
      "geometrySetSha256": "6b18ec382894fe857f7fdc17b1a6363fa212961333dae9f4ff096375b6e35d72",
      "tryMutationModel": "selection",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. Try again!!",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. ",
          "afterSelection": 2,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "0db8d19d87f624abc5718840ec1e05d0da220ae9169f8d9192d4bea01d3690c1",
        "endpointScriptSequenceSha256": "fdb0de96b4cb28b25f297d12bfdd760535e8585f6a182bb7e9c2182779b72258"
      },
      "correctScript": {
        "path": "DefineButton2_47/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_46/BUTTONCONDACTION on(release).as",
          "bytes": 449,
          "sha256": "64da16ccfd3470d2591de4600b0d0d0e3b42744e827a165e9194235fbb1d8a66"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "A"
          ],
          "geometrySha256": "ce46f5bf978110d1e96736771fe3e3b46597735e2d73bad65263f26587c7697a",
          "hitTarget": {
            "name": "AnsBtn4",
            "objectId": 47,
            "transX": -1781,
            "transY": -1042,
            "placementFragmentSha256": "26d590f16c1289d768844b2b3c20994c08daaf1e6100ec6140cf6614e391adbe"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "06c54ebc308442f1e49033319fa3f805cfad756d620ed75931fe77082795906e",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "B",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "B"
          ],
          "geometrySha256": "b658da6fd6efe1da8024262fb4ca7283b9202cea8f5afdc0308c9ee587700e75",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 46,
            "transX": -1866,
            "transY": 969,
            "placementFragmentSha256": "405b60f91dcc853c0c994946c02c0f2ade245326140a6a698a32a729bd7bb0ac"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "b38c01c068a207ed9854fa8d94aedf5f45a8982159667fad746d20be6eec815a",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "C"
          ],
          "geometrySha256": "3eb5da5e6cdcbc243985def0d6a9ded6717f5fa76a7e378153687e2d8c4a4cc6",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 46,
            "transX": -1710,
            "transY": 2997,
            "placementFragmentSha256": "c792b0765d75666d860e9a3bc1214d427d6dc5bbcebbde4b65cbc4a3b308c910"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "3407e40f730afc22fb2fa35167deb49bee5275c84336a796326975e0b7bd5416",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "D",
          "present": false,
          "absence": {
            "unpairedNamedButtonAbsent": true,
            "visibleLabelAbsent": true
          }
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p020",
    "sectionCode": "IN",
    "sectionPageOrdinal": 9,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/IN/L11IN10.swf",
      "bytes": 803422,
      "sha256": "246138f95b39f1d7e1022930e722085b6084c918d9d81f56f26d816d9a30bb2f"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 197,
      "frameCount": 225,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11IN10.mp3",
      "bytes": 122640,
      "sha256": "634e8ed85d3bb39a7964463395e9a0a813bf62b1fe22954bdcdb075a0cc2b309",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 111,
      "geometryMode": "number-line-row",
      "geometrySetSha256": "3ab47dfb1897fd0dc31674766783ffaee434f2757dc5145182c6f83979ac49e9",
      "tryMutationModel": "selection",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. Try again!",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "Simplify the inequality.  You can add or subtract any positive or negative number from the inequality.",
          "afterSelection": 2,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "ada540d495b2c7f9961d22f63ac1e84c69b3f34b3e60e83bcc9e8f1c277cb9a1",
        "endpointScriptSequenceSha256": "fdb0de96b4cb28b25f297d12bfdd760535e8585f6a182bb7e9c2182779b72258"
      },
      "correctScript": {
        "path": "DefineButton2_48/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_47/BUTTONCONDACTION on(release).as",
          "bytes": 447,
          "sha256": "9028c619979b7feda09fd08a32a1b53a826a143dcf4a4b4268fc57cfb9b952b3"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "A"
          ],
          "geometrySha256": "3760f4eb3b07dcca2dc9715f4cbe7047c116c06f9112f885be5b6426072c8fbb",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 47,
            "transX": -1866,
            "transY": -921,
            "placementFragmentSha256": "e60a27d065b6bc0ef8bd1011b799d660d60573ab1144245a75e6ee4e47e93f56"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "728b6515a727b5962daaa9258ce594342e96dc04cb05fe6fb3090caa0c7050d0",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "B",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "B"
          ],
          "geometrySha256": "a05cf84cda7a80f6a30a760625b95c19b6e054d9f8b1f4b854bcb2ff5bf0964e",
          "hitTarget": {
            "name": "AnsBtn4",
            "objectId": 48,
            "transX": -1781,
            "transY": 995,
            "placementFragmentSha256": "4a4217a3f27e9a33dc8bc87de3976643309a72291e87dd07b3cf83166bae4631"
          },
          "visibleObjectCount": 24,
          "visibleObjectProjectionSha256": "b5980ba585cc0296a988b3fa8ad402109276026f05dc6a6669b6ff3e1c3923a0",
          "sourceTextCount": 20,
          "sourceShapeCount": 4
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "C"
          ],
          "geometrySha256": "a00c1be5ce5c057b8ed2ea538ad785883efd472dab5f3bec2f6615ebb0871423",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 47,
            "transX": -1710,
            "transY": 2997,
            "placementFragmentSha256": "33cb59f7acb9932b16a73d64d0488237f17927b70033525dd0c35619a28bc5c4"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "7c0b930e7c7034889cd6f3c5122386953aa38b88e3d1545f023d7af96095b506",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "D",
          "present": false,
          "absence": {
            "unpairedNamedButtonAbsent": true,
            "visibleLabelAbsent": true
          }
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p021",
    "sectionCode": "IN",
    "sectionPageOrdinal": 10,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/IN/L11IN11.swf",
      "bytes": 216566,
      "sha256": "9cb1f5e554cfee312bc24815882c6472550666ab8837d54b4448ce78d1b384c3"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 208,
      "frameCount": 318,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "gotoAndPlay",
      "play",
      "showRightFeed",
      "showWrongFeed"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11IN11.mp3",
      "bytes": 144816,
      "sha256": "07093c86d9c6e74fce1a3addd847f6beffb2f1221183d22cdbcf2f771ed42eb5",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 121,
      "geometryMode": "number-line-row",
      "geometrySetSha256": "a3a4093e756ad438f1184d581ea53132ac1bbfb6cacb15fb437a10de8e548886",
      "tryMutationModel": "p021-split",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "Simplify the inequality. If you multiply or divide an inequality by a negative number, reverse the direction of the inequality symbol. Try again.",
          "afterSelection": 0,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "Simplify the inequality. If you multiply or divide an inequality by a negative number, reverse the direction of the inequality symbol.",
          "afterSelection": 2,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "d6928beb2acd8bc4e0784488a6adf47bf40c15755eb1754df507c835ca271340",
        "endpointScriptSequenceSha256": "1f3ebbce9906da03dcdc5c7c681627750a74bb196652cca07ab2d0223de336e7"
      },
      "correctScript": {
        "path": "DefineButton2_45/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_44/BUTTONCONDACTION on(release).as",
          "bytes": 514,
          "sha256": "994ee75ae2b10d0288f939fcb55692baac86f669526de5daa0b39574e411b93c"
        },
        {
          "path": "DefineButton2_46/BUTTONCONDACTION on(release).as",
          "bytes": 514,
          "sha256": "994ee75ae2b10d0288f939fcb55692baac86f669526de5daa0b39574e411b93c"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "A"
          ],
          "geometrySha256": "0707d806462523fb2338e0cba5208c5c8adbe68686ee7e792d8250cd2c8e777e",
          "hitTarget": {
            "name": "AnsBtn1",
            "objectId": 46,
            "transX": -1866,
            "transY": -921,
            "placementFragmentSha256": "48bfeca0a8e7ec7714dbaeacfee163629c0f9fb06e2df4cb455ec2b51b355afc"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "41754e3ce0fefdb245a2849003983e81b3841e854a20f6b7da434a41fe2fd8c1",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "B",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "B"
          ],
          "geometrySha256": "dfa8e3ee2e13b8e890dc02f87aca0a714c38a61d1eae260d9f4a46995b95d838",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 45,
            "transX": -1781,
            "transY": 995,
            "placementFragmentSha256": "316111893717114f235a0a9cc13ef1eeb11f3b677eb72593e5387b64f6249609"
          },
          "visibleObjectCount": 24,
          "visibleObjectProjectionSha256": "58646d9bd2a6bc73839a6131d322603d8c332ed3253d844fffbabd58a754ca14",
          "sourceTextCount": 20,
          "sourceShapeCount": 4
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "-9",
            "-8",
            "-7",
            "-6",
            "-5",
            "-4",
            "-3",
            "-2",
            "-1",
            "C"
          ],
          "geometrySha256": "f6de3c4427a15016d3c8304dc41847de3c7476a3e724d00678b76ee6b3e352a5",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 44,
            "transX": -1710,
            "transY": 2997,
            "placementFragmentSha256": "8b7f49bf6ac3f04ce44697e44ad9a751aac82950bf7d71bb0154d2ea9ad0fabc"
          },
          "visibleObjectCount": 23,
          "visibleObjectProjectionSha256": "120aca1ecc3b1d040e9d1dcea065309d258c5b9058006b53713c963b66b5cc70",
          "sourceTextCount": 20,
          "sourceShapeCount": 3
        },
        {
          "slot": "D",
          "present": false,
          "absence": {
            "unpairedNamedButtonAbsent": true,
            "visibleLabelAbsent": true
          }
        }
      ]
    }
  },
  {
    "animationId": "shared-alg001-l11-p025",
    "sectionCode": "IN",
    "sectionPageOrdinal": 14,
    "source": {
      "path": "G6-G8-shared/ALG001/L11/IN/L11IN15.swf",
      "bytes": 783971,
      "sha256": "875756026b4499a1efb7d52268e4ab6c668255303bac851651ffafa723242c4d"
    },
    "familyId": "l11-choice-feedback-practice",
    "implementationLane": "compiler-assisted-choice-feedback-state-machine",
    "mainTimeline": {
      "objectId": 204,
      "frameCount": 177,
      "rootFrameCount": 10,
      "fps": 12
    },
    "hostCalls": [
      "DoHyperLinks",
      "disableQuizButton",
      "enableButton",
      "enableQuizButton",
      "globalToLocal",
      "gotoAndPlay",
      "play",
      "pressFocus",
      "showRightFeed",
      "showWrongFeed",
      "startDragLoop"
    ],
    "audioCandidate": {
      "path": "G6-G8-shared/ALG001/L11/SA/L11IN15.mp3",
      "bytes": 76608,
      "sha256": "b0dff1791c118717c24f8c0455bb58cf1a28bfc5584a7935e577585d827d6efc",
      "required": null,
      "trigger": "pending-authorized-original-runtime",
      "replayBehavior": "pending-authorized-original-runtime",
      "acceptance": "candidate-index-only",
      "accepted": false
    },
    "sourceContract": {
      "kind": "choice-feedback-practice",
      "quizFrame": 68,
      "geometryMode": "text-row",
      "geometrySetSha256": "00b0f4a8e1af3987b61d32928348483d72701bbfda8914811d8ddd7af920a54d",
      "tryMutationModel": "selection",
      "literalTwoAttemptSequence": [
        {
          "attempt": 1,
          "text": "This is a graph of the inequality: The absolute value of x less than 7.  Try again!",
          "afterSelection": 1,
          "afterFeedbackEndpoint": 1,
          "resumesParent": false
        },
        {
          "attempt": 2,
          "text": "This is a graph of the inequality: The absolute value of x less than 7.",
          "afterSelection": 2,
          "afterFeedbackEndpoint": 0,
          "resumesParent": true
        }
      ],
      "tryMutationOrdering": {
        "exactOrderingPassed": true,
        "wrongScriptSequenceSha256": "07494db6e01cc637ea326797e2232ce49033c474bde8dea1a151521849e75b29",
        "endpointScriptSequenceSha256": "fdb0de96b4cb28b25f297d12bfdd760535e8585f6a182bb7e9c2182779b72258"
      },
      "correctScript": {
        "path": "DefineButton2_56/BUTTONCONDACTION on(release).as",
        "bytes": 75,
        "sha256": "91fddc130bddd9456227b9bbd9139c44ebcf7e51db046176f2f810e5e073db02"
      },
      "wrongScripts": [
        {
          "path": "DefineButton2_55/BUTTONCONDACTION on(release).as",
          "bytes": 386,
          "sha256": "284f770fff35df951115bc8aa136f6cd0d17753ac055b8be17bf9a12a39b0658"
        }
      ],
      "optionSlots": [
        {
          "slot": "A",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "A",
            "x > –7"
          ],
          "geometrySha256": "417e54bbc9ef683a8edbbea86d9cbfd2faee6e78db8b4c23d838dba23aec0ac5",
          "hitTarget": {
            "name": "AnsBtn1",
            "objectId": 55,
            "transX": -4904,
            "transY": -128,
            "placementFragmentSha256": "9d9c07d428e18fb6e1bacffd7b8f85e62689711943f4cb2a40d83e9fe5e933e5"
          },
          "visibleObjectCount": 3,
          "visibleObjectProjectionSha256": "84034d5aa08554563b54b86df0b3f524561457c8d46301d1a399bf258d19341f",
          "sourceTextCount": 2,
          "sourceShapeCount": 1
        },
        {
          "slot": "B",
          "present": true,
          "correct": true,
          "visibleTextValues": [
            "–7 < x < 7",
            "B"
          ],
          "geometrySha256": "59195554e8d9508a73266d72bb6055de316256e832790f1c9fa2cd44ae85977a",
          "hitTarget": {
            "name": "AnsBtn2",
            "objectId": 56,
            "transX": -4557,
            "transY": 960,
            "placementFragmentSha256": "48ad1fae8e965cfd5fec66978a131fccbe8b4eedecac3eafb9faef6c3e8cf7be"
          },
          "visibleObjectCount": 3,
          "visibleObjectProjectionSha256": "987005e37abdde2f9506c1bbc0616b5087168a6f87a4114d6e9da95109e5c6d7",
          "sourceTextCount": 2,
          "sourceShapeCount": 1
        },
        {
          "slot": "C",
          "present": true,
          "correct": false,
          "visibleTextValues": [
            "x < 7",
            "C"
          ],
          "geometrySha256": "41411dae4f0c0f0cf6c6d52f62f99617794d9f880d143ee60c0242f1429f3f7c",
          "hitTarget": {
            "name": "AnsBtn3",
            "objectId": 55,
            "transX": -4981,
            "transY": 2060,
            "placementFragmentSha256": "d54a22cea1972bb193ef51b3a06db11ef21dc6de6082c5ff17939d025b66360b"
          },
          "visibleObjectCount": 3,
          "visibleObjectProjectionSha256": "605beea9821bd45d1a8904eb2cfdfc3973ef0d06e9a7d58a663f16e27ff5c5a9",
          "sourceTextCount": 2,
          "sourceShapeCount": 1
        },
        {
          "slot": "D",
          "present": false,
          "absence": {
            "unpairedNamedButtonAbsent": true,
            "visibleLabelAbsent": true
          }
        }
      ]
    }
  }
] as const);

/**
 * Exact source custody for the one authorized choice help surface. The other
 * six choice pages have zero recovered help scripts and therefore have no
 * entry and no maintained help UI.
 */
export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP = deepFreeze({
  "shared-alg001-l11-p011": {
    sourceControlScripts: [
    {path: "DefineButton2_8/BUTTONCONDACTION on(release).as", bytes: 136,
      sha256: "f6250a8480166278aa29a5bddb6f82a7125f46ad583b54e378b48f1dda335116"},
    {path: "DefineButton2_48/BUTTONCONDACTION on(release).as", bytes: 136,
      sha256: "c9de0d6748b75987a4e25d7a536151e3e08da34bed790b608b92fc92af6473ec"},
    ],
    popupSprite: {objectId: 17, frameCount: 1,
      exportName: "show mc1_new_001"},
    mainTimelineFrame: 87,
    mainPlacements: {
      popup: {depth: 52, objectId: 17, name: "Mc_Popup",
        transform: {scaleX: "1.000076293945312",
          scaleY: "1.000000000000000", transX: "6845", transY: "-5871"},
        placementFragmentSha256:
          "e07a5f6aecff6afd612fc7422b3eae65ad09adde165774fadd5a4db720c52e14"},
      closeButton: {depth: 64, objectId: 48, name: "CloseBtn",
        transform: {scaleX: "1.000000000000000",
          scaleY: "1.002212524414062", transX: "6188", transY: "-2860"},
        placementFragmentSha256:
          "49671265412110e4b0ef0881a648a5c8037424cffcdd091b8428a619ad174d97"},
      openButton: {depth: 72, objectId: 8, name: "NMHBtn",
        transform: {transX: "5726", transY: "-3722"},
        placementFragmentSha256:
          "b6527d2ba0816c398d50f764e86ebbf6ac219602d61e3d20ba2725ef2123fde6"},
    },
    textPlacements: [
      {depth: 3, objectId: 10,
        transform: {transX: "-13921", transY: "3367"},
        placementFragmentSha256:
          "a98e8a7f2273e63556917e76c4104de82e96b6201c3046f8f1354388bfd1ec34",
        definitionSha256:
          "4bf1660ac5e6d487e93e44666189052a1408b9481e934d48845ed352d606fdda",
        text: {path: "10.txt", bytes: 55,
          sha256:
            "789a442b0090f9537d1efa7b97cd6075ef43001ccd8618580ffb28f47d6cee2e",
          records: ["Use the rules of inequalities to find the solution set."],
          visibleText:
            "Use the rules of inequalities to find the solution set."}},
      {depth: 4, objectId: 11,
        transform: {transX: "-13921", transY: "3961"},
        placementFragmentSha256:
          "f897ce74ca478cedd042a9826c6daab6cd8a2f2f6854a405a04e9be36ba7e752",
        definitionSha256:
          "72bb8f4be9c19b252937838c3efa27713db19f517b0e06ab7889d9aad03c64e8",
        text: {path: "11.txt", bytes: 407,
          sha256:
            "7f7f7b0c92b237a145d964ca4e70b08bfd6d242b2f594f153629d072f4f771ed",
          records: [
            "Inequality Rule 3: You can multiply or divide both sides of an",
            "inequality", "by any negative number but you must", "reverse",
            "the", "direction", "of the", "inequality", "symbol", ".",
          ],
          visibleText: "Inequality Rule 3: You can multiply or divide both " +
            "sides of an inequality by any negative number but you must " +
            "reverse the direction of the inequality symbol."}},
    ],
    visibilityLifecycle: {
      openScript: {path: "DefineButton2_8/BUTTONCONDACTION on(release).as",
        bytes: 136,
        sha256:
          "f6250a8480166278aa29a5bddb6f82a7125f46ad583b54e378b48f1dda335116"},
      closeScript: {path: "DefineButton2_48/BUTTONCONDACTION on(release).as",
        bytes: 136,
        sha256:
          "c9de0d6748b75987a4e25d7a536151e3e08da34bed790b608b92fc92af6473ec"},
      openDisablesQuiz: true, openShowsPopupAndCloseButton: true,
      closeEnablesQuiz: true, closeHidesPopupAndCloseButton: true,
    },
  },
} as const);

export type AlgL11Interactive10Page =
  (typeof G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES)[number];
export type AlgL11Interactive10ChoicePage = Extract<AlgL11Interactive10Page,
  {readonly sourceContract: {readonly kind: "choice-feedback-practice"}}> ;
export type AlgL11Interactive10TwoTryPage = Extract<AlgL11Interactive10Page,
  {readonly sourceContract: {readonly kind: "two-try-need-more-help"}}> ;

export const G678_ALG_L11_INTERACTIVE10_TRANCHE_C_HOST = Object.freeze({
  capabilities: Object.freeze(["practice-feedback"]),
  legacyOperations: "blocked", auditStorage: "memory-only",
  storesPersonalData: false,
} satisfies LessonHostCapabilityDescriptor);

if (G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.length !== 10 ||
  new Set(G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.map((page) =>
    page.animationId)).size !== 10 ||
  G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.some((page) =>
    page.audioCandidate.accepted !== false)) {
  throw new Error("ALG L11 interactive10 exact source projection drifted");
}
