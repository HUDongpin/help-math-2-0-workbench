"use client";

import {createPrivateAlgL09FinalAssessmentCandidate, createPrivateAlgL09GameControllerCandidate, createPrivateAlgL09MatchingGameCandidate} from "../private-source-static-alg-l09-game-assessment-candidate";
import {SHARED_ALG001_L09_P041_CONFIG, SHARED_ALG001_L09_P041_SOURCE} from "../timelines/shared-alg001-l09-p041";

export const SHARED_ALG001_L09_P041_SOURCE_BEHAVIOR = Object.freeze({
  "questionPoolSize": 24,
  "presentedQuestionCount": 10,
  "randomizedWithoutReplacement": true,
  "answerKey": [
    1,
    2,
    3,
    4,
    3,
    3,
    4,
    4,
    3,
    2,
    4,
    1,
    2,
    2,
    1,
    1,
    1,
    1,
    2,
    2,
    4,
    3,
    4,
    3
  ],
  "questionBank": [
    {
      "questionNumber": 1,
      "prompt": "The table shows how much sports equipment Carter owns. What is the ratio of footballs to basketballs in Carter’s collection?",
      "supportingData": [
        "Baseballs: 1",
        "Basketballs: 6",
        "Footballs: 4"
      ],
      "choices": [
        "2 to 3",
        "3 to 2",
        "4 to 1",
        "6 to 4"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        19,
        23,
        22,
        24,
        25,
        26,
        27,
        28,
        34,
        38,
        42
      ]
    },
    {
      "questionNumber": 2,
      "prompt": "The table shows how many of Umi’s friends have each eye color. What is the ratio of friends with green eyes to friends with brown eyes?",
      "supportingData": [
        "Blue: 4",
        "Brown: 6",
        "Green: 2"
      ],
      "choices": [
        "1 to 2",
        "1 to 3",
        "2 to 4",
        "6 to 2"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        71,
        74,
        27,
        75,
        25,
        76,
        77,
        78,
        81,
        84,
        87
      ]
    },
    {
      "questionNumber": 3,
      "prompt": "The students in Mr. Boone’s class chose their favorite subject. The table below shows the totals for each subject. What is the ratio of students who chose math to students who chose history?",
      "supportingData": [
        "History: 8",
        "Math: 12",
        "Science: 6"
      ],
      "choices": [
        "1 to 2",
        "2 to 3",
        "3 to 2",
        "8 to 12"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        90,
        94,
        93,
        95,
        96,
        97,
        25,
        78,
        101,
        104,
        106
      ]
    },
    {
      "questionNumber": 4,
      "prompt": "The table shows how many DVDs Jill owns. What is the ratio of drama DVDs to cartoon DVDs in Jill’s collection?",
      "supportingData": [
        "Cartoons: 2",
        "Comedies: 5",
        "Dramas: 10"
      ],
      "choices": [
        "1 to 5",
        "2 to 1",
        "2 to 10",
        "5 to 1"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        109,
        112,
        77,
        113,
        114,
        115,
        116,
        118,
        120,
        124,
        126
      ]
    },
    {
      "questionNumber": 5,
      "prompt": "Which ratio is equivalent to 9/64?",
      "supportingData": [],
      "choices": [
        "1 to 7",
        "3 to 8",
        "9:64",
        "64:9"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        130,
        133,
        134,
        135,
        139,
        142,
        144
      ]
    },
    {
      "questionNumber": 6,
      "prompt": "Which ratio is equivalent to 16/25?",
      "supportingData": [],
      "choices": [
        "1:2",
        "5:4",
        "16 to 25",
        "25 to 16"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        148,
        151,
        152,
        153,
        157,
        160,
        163
      ]
    },
    {
      "questionNumber": 7,
      "prompt": "Which ratio is equivalent to 49/36?",
      "supportingData": [],
      "choices": [
        "6 to 7",
        "7 to 6",
        "36:49",
        "49:36"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        166,
        169,
        170,
        171,
        175,
        177,
        180
      ]
    },
    {
      "questionNumber": 8,
      "prompt": "Which ratio is equivalent to 43/34?",
      "supportingData": [],
      "choices": [
        "3:4",
        "21:12",
        "34 to 43",
        "43 to 34"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        166,
        186,
        187,
        188,
        191,
        194,
        197
      ]
    },
    {
      "questionNumber": 9,
      "prompt": "What is the unknown value in the proportion 5/H = 6/12?",
      "supportingData": [],
      "choices": [
        "H = 8",
        "H = 9",
        "H = 10",
        "H = 11"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        201,
        114,
        204,
        25,
        96,
        207,
        209,
        213,
        216
      ]
    },
    {
      "questionNumber": 10,
      "prompt": "What is the unknown value in the proportion 6/10 = G/25?",
      "supportingData": [],
      "choices": [
        "G = 12",
        "G = 15",
        "G = 18",
        "G = 36"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        201,
        25,
        116,
        221,
        152,
        222,
        226,
        229,
        232
      ]
    },
    {
      "questionNumber": 11,
      "prompt": "What is the unknown value in the proportion 2/10 = 10/J?",
      "supportingData": [],
      "choices": [
        "J = 2",
        "J = 10",
        "J = 25",
        "J = 50"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        201,
        77,
        116,
        237,
        239,
        241,
        245,
        248
      ]
    },
    {
      "questionNumber": 12,
      "prompt": "What is the unknown value in the proportion 4/16 = K/4?",
      "supportingData": [],
      "choices": [
        "K = 1",
        "K = 2",
        "K = 4",
        "K = 16"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        201,
        27,
        151,
        253,
        255,
        257,
        261,
        264
      ]
    },
    {
      "questionNumber": 13,
      "prompt": "The table below shows the perimeter of an equilateral triangle based on the length of the sides of the triangle. Describe this relationship between the quantities.",
      "supportingData": [
        "Side length 2 → perimeter 6",
        "Side length 4 → perimeter 12",
        "Side length 6 → perimeter 18",
        "Side length 8 → perimeter 24"
      ],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        266,
        270,
        271,
        77,
        25,
        27,
        96,
        272,
        93,
        273,
        275,
        277
      ]
    },
    {
      "questionNumber": 14,
      "prompt": "The table below shows the perimeter of a shape based on the lengths of its sides. Describe this relationship between the quantities.",
      "supportingData": [
        "Side length 2 → perimeter 10",
        "Side length 4 → perimeter 20",
        "Side length 6 → perimeter 30",
        "Side length 8 → perimeter 40"
      ],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        280,
        270,
        271,
        77,
        116,
        27,
        283,
        25,
        284,
        93,
        285,
        275,
        288
      ]
    },
    {
      "questionNumber": 15,
      "prompt": "The table below shows the area of a triangle when its base and height are the same value. Describe this relationship between the quantities.",
      "supportingData": [
        "Base and height 2 → area 2",
        "Base and height 4 → area 8",
        "Base and height 6 → area 18",
        "Base and height 8 → area 32"
      ],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        291,
        296,
        297,
        294,
        77,
        27,
        25,
        93,
        272,
        295,
        275,
        277
      ]
    },
    {
      "questionNumber": 16,
      "prompt": "The table below shows the area of a square based on the length of its sides. Describe this relationship between the quantities.",
      "supportingData": [
        "Side 2 → area 4",
        "Side 4 → area 16",
        "Side 6 → area 36",
        "Side 8 → area 64"
      ],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        304,
        306,
        305,
        77,
        27,
        25,
        93,
        151,
        170,
        134,
        308,
        277
      ]
    },
    {
      "questionNumber": 17,
      "prompt": "Lisa uses the equation Q = M + 2 to plan how many quarts (Q) of water to take on a hike based on the length of the hike in miles (M). What kind of relationship does this equation describe?",
      "supportingData": [],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        312,
        275,
        277
      ]
    },
    {
      "questionNumber": 18,
      "prompt": "Nate uses the equation M = 2P + 5 to plan how many minutes (M) he will need to complete his homework based on how many problems (P) he has to solve. What kind of relationship does this equation describe?",
      "supportingData": [],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 1,
      "sourceTextIds": [
        319,
        308,
        277
      ]
    },
    {
      "questionNumber": 19,
      "prompt": "Eric’s mom uses the equation D = 5A to decide how many dollars (D) to give Eric for each “A” he has on his report card. What kind of relationship does this equation describe?",
      "supportingData": [],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        326,
        275,
        277
      ]
    },
    {
      "questionNumber": 20,
      "prompt": "Cori uses the equation M = 3P to plan how many minutes (M) are needed to do the reading assignment based on the number pages (P) she must read. What kind of relationship does this equation describe?",
      "supportingData": [],
      "choices": [
        "non-proportional relationship",
        "proportional relationship"
      ],
      "correctOption": 2,
      "sourceTextIds": [
        333,
        275,
        277
      ]
    },
    {
      "questionNumber": 21,
      "prompt": "The scale on a map is 1 inch : 50 miles. Jones is 5 inches from Hume on the map. What is the actual distance between Jones and Hume?",
      "supportingData": [],
      "choices": [
        "10 miles",
        "25 miles",
        "200 miles",
        "250 miles"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        340,
        343,
        346,
        349,
        352
      ]
    },
    {
      "questionNumber": 22,
      "prompt": "The scale on a map is 1 inch : 40 miles. Wayne is 4 inches from Harper on the map. What is the actual distance between Wayne and Harper?",
      "supportingData": [],
      "choices": [
        "10 miles",
        "44 miles",
        "160 miles",
        "440 miles"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        355,
        343,
        360,
        363,
        367
      ]
    },
    {
      "questionNumber": 23,
      "prompt": "The scale on a map is 1 inch : 60 miles. Jenks is 3 inches from Cape on the map. What is the actual distance between Jenks and Cape?",
      "supportingData": [],
      "choices": [
        "20 miles",
        "30 miles",
        "120 miles",
        "180 miles"
      ],
      "correctOption": 4,
      "sourceTextIds": [
        369,
        373,
        376,
        379,
        382
      ]
    },
    {
      "questionNumber": 24,
      "prompt": "The scale on a map is 1 inch : 30 miles. Colby is 2 inches from Trenton on the map. What is the actual distance between Colby and Trenton?",
      "supportingData": [],
      "choices": [
        "10 miles",
        "15 miles",
        "60 miles",
        "90 miles"
      ],
      "correctOption": 3,
      "sourceTextIds": [
        384,
        343,
        390,
        393,
        396
      ]
    }
  ],
  "contentTextEvidence": [
    {
      "textId": 19,
      "value": "The table shows how much sports equipment Carter owns. What is the ratio of footballs to basketballs in Carter’s collection?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/19.txt",
      "bytes": 151,
      "sha256": "b1d92bef8d2e7effd64195295facbbda6c38f4f4a6f57f64cc97bb4f64e848ea"
    },
    {
      "textId": 22,
      "value": "1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/22.txt",
      "bytes": 1,
      "sha256": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
    },
    {
      "textId": 23,
      "value": "Baseballs",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/23.txt",
      "bytes": 9,
      "sha256": "c45d2b9ab9b2b4d1b77cd69fe7e63e0c5121df49ad969437dbdbe5c8d0154263"
    },
    {
      "textId": 24,
      "value": "Basketballs",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/24.txt",
      "bytes": 11,
      "sha256": "fca45bb7369019a3033161a9e672e8fc4ca10be1be05e9775528995d4b4cc131"
    },
    {
      "textId": 25,
      "value": "6",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/25.txt",
      "bytes": 1,
      "sha256": "e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683"
    },
    {
      "textId": 26,
      "value": "Footballs",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/26.txt",
      "bytes": 9,
      "sha256": "11d8cb0956fff514b289ed64f52861b6cb8f4fdb1a2092d37959e6019b69e36e"
    },
    {
      "textId": 27,
      "value": "4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/27.txt",
      "bytes": 1,
      "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
    },
    {
      "textId": 28,
      "value": "2 to 3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/28.txt",
      "bytes": 9,
      "sha256": "89041c8e87cf3ec84e927d3a1d8b2128ff840d0218689732ff73de5fad315661"
    },
    {
      "textId": 34,
      "value": "3 to 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/34.txt",
      "bytes": 8,
      "sha256": "8cd6e4d373f5f15bf1f5972e66763f75013485eb44ca0f8301872a3a7490a08a"
    },
    {
      "textId": 38,
      "value": "4 to 1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/38.txt",
      "bytes": 8,
      "sha256": "c345c778919b2524dc46b049977d88da14788b6ee1938010a9995a23ed4aca07"
    },
    {
      "textId": 42,
      "value": "6 to 4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/42.txt",
      "bytes": 8,
      "sha256": "40b8be0b9e44d8a2a82ba65a71d5a1ec4d8917ca6f9a4f62f1c786b1a6b37a7f"
    },
    {
      "textId": 71,
      "value": "The table shows how many of Umi’s friends have each eye color. What is the ratio of friends with green eyes to friends with brown eyes?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/71.txt",
      "bytes": 171,
      "sha256": "e329ec528cfa1a6fa95716f69e7d59a2e8f4fcb1ef56bc79816c5ae42927ffe2"
    },
    {
      "textId": 74,
      "value": "Blue",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/74.txt",
      "bytes": 4,
      "sha256": "ec7d56a01607001e6401366417c5e2eb00ffa0df17ca1a9a831e0b32c8f11bf7"
    },
    {
      "textId": 75,
      "value": "Brown",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/75.txt",
      "bytes": 5,
      "sha256": "18f285592896ec8ead1b69d90ee4080300ba8dc31665a6ad97550c8f81b15502"
    },
    {
      "textId": 76,
      "value": "Green",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/76.txt",
      "bytes": 5,
      "sha256": "d486dfbd5fb578340bccbdd0a662527eab38550648d5f44517e5ac71b8824703"
    },
    {
      "textId": 77,
      "value": "2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/77.txt",
      "bytes": 1,
      "sha256": "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35"
    },
    {
      "textId": 78,
      "value": "1 to 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/78.txt",
      "bytes": 8,
      "sha256": "f1899267f23ded8808f9536e90d7175103ba09f7269fe398e8fa20f68e1438c4"
    },
    {
      "textId": 81,
      "value": "1 to 3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/81.txt",
      "bytes": 9,
      "sha256": "e22459450067c7dcfec6bf25a204ae96405bd37625c6a074c8b4f9481d76cf72"
    },
    {
      "textId": 84,
      "value": "2 to 4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/84.txt",
      "bytes": 8,
      "sha256": "1c4283208fbb797a94ebda79c3a6f811d13b6883daedad594a03f26bf88881ba"
    },
    {
      "textId": 87,
      "value": "6 to 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/87.txt",
      "bytes": 8,
      "sha256": "e7b0e1519788118cb092528081b5396eb0ff4866d80793492b34afbcef0fb1ac"
    },
    {
      "textId": 90,
      "value": "The students in Mr. Boone’s class chose their favorite subject. The table below shows the totals for each subject. What is the ratio of students who chose math to students who chose history?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/90.txt",
      "bytes": 242,
      "sha256": "86691b2ca3d5e7bd3ce2423bf70a38ab4a66dde1b070c73c260152f842006b3c"
    },
    {
      "textId": 93,
      "value": "8",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/93.txt",
      "bytes": 1,
      "sha256": "2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3"
    },
    {
      "textId": 94,
      "value": "History",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/94.txt",
      "bytes": 7,
      "sha256": "0e769600933790607b2a13b33ddfade0fa17810eb62c3b28ee23e59516516491"
    },
    {
      "textId": 95,
      "value": "Math",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/95.txt",
      "bytes": 4,
      "sha256": "d48500aea83254706245e7d20d430468b1c00cd84c96ac175044ffe4b514a6e3"
    },
    {
      "textId": 96,
      "value": "12",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/96.txt",
      "bytes": 2,
      "sha256": "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918"
    },
    {
      "textId": 97,
      "value": "Science",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/97.txt",
      "bytes": 7,
      "sha256": "9d948c73e0ad7a5a213a5e7e00b962531ca6b07992a06bd8c2fc2ac5ae23c51b"
    },
    {
      "textId": 101,
      "value": "2 to 3",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/101.txt",
      "bytes": 8,
      "sha256": "9d6044b16a479f772f5aba95cd15cd25cf530535d14986e61b7ce9f97c07e310"
    },
    {
      "textId": 104,
      "value": "3 to 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/104.txt",
      "bytes": 9,
      "sha256": "5dd6b75f22db7827b144a07ea25046ea026ccc9198a36bb746cdc4e348a0c7fb"
    },
    {
      "textId": 106,
      "value": "8 to 12",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/106.txt",
      "bytes": 9,
      "sha256": "0f1486e2fd6ec58aec6bf0589185303709776713a4e617962957ab9dda4ab5eb"
    },
    {
      "textId": 109,
      "value": "The table shows how many DVDs Jill owns. What is the ratio of drama DVDs to cartoon DVDs in Jill’s collection?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/109.txt",
      "bytes": 137,
      "sha256": "d716c6720ee51b0a6fc50e8c6278580b66d183d156b84a9a420e435fdef68818"
    },
    {
      "textId": 112,
      "value": "Cartoons",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/112.txt",
      "bytes": 8,
      "sha256": "78ad559df0d2a7f0573b6d832e2b63e2a7095743a3c3e37334f432e6d3c47d8c"
    },
    {
      "textId": 113,
      "value": "Comedies",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/113.txt",
      "bytes": 8,
      "sha256": "3afed2fde3993d26f2f2f368c67ffc82a728b3e9ba32b84228391b9edcbec122"
    },
    {
      "textId": 114,
      "value": "5",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/114.txt",
      "bytes": 1,
      "sha256": "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
    },
    {
      "textId": 115,
      "value": "Dramas",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/115.txt",
      "bytes": 6,
      "sha256": "74754e02a16c0e0ced593ab61c536378eee6258b885f0e08ad309b225ed6d225"
    },
    {
      "textId": 116,
      "value": "10",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/116.txt",
      "bytes": 2,
      "sha256": "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5"
    },
    {
      "textId": 118,
      "value": "1 to 5",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/118.txt",
      "bytes": 9,
      "sha256": "f131128e933f4993f32d9f6a6a97cfbd30e7e3c90449dcffea5ddac9506e1fe0"
    },
    {
      "textId": 120,
      "value": "2 to 1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/120.txt",
      "bytes": 8,
      "sha256": "2b243e8666e440d512aa2d118ae4df11ba07e1d1079100e94b50ec923190bc82"
    },
    {
      "textId": 124,
      "value": "2 to 10",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/124.txt",
      "bytes": 9,
      "sha256": "a7f36db71257c143882cde0323fc3f18939c144cf22d0f3774f8fffdf23c101d"
    },
    {
      "textId": 126,
      "value": "5 to 1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/126.txt",
      "bytes": 10,
      "sha256": "1379663ccb3fc8f9f79a2aeec160269505e1b29bd7ee193740feedb2673b1dc2"
    },
    {
      "textId": 130,
      "value": "Which ratio is equivalent to ?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/130.txt",
      "bytes": 36,
      "sha256": "3ba88d2bf2ec6fec563247e90a052b3c27119123cd17001548aa73842a976859"
    },
    {
      "textId": 133,
      "value": "9",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/133.txt",
      "bytes": 1,
      "sha256": "19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7"
    },
    {
      "textId": 134,
      "value": "64",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/134.txt",
      "bytes": 2,
      "sha256": "a68b412c4282555f15546cf6e1fc42893b7e07f271557ceb021821098dd66c1b"
    },
    {
      "textId": 135,
      "value": "1 to 7",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/135.txt",
      "bytes": 8,
      "sha256": "c6b3ec4b5f3c61e0e087a9f81d37ceecca38a0c470320fdb6af41b751e3f9234"
    },
    {
      "textId": 139,
      "value": "3 to 8",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/139.txt",
      "bytes": 8,
      "sha256": "5e9b164934b294b258f1ad98fcccb421f98a23732581d0d8cb759263c11e9bfd"
    },
    {
      "textId": 142,
      "value": "9:64",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/142.txt",
      "bytes": 7,
      "sha256": "8c04f28d6ad23a8088c20c40a9609421b2f374671be5cc130efee1ece6aaab44"
    },
    {
      "textId": 144,
      "value": "64:9",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/144.txt",
      "bytes": 6,
      "sha256": "e5c5cec4b8c80f356999c6e067a2f2b52727b5d1382058cf7dcc3cf2ecf17761"
    },
    {
      "textId": 148,
      "value": "Which ratio is equivalent to ?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/148.txt",
      "bytes": 36,
      "sha256": "3ba88d2bf2ec6fec563247e90a052b3c27119123cd17001548aa73842a976859"
    },
    {
      "textId": 151,
      "value": "16",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/151.txt",
      "bytes": 2,
      "sha256": "b17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8cd9"
    },
    {
      "textId": 152,
      "value": "25",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/152.txt",
      "bytes": 2,
      "sha256": "b7a56873cd771f2c446d369b649430b65a756ba278ff97ec81bb6f55b2e73569"
    },
    {
      "textId": 153,
      "value": "1:2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/153.txt",
      "bytes": 5,
      "sha256": "049d657b53eba1f13f5a294a4fd8efc441770c5851426d6c70f70d8cd83fc833"
    },
    {
      "textId": 157,
      "value": "5:4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/157.txt",
      "bytes": 5,
      "sha256": "7854760235aab65df6eb0777f7a7ed5d4380aa40462bfb0234d31518910b8251"
    },
    {
      "textId": 160,
      "value": "16 to 25",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/160.txt",
      "bytes": 11,
      "sha256": "1549024a11afd5179d1a28d4d73bcdeef72c090936b8fdaf14bf54a688e1b6a1"
    },
    {
      "textId": 163,
      "value": "25 to 16",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/163.txt",
      "bytes": 10,
      "sha256": "fc69f96c743f816ffb8329ab8d196501d6b3ff1b483d8b823a2779e8846f2569"
    },
    {
      "textId": 166,
      "value": "Which ratio is equivalent to ?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/166.txt",
      "bytes": 36,
      "sha256": "3ba88d2bf2ec6fec563247e90a052b3c27119123cd17001548aa73842a976859"
    },
    {
      "textId": 169,
      "value": "49",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/169.txt",
      "bytes": 2,
      "sha256": "0e17daca5f3e175f448bacace3bc0da47d0655a74c8dd0dc497a3afbdad95f1f"
    },
    {
      "textId": 170,
      "value": "36",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/170.txt",
      "bytes": 2,
      "sha256": "76a50887d8f1c2e9301755428990ad81479ee21c25b43215cf524541e0503269"
    },
    {
      "textId": 171,
      "value": "6 to 7",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/171.txt",
      "bytes": 8,
      "sha256": "ec932c4f7148e993350138875ce47e0bbb2db6d31ac506efc0d6a63bb4b6d3e3"
    },
    {
      "textId": 175,
      "value": "7 to 6",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/175.txt",
      "bytes": 8,
      "sha256": "78955b1d1f333823e3120cbde8ddc926c03afd22bf5090a768a966b0c6d99d4a"
    },
    {
      "textId": 177,
      "value": "36:49",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/177.txt",
      "bytes": 7,
      "sha256": "decf447165e38a43865838fd1decf7b858398f932f09d30e9b555cfb8ace0f65"
    },
    {
      "textId": 180,
      "value": "49:36",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/180.txt",
      "bytes": 8,
      "sha256": "bc2f55bf77cbe587da40f815f634741b1903910ebf05cfe67a022615661a6ebc"
    },
    {
      "textId": 186,
      "value": "43",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/186.txt",
      "bytes": 2,
      "sha256": "44cb730c420480a0477b505ae68af508fb90f96cf0ec54c6ad16949dd427f13a"
    },
    {
      "textId": 187,
      "value": "34",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/187.txt",
      "bytes": 2,
      "sha256": "86e50149658661312a9e0b35558d84f6c6d3da797f552a9657fe0558ca40cdef"
    },
    {
      "textId": 188,
      "value": "3:4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/188.txt",
      "bytes": 5,
      "sha256": "8ac46e18fe4613a7c09de77e09fa9c87a54ff44f4dd01744c69b2b47e1cfd15b"
    },
    {
      "textId": 191,
      "value": "21:12",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/191.txt",
      "bytes": 7,
      "sha256": "59b41af0ec46115090f059d7b0b9327075ea3fa67c8846aaad0528ab09f41a10"
    },
    {
      "textId": 194,
      "value": "34 to 43",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/194.txt",
      "bytes": 10,
      "sha256": "a7f37d46bbbe7504b4b8105e1474e28e267780aa0ef2be8b6a3b4e79f39f9643"
    },
    {
      "textId": 197,
      "value": "43 to 34",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/197.txt",
      "bytes": 11,
      "sha256": "0b7dbaa7d2636bf84e399f7261adb919fa4d27aeac38596aac4d63b5df8e411c"
    },
    {
      "textId": 201,
      "value": "What is the unknown value in the proportion ?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/201.txt",
      "bytes": 59,
      "sha256": "d0cd36c7b9d9fe37e78ac1d2a4183f74bf4e29aa4142a96c7a4f209af416bd08"
    },
    {
      "textId": 204,
      "value": "H",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/204.txt",
      "bytes": 1,
      "sha256": "44bd7ae60f478fae1061e11a7739f4b94d1daf917982d33b6fc8a01a63f89c21"
    },
    {
      "textId": 207,
      "value": "H = 8",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/207.txt",
      "bytes": 7,
      "sha256": "39e5faf803d6d75a9ec53462e1cd4062687e3fd0601478f7ef1459b5c436dd90"
    },
    {
      "textId": 209,
      "value": "H = 9",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/209.txt",
      "bytes": 7,
      "sha256": "c61348a8828e18992a5cbd3a87937659faf7d2611d7fcce17fe3ca7f47281890"
    },
    {
      "textId": 213,
      "value": "H = 10",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/213.txt",
      "bytes": 9,
      "sha256": "063200d7666ecd7b4a2bf8fd5b6827b03c549da496d29abe9b4dc9d5615e8a0c"
    },
    {
      "textId": 216,
      "value": "H = 11",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/216.txt",
      "bytes": 8,
      "sha256": "99a95f33fa3e7029dfb2f6076d574ce6a577fc4ab95b75b481d903760d1c58be"
    },
    {
      "textId": 221,
      "value": "G",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/221.txt",
      "bytes": 1,
      "sha256": "333e0a1e27815d0ceee55c473fe3dc93d56c63e3bee2b3b4aee8eed6d70191a3"
    },
    {
      "textId": 222,
      "value": "G = 12",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/222.txt",
      "bytes": 8,
      "sha256": "631b62023587720325ede21d3df003cf16016f360af52a65422e504a50312767"
    },
    {
      "textId": 226,
      "value": "G = 15",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/226.txt",
      "bytes": 9,
      "sha256": "ae68a50050513c66593ed7e2ee87dde7d99ab4aa3f81e2b7554a773dbccc2ad7"
    },
    {
      "textId": 229,
      "value": "G = 18",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/229.txt",
      "bytes": 8,
      "sha256": "71117dadfe9c52035c29d8098e97e58623966f76639315642ba109ad40a296b5"
    },
    {
      "textId": 232,
      "value": "G = 36",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/232.txt",
      "bytes": 8,
      "sha256": "fe03d2a677b677d44e829989c36cbf7e1c1a2dea598a751a89944e73c4530894"
    },
    {
      "textId": 237,
      "value": "J",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/237.txt",
      "bytes": 1,
      "sha256": "6da43b944e494e885e69af021f93c6d9331c78aa228084711429160a5bbd15b5"
    },
    {
      "textId": 239,
      "value": "J = 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/239.txt",
      "bytes": 7,
      "sha256": "6a50ed599f2c01f0914105e7c255c4dc753d511dbf7f6ba3e111a71fc8aff277"
    },
    {
      "textId": 241,
      "value": "J = 10",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/241.txt",
      "bytes": 8,
      "sha256": "73eb1add70ccad014b77b3f670469b4ba33162bec34786e5d21ff0ae1ca42d49"
    },
    {
      "textId": 245,
      "value": "J = 25",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/245.txt",
      "bytes": 8,
      "sha256": "6394b101a82000c1583727682b6610c2fea03fabeba4630e28cf86700c0d128d"
    },
    {
      "textId": 248,
      "value": "J = 50",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/248.txt",
      "bytes": 9,
      "sha256": "58d61ffdc8db1689faea965a6adb6ffb87471b2d9206d7c84fc74156f9e53a94"
    },
    {
      "textId": 253,
      "value": "K",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/253.txt",
      "bytes": 1,
      "sha256": "86be9a55762d316a3026c2836d044f5fc76e34da10e1b45feee5f18be7edb177"
    },
    {
      "textId": 255,
      "value": "K = 1",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/255.txt",
      "bytes": 8,
      "sha256": "960d684eb8631545dbdf9156b03765e4b3d4faf03c076f8fa1fcd45b36a7f7dd"
    },
    {
      "textId": 257,
      "value": "K = 2",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/257.txt",
      "bytes": 7,
      "sha256": "e637e6ab3db257acd178dee6c51dcca9c3349e663177c30d386b0544e743b836"
    },
    {
      "textId": 261,
      "value": "K = 4",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/261.txt",
      "bytes": 7,
      "sha256": "34a2e63cb44b32ec8a6a483f2fea165bd8967f5839cf8e51cd87ba5e17eb2bbb"
    },
    {
      "textId": 264,
      "value": "K = 16",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/264.txt",
      "bytes": 8,
      "sha256": "e15fa97d56c1322136b8e369f60f457585e837bce5d87cf355c2ead8c588efe5"
    },
    {
      "textId": 266,
      "value": "The table below shows the perimeter of an equilateral triangle based on the length of the sides of the triangle. Describe this relationship between the quantities.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/266.txt",
      "bytes": 214,
      "sha256": "eeaf55bed4e377d4e27ef51244bfd64fbe180b29ea282723af7c7cba34c73bb9"
    },
    {
      "textId": 270,
      "value": "Side Length",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/270.txt",
      "bytes": 11,
      "sha256": "edb34de99f0bab520138abdcebe4db3c9c848b4ba55cab0963a200e21dcb5a22"
    },
    {
      "textId": 271,
      "value": "Perimeter",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/271.txt",
      "bytes": 9,
      "sha256": "e015df51e98adda5039f6a61d8a010b7bf8e50245f1b3e3dbe22501cfca06ead"
    },
    {
      "textId": 272,
      "value": "18",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/272.txt",
      "bytes": 2,
      "sha256": "4ec9599fc203d176a301536c2e091a19bc852759b255bd6818810a42c5fed14a"
    },
    {
      "textId": 273,
      "value": "24",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/273.txt",
      "bytes": 2,
      "sha256": "c2356069e9d1e79ca924378153cfbbfb4d4416b1f99d41a2940bfdb66c5319db"
    },
    {
      "textId": 275,
      "value": "non-proportional relationship",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/275.txt",
      "bytes": 31,
      "sha256": "1858aa3c60e27510a039d8c937ed3ae48f8de1ff93ad7f0a06d6ea3c514d35d1"
    },
    {
      "textId": 277,
      "value": "proportional relationship",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/277.txt",
      "bytes": 27,
      "sha256": "fc92aff7c30ea38511284fc85c7eab643ab4e0ff8ffeb8f3bce2eb0c3f59040f"
    },
    {
      "textId": 280,
      "value": "The table below shows the perimeter of a shape based on the lengths of its sides. Describe this relationship between the quantities.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/280.txt",
      "bytes": 157,
      "sha256": "81354ac3671d90b3b37a30750b450da1e0b8f2c0f4eb9d6f2fb5316886fa4dc8"
    },
    {
      "textId": 283,
      "value": "20",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/283.txt",
      "bytes": 2,
      "sha256": "f5ca38f748a1d6eaf726b8a42fb575c3c71f1864a8143301782de13da2d9202b"
    },
    {
      "textId": 284,
      "value": "30",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/284.txt",
      "bytes": 2,
      "sha256": "624b60c58c9d8bfb6ff1886c2fd605d2adeb6ea4da576068201b6c6958ce93f4"
    },
    {
      "textId": 285,
      "value": "40",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/285.txt",
      "bytes": 2,
      "sha256": "d59eced1ded07f84c145592f65bdf854358e009c5cd705f5215bf18697fed103"
    },
    {
      "textId": 288,
      "value": "proportional relationship",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/288.txt",
      "bytes": 28,
      "sha256": "2fb3fe0a64d40c9597a358010832b24cbf2526bf99bcba69b4ffa9d3bee46a20"
    },
    {
      "textId": 291,
      "value": "The table below shows the area of a triangle when its base and height are the same value. Describe this relationship between the quantities.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/291.txt",
      "bytes": 166,
      "sha256": "0fb2a39ca0017ab9d7220c11761995d54a3a8173795e9afde2fe8be59fc77637"
    },
    {
      "textId": 294,
      "value": "Area",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/294.txt",
      "bytes": 4,
      "sha256": "024dc204d7ba77a8ff9ba36a886c96335a5b4a0d2f9af2130d04bc5b39a1a764"
    },
    {
      "textId": 295,
      "value": "32",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/295.txt",
      "bytes": 2,
      "sha256": "e29c9c180c6279b0b02abd6a1801c7c04082cf486ec027aa13515e4f3884bb6b"
    },
    {
      "textId": 296,
      "value": "Base and",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/296.txt",
      "bytes": 9,
      "sha256": "d998538ec3a18911074bb4a1df1683d5145db1f773ec9fa833fb19b797fb9e04"
    },
    {
      "textId": 297,
      "value": "Height",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/297.txt",
      "bytes": 6,
      "sha256": "bfe2eca401797325bc268f93c7397554551de4274d5d73ed421ee36fe9cd3ae0"
    },
    {
      "textId": 304,
      "value": "The table below shows the area of a square based on the length of its sides. Describe this relationship between the quantities.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/304.txt",
      "bytes": 153,
      "sha256": "92e3973915fad22573c7b5652fb3ec7a958566d87116b7fcaa872404c7abd484"
    },
    {
      "textId": 305,
      "value": "Area",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/305.txt",
      "bytes": 4,
      "sha256": "024dc204d7ba77a8ff9ba36a886c96335a5b4a0d2f9af2130d04bc5b39a1a764"
    },
    {
      "textId": 306,
      "value": "Side",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/306.txt",
      "bytes": 4,
      "sha256": "630ef00b7c4f54d25b8712cb4ebb5b04264b037a8fcdac9754f21df0036881d1"
    },
    {
      "textId": 308,
      "value": "non-proportional relationship",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/308.txt",
      "bytes": 32,
      "sha256": "2fcf086ae21905d33997b83a5f1e561a38f82f373c1163bc7eccd2889198f0d5"
    },
    {
      "textId": 312,
      "value": "Lisa uses the equation Q = M + 2 to plan how many quarts (Q) of water to take on a hike based on the length of the hike in miles (M). What kind of relationship does this equation describe?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/312.txt",
      "bytes": 238,
      "sha256": "a542126bea413c09bfa58b39a651d9db428f10411d63ddc2301b16c8186e58cb"
    },
    {
      "textId": 319,
      "value": "Nate uses the equation M = 2P + 5 to plan how many minutes (M) he will need to complete his homework based on how many problems (P) he has to solve. What kind of relationship does this equation describe?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/319.txt",
      "bytes": 253,
      "sha256": "9b245b61801abdc228ce448ab3af7042d506cc8527810aa09475f7933b7f51fa"
    },
    {
      "textId": 326,
      "value": "Eric’s mom uses the equation D = 5A to decide how many dollars (D) to give Eric for each “A” he has on his report card. What kind of relationship does this equation describe?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/326.txt",
      "bytes": 230,
      "sha256": "c5e52fc6a36e75589a15023ca50bbc2cea4b0e7c289fd337118c25a68dbda11a"
    },
    {
      "textId": 333,
      "value": "Cori uses the equation M = 3P to plan how many minutes (M) are needed to do the reading assignment based on the number pages (P) she must read. What kind of relationship does this equation describe?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/333.txt",
      "bytes": 248,
      "sha256": "5c06c443393522f8d3958ba60ac39c3b9fbf6ea010e3b0ca96e691ae7bda9d50"
    },
    {
      "textId": 340,
      "value": "The scale on a map is 1 inch : 50 miles. Jones is 5 inches from Hume on the map. What is the actual distance between Jones and Hume?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/340.txt",
      "bytes": 157,
      "sha256": "058a8cf8834259227269b2d585794269196fc2990f82f13a07bad562e4e34395"
    },
    {
      "textId": 343,
      "value": "10 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/343.txt",
      "bytes": 10,
      "sha256": "b0deefcced882915d539e01e2b2a2b833110ff61c46532c52d8597c35b39ab15"
    },
    {
      "textId": 346,
      "value": "25 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/346.txt",
      "bytes": 10,
      "sha256": "72bdb885e78409684bdc772617c854b91d81638edea63898c3d9debeba8e5929"
    },
    {
      "textId": 349,
      "value": "200 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/349.txt",
      "bytes": 11,
      "sha256": "10881b7e13f53557c253c8f0d57f66992e0b5a946af6d1cd93065912269e84a0"
    },
    {
      "textId": 352,
      "value": "250 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/352.txt",
      "bytes": 11,
      "sha256": "76713f45f0c1f256ecf5caf42fbe365146e3643d3b60977ee52530bc26ae200a"
    },
    {
      "textId": 355,
      "value": "The scale on a map is 1 inch : 40 miles. Wayne is 4 inches from Harper on the map. What is the actual distance between Wayne and Harper?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/355.txt",
      "bytes": 161,
      "sha256": "41c5976f91159933aac267039deb6e08d1d144f15d6f56944a07623b1ccc5ae7"
    },
    {
      "textId": 360,
      "value": "44 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/360.txt",
      "bytes": 10,
      "sha256": "0851a146c2b8439823fcbc617e8e7f2350d8f3ec01be876f0093b73142bbfb2b"
    },
    {
      "textId": 363,
      "value": "160 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/363.txt",
      "bytes": 12,
      "sha256": "66d7872ebe87dce7182704d264006f983796ebc663a5aa5780eeb0aade0b7e96"
    },
    {
      "textId": 367,
      "value": "440 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/367.txt",
      "bytes": 11,
      "sha256": "04f1afe4a24fada463deedf8eedccfd4473c1fb293de04f58a19eed6f727b4e8"
    },
    {
      "textId": 369,
      "value": "The scale on a map is 1 inch : 60 miles. Jenks is 3 inches from Cape on the map. What is the actual distance between Jenks and Cape?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/369.txt",
      "bytes": 157,
      "sha256": "26a4c387adda77296f27074177f3569c68ed1704e72618d7a71d5cc09f34bcda"
    },
    {
      "textId": 373,
      "value": "20 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/373.txt",
      "bytes": 10,
      "sha256": "7b8bf31b95b5d97c0a3bee69606a1f230559ce8eddc08980b4ac8ca5efa1fb1c"
    },
    {
      "textId": 376,
      "value": "30 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/376.txt",
      "bytes": 10,
      "sha256": "0758876d3b73474047c382938b5cfa4e1ec28cfeec51d3298e95074f323a187c"
    },
    {
      "textId": 379,
      "value": "120 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/379.txt",
      "bytes": 12,
      "sha256": "2621dd465f87a3a39d129225bc979fbaddaadff24c1b2da1b67c8af3317e4739"
    },
    {
      "textId": 382,
      "value": "180 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/382.txt",
      "bytes": 12,
      "sha256": "42ebbac944f7b54048c50cb859171e9dd07a545f3ffc524a07b11f7193236e6c"
    },
    {
      "textId": 384,
      "value": "The scale on a map is 1 inch : 30 miles. Colby is 2 inches from Trenton on the map. What is the actual distance between Colby and Trenton?",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/384.txt",
      "bytes": 163,
      "sha256": "78a12923a7307941b15a9440d6493fb0e12b9474477ffb347289d01012585415"
    },
    {
      "textId": 390,
      "value": "15 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/390.txt",
      "bytes": 10,
      "sha256": "555d75ac19f1d3928121edc0a33667219c53972ddd417497524c5ac3d1c5c5d0"
    },
    {
      "textId": 393,
      "value": "60 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/393.txt",
      "bytes": 10,
      "sha256": "327249e6d43f04bbafb01a16ad0c95edb1c9a5e1354cc026e74cf7f2e6e61dfe"
    },
    {
      "textId": 396,
      "value": "90 miles",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/texts/396.txt",
      "bytes": 10,
      "sha256": "64d6917dc77d601747c55b18523370fcae9d53a744fffdeabbe333483d0041a3"
    }
  ],
  "sourceVisibility": {
    "finishCharacterId": 15,
    "hiddenUntilTenResponses": true,
    "maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted": true
  },
  "responseReviewImplementedInSource": true,
  "legacyBookmarkAndReportCallsBlocked": true,
  "mainScript": {
    "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-fq02-diagnostic-20260904/export/scripts/DefineSprite_855/frame_1/DoAction.as",
    "bytes": 9055,
    "sha256": "212feb5d8b87fc22bbe7e23f9a0702fa5e5a5bdde3682b470eb7696bcc1b4ce1"
  }
} as const);

