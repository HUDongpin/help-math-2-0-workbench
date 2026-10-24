"use client";

import {createPrivateAlgL09FinalAssessmentCandidate, createPrivateAlgL09GameControllerCandidate, createPrivateAlgL09MatchingGameCandidate} from "../private-source-static-alg-l09-game-assessment-candidate";
import {SHARED_ALG001_L09_P031_CONFIG, SHARED_ALG001_L09_P031_SOURCE} from "../timelines/shared-alg001-l09-p031";

export const SHARED_ALG001_L09_P031_SOURCE_BEHAVIOR = Object.freeze({
  "levelCount": 2,
  "pairCountPerLevel": 6,
  "answerReleaseCount": 24,
  "correctScoreDelta": 10,
  "wrongScoreDelta": -2,
  "level1Cards": [
    {
      "id": "level-1-pair-1-1",
      "pairId": 1,
      "side": 1,
      "sourceCharacterId": 62,
      "sourceInstanceName": "Mc1_1",
      "label": "5 to 1",
      "equivalenceKey": "5:1",
      "sourceTextIds": [
        60
      ]
    },
    {
      "id": "level-1-pair-1-2",
      "pairId": 1,
      "side": 2,
      "sourceCharacterId": 89,
      "sourceInstanceName": "Mc1_2",
      "label": "5/1",
      "equivalenceKey": "5:1",
      "sourceTextIds": [
        87,
        88
      ]
    },
    {
      "id": "level-1-pair-2-1",
      "pairId": 2,
      "side": 1,
      "sourceCharacterId": 74,
      "sourceInstanceName": "Mc2_1",
      "label": "4:7",
      "equivalenceKey": "4:7",
      "sourceTextIds": [
        73,
        69,
        72
      ]
    },
    {
      "id": "level-1-pair-2-2",
      "pairId": 2,
      "side": 2,
      "sourceCharacterId": 85,
      "sourceInstanceName": "Mc2_2",
      "label": "4 to 7",
      "equivalenceKey": "4:7",
      "sourceTextIds": [
        84
      ]
    },
    {
      "id": "level-1-pair-3-1",
      "pairId": 3,
      "side": 1,
      "sourceCharacterId": 83,
      "sourceInstanceName": "Mc3_1",
      "label": "3/2",
      "equivalenceKey": "3:2",
      "sourceTextIds": [
        81,
        82
      ]
    },
    {
      "id": "level-1-pair-3-2",
      "pairId": 3,
      "side": 2,
      "sourceCharacterId": 94,
      "sourceInstanceName": "Mc3_2",
      "label": "3:2",
      "equivalenceKey": "3:2",
      "sourceTextIds": [
        75,
        69,
        76
      ]
    },
    {
      "id": "level-1-pair-4-1",
      "pairId": 4,
      "side": 1,
      "sourceCharacterId": 91,
      "sourceInstanceName": "Mc4_1",
      "label": "2 to 3",
      "equivalenceKey": "2:3",
      "sourceTextIds": [
        90
      ]
    },
    {
      "id": "level-1-pair-4-2",
      "pairId": 4,
      "side": 2,
      "sourceCharacterId": 77,
      "sourceInstanceName": "Mc4_2",
      "label": "2:3",
      "equivalenceKey": "2:3",
      "sourceTextIds": [
        76,
        69,
        75
      ]
    },
    {
      "id": "level-1-pair-5-1",
      "pairId": 5,
      "side": 1,
      "sourceCharacterId": 66,
      "sourceInstanceName": "Mc5_1",
      "label": "7/4",
      "equivalenceKey": "7:4",
      "sourceTextIds": [
        64,
        65
      ]
    },
    {
      "id": "level-1-pair-5-2",
      "pairId": 5,
      "side": 2,
      "sourceCharacterId": 79,
      "sourceInstanceName": "Mc5_2",
      "label": "7 to 4",
      "equivalenceKey": "7:4",
      "sourceTextIds": [
        78
      ]
    },
    {
      "id": "level-1-pair-6-1",
      "pairId": 6,
      "side": 1,
      "sourceCharacterId": 93,
      "sourceInstanceName": "Mc6_1",
      "label": "1/5",
      "equivalenceKey": "1:5",
      "sourceTextIds": [
        88,
        87
      ]
    },
    {
      "id": "level-1-pair-6-2",
      "pairId": 6,
      "side": 2,
      "sourceCharacterId": 71,
      "sourceInstanceName": "Mc6_2",
      "label": "1:5",
      "equivalenceKey": "1:5",
      "sourceTextIds": [
        70,
        69,
        68
      ]
    }
  ],
  "level2Cards": [
    {
      "id": "level-2-pair-1-1",
      "pairId": 1,
      "side": 1,
      "sourceCharacterId": 193,
      "sourceInstanceName": "Mc1_1",
      "label": "3/2",
      "equivalenceKey": "3:2",
      "sourceTextIds": [
        81,
        82
      ]
    },
    {
      "id": "level-2-pair-1-2",
      "pairId": 1,
      "side": 2,
      "sourceCharacterId": 207,
      "sourceInstanceName": "Mc1_2",
      "label": "6/4",
      "equivalenceKey": "3:2",
      "sourceTextIds": [
        206,
        65
      ]
    },
    {
      "id": "level-2-pair-2-1",
      "pairId": 2,
      "side": 1,
      "sourceCharacterId": 202,
      "sourceInstanceName": "Mc2_1",
      "label": "3/9",
      "equivalenceKey": "1:3",
      "sourceTextIds": [
        81,
        201
      ]
    },
    {
      "id": "level-2-pair-2-2",
      "pairId": 2,
      "side": 2,
      "sourceCharacterId": 212,
      "sourceInstanceName": "Mc2_2",
      "label": "4/12",
      "equivalenceKey": "1:3",
      "sourceTextIds": [
        65,
        209
      ]
    },
    {
      "id": "level-2-pair-3-1",
      "pairId": 3,
      "side": 1,
      "sourceCharacterId": 210,
      "sourceInstanceName": "Mc3_1",
      "label": "6/12",
      "equivalenceKey": "1:2",
      "sourceTextIds": [
        206,
        209
      ]
    },
    {
      "id": "level-2-pair-3-2",
      "pairId": 3,
      "side": 2,
      "sourceCharacterId": 219,
      "sourceInstanceName": "Mc3_2",
      "label": "7/14",
      "equivalenceKey": "1:2",
      "sourceTextIds": [
        64,
        218
      ]
    },
    {
      "id": "level-2-pair-4-1",
      "pairId": 4,
      "side": 1,
      "sourceCharacterId": 216,
      "sourceInstanceName": "Mc4_1",
      "label": "2/3",
      "equivalenceKey": "2:3",
      "sourceTextIds": [
        82,
        81
      ]
    },
    {
      "id": "level-2-pair-4-2",
      "pairId": 4,
      "side": 2,
      "sourceCharacterId": 214,
      "sourceInstanceName": "Mc4_2",
      "label": "10/15",
      "equivalenceKey": "2:3",
      "sourceTextIds": [
        195,
        198
      ]
    },
    {
      "id": "level-2-pair-5-1",
      "pairId": 5,
      "side": 1,
      "sourceCharacterId": 196,
      "sourceInstanceName": "Mc5_1",
      "label": "2/10",
      "equivalenceKey": "1:5",
      "sourceTextIds": [
        82,
        195
      ]
    },
    {
      "id": "level-2-pair-5-2",
      "pairId": 5,
      "side": 2,
      "sourceCharacterId": 222,
      "sourceInstanceName": "Mc5_2",
      "label": "10/50",
      "equivalenceKey": "1:5",
      "sourceTextIds": [
        195,
        221
      ]
    },
    {
      "id": "level-2-pair-6-1",
      "pairId": 6,
      "side": 1,
      "sourceCharacterId": 204,
      "sourceInstanceName": "Mc6_1",
      "label": "10/2",
      "equivalenceKey": "5:1",
      "sourceTextIds": [
        195,
        82
      ]
    },
    {
      "id": "level-2-pair-6-2",
      "pairId": 6,
      "side": 2,
      "sourceCharacterId": 199,
      "sourceInstanceName": "Mc6_2",
      "label": "15/3",
      "equivalenceKey": "5:1",
      "sourceTextIds": [
        198,
        81
      ]
    }
  ],
  "contentTextEvidence": [
    {
      "textId": 60,
      "value": "5 to 1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/60.txt",
      "bytes": 6,
      "sha256": "48febbef478a39078850de6b9f167e9de7ddb6ec7cd68a9cbcfb9044f54888bd"
    },
    {
      "textId": 64,
      "value": "7",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/64.txt",
      "bytes": 1,
      "sha256": "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451"
    },
    {
      "textId": 65,
      "value": "4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/65.txt",
      "bytes": 1,
      "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
    },
    {
      "textId": 68,
      "value": "5",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/68.txt",
      "bytes": 1,
      "sha256": "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
    },
    {
      "textId": 69,
      "value": ":",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/69.txt",
      "bytes": 1,
      "sha256": "e7ac0786668e0ff0f02b62bd04f45ff636fd82db63b1104601c975dc005f3a67"
    },
    {
      "textId": 70,
      "value": "1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/70.txt",
      "bytes": 1,
      "sha256": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
    },
    {
      "textId": 72,
      "value": "7",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/72.txt",
      "bytes": 1,
      "sha256": "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451"
    },
    {
      "textId": 73,
      "value": "4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/73.txt",
      "bytes": 1,
      "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
    },
    {
      "textId": 75,
      "value": "3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/75.txt",
      "bytes": 1,
      "sha256": "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce"
    },
    {
      "textId": 76,
      "value": "2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/76.txt",
      "bytes": 1,
      "sha256": "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"
    },
    {
      "textId": 78,
      "value": "7 to 4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/78.txt",
      "bytes": 6,
      "sha256": "9d660f2b6acf74e2961c843d0365f39c5151eea3e2c7106f5d32cf61ae6c065c"
    },
    {
      "textId": 81,
      "value": "3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/81.txt",
      "bytes": 1,
      "sha256": "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce"
    },
    {
      "textId": 82,
      "value": "2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/82.txt",
      "bytes": 1,
      "sha256": "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"
    },
    {
      "textId": 84,
      "value": "4 to 7",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/84.txt",
      "bytes": 6,
      "sha256": "5f14d7088b7518303539e0854316c7c0f3cb75d76ec7a1498f7943f408ff965f"
    },
    {
      "textId": 87,
      "value": "5",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/87.txt",
      "bytes": 1,
      "sha256": "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
    },
    {
      "textId": 88,
      "value": "1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/88.txt",
      "bytes": 1,
      "sha256": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
    },
    {
      "textId": 90,
      "value": "2 to 3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/90.txt",
      "bytes": 6,
      "sha256": "819f93eb3087ade525db168e8f3eda89f6f0f2685d57cc7964b67d9449eba32f"
    },
    {
      "textId": 195,
      "value": "10",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/195.txt",
      "bytes": 2,
      "sha256": "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5"
    },
    {
      "textId": 198,
      "value": "15",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/198.txt",
      "bytes": 2,
      "sha256": "e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb"
    },
    {
      "textId": 201,
      "value": "9",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/201.txt",
      "bytes": 1,
      "sha256": "19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7"
    },
    {
      "textId": 206,
      "value": "6",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/206.txt",
      "bytes": 1,
      "sha256": "e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683"
    },
    {
      "textId": 209,
      "value": "12",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/209.txt",
      "bytes": 2,
      "sha256": "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918"
    },
    {
      "textId": 218,
      "value": "14",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/218.txt",
      "bytes": 2,
      "sha256": "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61"
    },
    {
      "textId": 221,
      "value": "50",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/texts/221.txt",
      "bytes": 2,
      "sha256": "1a6562590ef19d1045d06c4055742d38288e9e6dcd71ccde5cee80f1d5a774eb"
    }
  ],
  "sourceVisibility": {
    "popupCharacterId": 26,
    "hiddenByDefault": true,
    "frameScripts": [
      {
        "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_1/DoAction.as",
        "bytes": 346,
        "sha256": "f23227da5dfc87ee28e7cce4ec91d4bc989e4416a78a8ae211d33a512acdbf6b"
      },
      {
        "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/DoAction.as",
        "bytes": 788,
        "sha256": "c02d0b21a0fffcb74cb7187a83715d8c7439829c8cd5b446b65154da8ca479c4"
      },
      {
        "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/DoAction.as",
        "bytes": 788,
        "sha256": "1aaa78f3008f7d8142ce0bd3b3f7c389099bb5df6e11844436f7ca5cc36a7161"
      }
    ],
    "maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted": true
  },
  "releaseScripts": [
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_62_31/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_66_35/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_71_41/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_74_47/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_77_53/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_79_59/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_83_63/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_85_69/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_89_73/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_91_79/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_93_83/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_2/PlaceObject2_94_89/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_193_30/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_196_36/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_199_42/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_202_48/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_204_54/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_207_60/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_210_66/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_212_72/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_214_78/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_216_84/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_219_90/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    },
    {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs03-diagnostic-20260904/export/scripts/DefineSprite_227/frame_4/PlaceObject2_222_96/CLIPACTIONRECORD on(release).as",
      "bytes": 4937,
      "sha256": "f39b7bc9e865752b35736f6cd782efb4394c62f7ee19df3bc4daf76a5ec3e6cb"
    }
  ]
} as const);