const candidate = createPrivateAlgL09FinalAssessmentCandidate(SHARED_ALG001_L09_P041_CONFIG, Object.freeze({
  questions: Object.freeze([
  {
    "questionNumber": 1,
    "prompt": "The table shows how much sports equipment Carter owns. What is the ratio of footballs to basketballs in Carter’s collection?",
    "supportingData": [
      "Baseballs: 1",
      "Basketballs: 6",
      "Footballs: 4"
    ],
    "choices": [
      "2 to 3",
      "3 to 2",
      "4 to 1",
      "6 to 4"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      19,
      23,
      22,
      24,
      25,
      26,
      27,
      28,
      34,
      38,
      42
    ]
  },
  {
    "questionNumber": 2,
    "prompt": "The table shows how many of Umi’s friends have each eye color. What is the ratio of friends with green eyes to friends with brown eyes?",
    "supportingData": [
      "Blue: 4",
      "Brown: 6",
      "Green: 2"
    ],
    "choices": [
      "1 to 2",
      "1 to 3",
      "2 to 4",
      "6 to 2"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      71,
      74,
      27,
      75,
      25,
      76,
      77,
      78,
      81,
      84,
      87
    ]
  },
  {
    "questionNumber": 3,
    "prompt": "The students in Mr. Boone’s class chose their favorite subject. The table below shows the totals for each subject. What is the ratio of students who chose math to students who chose history?",
    "supportingData": [
      "History: 8",
      "Math: 12",
      "Science: 6"
    ],
    "choices": [
      "1 to 2",
      "2 to 3",
      "3 to 2",
      "8 to 12"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      90,
      94,
      93,
      95,
      96,
      97,
      25,
      78,
      101,
      104,
      106
    ]
  },
  {
    "questionNumber": 4,
    "prompt": "The table shows how many DVDs Jill owns. What is the ratio of drama DVDs to cartoon DVDs in Jill’s collection?",
    "supportingData": [
      "Cartoons: 2",
      "Comedies: 5",
      "Dramas: 10"
    ],
    "choices": [
      "1 to 5",
      "2 to 1",
      "2 to 10",
      "5 to 1"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      109,
      112,
      77,
      113,
      114,
      115,
      116,
      118,
      120,
      124,
      126
    ]
  },
  {
    "questionNumber": 5,
    "prompt": "Which ratio is equivalent to 9/64?",
    "supportingData": [],
    "choices": [
      "1 to 7",
      "3 to 8",
      "9:64",
      "64:9"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      130,
      133,
      134,
      135,
      139,
      142,
      144
    ]
  },
  {
    "questionNumber": 6,
    "prompt": "Which ratio is equivalent to 16/25?",
    "supportingData": [],
    "choices": [
      "1:2",
      "5:4",
      "16 to 25",
      "25 to 16"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      148,
      151,
      152,
      153,
      157,
      160,
      163
    ]
  },
  {
    "questionNumber": 7,
    "prompt": "Which ratio is equivalent to 49/36?",
    "supportingData": [],
    "choices": [
      "6 to 7",
      "7 to 6",
      "36:49",
      "49:36"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      166,
      169,
      170,
      171,
      175,
      177,
      180
    ]
  },
  {
    "questionNumber": 8,
    "prompt": "Which ratio is equivalent to 43/34?",
    "supportingData": [],
    "choices": [
      "3:4",
      "21:12",
      "34 to 43",
      "43 to 34"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      166,
      186,
      187,
      188,
      191,
      194,
      197
    ]
  },
  {
    "questionNumber": 9,
    "prompt": "What is the unknown value in the proportion 5/H = 6/12?",
    "supportingData": [],
    "choices": [
      "H = 8",
      "H = 9",
      "H = 10",
      "H = 11"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      201,
      114,
      204,
      25,
      96,
      207,
      209,
      213,
      216
    ]
  },
  {
    "questionNumber": 10,
    "prompt": "What is the unknown value in the proportion 6/10 = G/25?",
    "supportingData": [],
    "choices": [
      "G = 12",
      "G = 15",
      "G = 18",
      "G = 36"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      201,
      25,
      116,
      221,
      152,
      222,
      226,
      229,
      232
    ]
  },
  {
    "questionNumber": 11,
    "prompt": "What is the unknown value in the proportion 2/10 = 10/J?",
    "supportingData": [],
    "choices": [
      "J = 2",
      "J = 10",
      "J = 25",
      "J = 50"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      201,
      77,
      116,
      237,
      239,
      241,
      245,
      248
    ]
  },
  {
    "questionNumber": 12,
    "prompt": "What is the unknown value in the proportion 4/16 = K/4?",
    "supportingData": [],
    "choices": [
      "K = 1",
      "K = 2",
      "K = 4",
      "K = 16"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      201,
      27,
      151,
      253,
      255,
      257,
      261,
      264
    ]
  },
  {
    "questionNumber": 13,
    "prompt": "The table below shows the perimeter of an equilateral triangle based on the length of the sides of the triangle. Describe this relationship between the quantities.",
    "supportingData": [
      "Side length 2 → perimeter 6",
      "Side length 4 → perimeter 12",
      "Side length 6 → perimeter 18",
      "Side length 8 → perimeter 24"
    ],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      266,
      270,
      271,
      77,
      25,
      27,
      96,
      272,
      93,
      273,
      275,
      277
    ]
  },
  {
    "questionNumber": 14,
    "prompt": "The table below shows the perimeter of a shape based on the lengths of its sides. Describe this relationship between the quantities.",
    "supportingData": [
      "Side length 2 → perimeter 10",
      "Side length 4 → perimeter 20",
      "Side length 6 → perimeter 30",
      "Side length 8 → perimeter 40"
    ],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      280,
      270,
      271,
      77,
      116,
      27,
      283,
      25,
      284,
      93,
      285,
      275,
      288
    ]
  },
  {
    "questionNumber": 15,
    "prompt": "The table below shows the area of a triangle when its base and height are the same value. Describe this relationship between the quantities.",
    "supportingData": [
      "Base and height 2 → area 2",
      "Base and height 4 → area 8",
      "Base and height 6 → area 18",
      "Base and height 8 → area 32"
    ],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      291,
      296,
      297,
      294,
      77,
      27,
      25,
      93,
      272,
      295,
      275,
      277
    ]
  },
  {
    "questionNumber": 16,
    "prompt": "The table below shows the area of a square based on the length of its sides. Describe this relationship between the quantities.",
    "supportingData": [
      "Side 2 → area 4",
      "Side 4 → area 16",
      "Side 6 → area 36",
      "Side 8 → area 64"
    ],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      304,
      306,
      305,
      77,
      27,
      25,
      93,
      151,
      170,
      134,
      308,
      277
    ]
  },
  {
    "questionNumber": 17,
    "prompt": "Lisa uses the equation Q = M + 2 to plan how many quarts (Q) of water to take on a hike based on the length of the hike in miles (M). What kind of relationship does this equation describe?",
    "supportingData": [],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      312,
      275,
      277
    ]
  },
  {
    "questionNumber": 18,
    "prompt": "Nate uses the equation M = 2P + 5 to plan how many minutes (M) he will need to complete his homework based on how many problems (P) he has to solve. What kind of relationship does this equation describe?",
    "supportingData": [],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 1,
    "sourceTextIds": [
      319,
      308,
      277
    ]
  },
  {
    "questionNumber": 19,
    "prompt": "Eric’s mom uses the equation D = 5A to decide how many dollars (D) to give Eric for each “A” he has on his report card. What kind of relationship does this equation describe?",
    "supportingData": [],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      326,
      275,
      277
    ]
  },
  {
    "questionNumber": 20,
    "prompt": "Cori uses the equation M = 3P to plan how many minutes (M) are needed to do the reading assignment based on the number pages (P) she must read. What kind of relationship does this equation describe?",
    "supportingData": [],
    "choices": [
      "non-proportional relationship",
      "proportional relationship"
    ],
    "correctOption": 2,
    "sourceTextIds": [
      333,
      275,
      277
    ]
  },
  {
    "questionNumber": 21,
    "prompt": "The scale on a map is 1 inch : 50 miles. Jones is 5 inches from Hume on the map. What is the actual distance between Jones and Hume?",
    "supportingData": [],
    "choices": [
      "10 miles",
      "25 miles",
      "200 miles",
      "250 miles"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      340,
      343,
      346,
      349,
      352
    ]
  },
  {
    "questionNumber": 22,
    "prompt": "The scale on a map is 1 inch : 40 miles. Wayne is 4 inches from Harper on the map. What is the actual distance between Wayne and Harper?",
    "supportingData": [],
    "choices": [
      "10 miles",
      "44 miles",
      "160 miles",
      "440 miles"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      355,
      343,
      360,
      363,
      367
    ]
  },
  {
    "questionNumber": 23,
    "prompt": "The scale on a map is 1 inch : 60 miles. Jenks is 3 inches from Cape on the map. What is the actual distance between Jenks and Cape?",
    "supportingData": [],
    "choices": [
      "20 miles",
      "30 miles",
      "120 miles",
      "180 miles"
    ],
    "correctOption": 4,
    "sourceTextIds": [
      369,
      373,
      376,
      379,
      382
    ]
  },
  {
    "questionNumber": 24,
    "prompt": "The scale on a map is 1 inch : 30 miles. Colby is 2 inches from Trenton on the map. What is the actual distance between Colby and Trenton?",
    "supportingData": [],
    "choices": [
      "10 miles",
      "15 miles",
      "60 miles",
      "90 miles"
    ],
    "correctOption": 3,
    "sourceTextIds": [
      384,
      343,
      390,
      393,
      396
    ]
  }
] as const),
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P041_SOURCE};
export const SHARED_ALG001_L09_P041_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P041_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P041_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P041_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P041_RENDERER = candidate.Renderer;
export default animationModule;