const candidate = createPrivateAlgL09MatchingGameCandidate(SHARED_ALG001_L09_P031_CONFIG, Object.freeze({
  level1Cards: Object.freeze([
  {
    "id": "level-1-pair-1-1",
    "pairId": 1,
    "side": 1,
    "sourceCharacterId": 62,
    "sourceInstanceName": "Mc1_1",
    "label": "5 to 1",
    "equivalenceKey": "5:1",
    "sourceTextIds": [
      60
    ]
  },
  {
    "id": "level-1-pair-1-2",
    "pairId": 1,
    "side": 2,
    "sourceCharacterId": 89,
    "sourceInstanceName": "Mc1_2",
    "label": "5/1",
    "equivalenceKey": "5:1",
    "sourceTextIds": [
      87,
      88
    ]
  },
  {
    "id": "level-1-pair-2-1",
    "pairId": 2,
    "side": 1,
    "sourceCharacterId": 74,
    "sourceInstanceName": "Mc2_1",
    "label": "4:7",
    "equivalenceKey": "4:7",
    "sourceTextIds": [
      73,
      69,
      72
    ]
  },
  {
    "id": "level-1-pair-2-2",
    "pairId": 2,
    "side": 2,
    "sourceCharacterId": 85,
    "sourceInstanceName": "Mc2_2",
    "label": "4 to 7",
    "equivalenceKey": "4:7",
    "sourceTextIds": [
      84
    ]
  },
  {
    "id": "level-1-pair-3-1",
    "pairId": 3,
    "side": 1,
    "sourceCharacterId": 83,
    "sourceInstanceName": "Mc3_1",
    "label": "3/2",
    "equivalenceKey": "3:2",
    "sourceTextIds": [
      81,
      82
    ]
  },
  {
    "id": "level-1-pair-3-2",
    "pairId": 3,
    "side": 2,
    "sourceCharacterId": 94,
    "sourceInstanceName": "Mc3_2",
    "label": "3:2",
    "equivalenceKey": "3:2",
    "sourceTextIds": [
      75,
      69,
      76
    ]
  },
  {
    "id": "level-1-pair-4-1",
    "pairId": 4,
    "side": 1,
    "sourceCharacterId": 91,
    "sourceInstanceName": "Mc4_1",
    "label": "2 to 3",
    "equivalenceKey": "2:3",
    "sourceTextIds": [
      90
    ]
  },
  {
    "id": "level-1-pair-4-2",
    "pairId": 4,
    "side": 2,
    "sourceCharacterId": 77,
    "sourceInstanceName": "Mc4_2",
    "label": "2:3",
    "equivalenceKey": "2:3",
    "sourceTextIds": [
      76,
      69,
      75
    ]
  },
  {
    "id": "level-1-pair-5-1",
    "pairId": 5,
    "side": 1,
    "sourceCharacterId": 66,
    "sourceInstanceName": "Mc5_1",
    "label": "7/4",
    "equivalenceKey": "7:4",
    "sourceTextIds": [
      64,
      65
    ]
  },
  {
    "id": "level-1-pair-5-2",
    "pairId": 5,
    "side": 2,
    "sourceCharacterId": 79,
    "sourceInstanceName": "Mc5_2",
    "label": "7 to 4",
    "equivalenceKey": "7:4",
    "sourceTextIds": [
      78
    ]
  },
  {
    "id": "level-1-pair-6-1",
    "pairId": 6,
    "side": 1,
    "sourceCharacterId": 93,
    "sourceInstanceName": "Mc6_1",
    "label": "1/5",
    "equivalenceKey": "1:5",
    "sourceTextIds": [
      88,
      87
    ]
  },
  {
    "id": "level-1-pair-6-2",
    "pairId": 6,
    "side": 2,
    "sourceCharacterId": 71,
    "sourceInstanceName": "Mc6_2",
    "label": "1:5",
    "equivalenceKey": "1:5",
    "sourceTextIds": [
      70,
      69,
      68
    ]
  }
] as const),
  level2Cards: Object.freeze([
  {
    "id": "level-2-pair-1-1",
    "pairId": 1,
    "side": 1,
    "sourceCharacterId": 193,
    "sourceInstanceName": "Mc1_1",
    "label": "3/2",
    "equivalenceKey": "3:2",
    "sourceTextIds": [
      81,
      82
    ]
  },
  {
    "id": "level-2-pair-1-2",
    "pairId": 1,
    "side": 2,
    "sourceCharacterId": 207,
    "sourceInstanceName": "Mc1_2",
    "label": "6/4",
    "equivalenceKey": "3:2",
    "sourceTextIds": [
      206,
      65
    ]
  },
  {
    "id": "level-2-pair-2-1",
    "pairId": 2,
    "side": 1,
    "sourceCharacterId": 202,
    "sourceInstanceName": "Mc2_1",
    "label": "3/9",
    "equivalenceKey": "1:3",
    "sourceTextIds": [
      81,
      201
    ]
  },
  {
    "id": "level-2-pair-2-2",
    "pairId": 2,
    "side": 2,
    "sourceCharacterId": 212,
    "sourceInstanceName": "Mc2_2",
    "label": "4/12",
    "equivalenceKey": "1:3",
    "sourceTextIds": [
      65,
      209
    ]
  },
  {
    "id": "level-2-pair-3-1",
    "pairId": 3,
    "side": 1,
    "sourceCharacterId": 210,
    "sourceInstanceName": "Mc3_1",
    "label": "6/12",
    "equivalenceKey": "1:2",
    "sourceTextIds": [
      206,
      209
    ]
  },
  {
    "id": "level-2-pair-3-2",
    "pairId": 3,
    "side": 2,
    "sourceCharacterId": 219,
    "sourceInstanceName": "Mc3_2",
    "label": "7/14",
    "equivalenceKey": "1:2",
    "sourceTextIds": [
      64,
      218
    ]
  },
  {
    "id": "level-2-pair-4-1",
    "pairId": 4,
    "side": 1,
    "sourceCharacterId": 216,
    "sourceInstanceName": "Mc4_1",
    "label": "2/3",
    "equivalenceKey": "2:3",
    "sourceTextIds": [
      82,
      81
    ]
  },
  {
    "id": "level-2-pair-4-2",
    "pairId": 4,
    "side": 2,
    "sourceCharacterId": 214,
    "sourceInstanceName": "Mc4_2",
    "label": "10/15",
    "equivalenceKey": "2:3",
    "sourceTextIds": [
      195,
      198
    ]
  },
  {
    "id": "level-2-pair-5-1",
    "pairId": 5,
    "side": 1,
    "sourceCharacterId": 196,
    "sourceInstanceName": "Mc5_1",
    "label": "2/10",
    "equivalenceKey": "1:5",
    "sourceTextIds": [
      82,
      195
    ]
  },
  {
    "id": "level-2-pair-5-2",
    "pairId": 5,
    "side": 2,
    "sourceCharacterId": 222,
    "sourceInstanceName": "Mc5_2",
    "label": "10/50",
    "equivalenceKey": "1:5",
    "sourceTextIds": [
      195,
      221
    ]
  },
  {
    "id": "level-2-pair-6-1",
    "pairId": 6,
    "side": 1,
    "sourceCharacterId": 204,
    "sourceInstanceName": "Mc6_1",
    "label": "10/2",
    "equivalenceKey": "5:1",
    "sourceTextIds": [
      195,
      82
    ]
  },
  {
    "id": "level-2-pair-6-2",
    "pairId": 6,
    "side": 2,
    "sourceCharacterId": 199,
    "sourceInstanceName": "Mc6_2",
    "label": "15/3",
    "equivalenceKey": "5:1",
    "sourceTextIds": [
      198,
      81
    ]
  }
] as const),
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P031_SOURCE};
export const SHARED_ALG001_L09_P031_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P031_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P031_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P031_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P031_RENDERER = candidate.Renderer;
export default animationModule;
