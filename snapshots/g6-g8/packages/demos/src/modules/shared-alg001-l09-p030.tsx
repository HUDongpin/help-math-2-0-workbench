"use client";

import {createPrivateAlgL09FinalAssessmentCandidate, createPrivateAlgL09GameControllerCandidate, createPrivateAlgL09MatchingGameCandidate} from "../private-source-static-alg-l09-game-assessment-candidate";
import {SHARED_ALG001_L09_P030_CONFIG, SHARED_ALG001_L09_P030_SOURCE} from "../timelines/shared-alg001-l09-p030";

export const SHARED_ALG001_L09_P030_SOURCE_BEHAVIOR = Object.freeze({
  "levelCount": 2,
  "targetAnimationId": "shared-alg001-l09-p031",
  "legacyTarget": "L9GS03",
  "sourceStopFrame": 748,
  "sourceResumeFrame": 749,
  "directions": [
    {
      "textId": 19,
      "text": "In the Level 1 game, match ratios that are written in different forms. In the Level 2 game, match ratios that are in proportion to each other."
    },
    {
      "textId": 20,
      "text": "Click one box then find the next box that matches and click it."
    },
    {
      "textId": 25,
      "text": "For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score. Correct answers will reveal a picture and music."
    },
    {
      "textId": 21,
      "text": "When you are ready to play, choose a level and then click Start to begin the Ratio Match Game."
    }
  ],
  "contentTextEvidence": [
    {
      "textId": 19,
      "value": "In the Level 1 game, match ratios that are written in different forms. In the Level 2 game, match ratios that are in proportion to each other.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/texts/19.txt",
      "bytes": 268,
      "sha256": "59ec0adcb64f8ea8fa1fa9ea6a02d717bba1479063b5ac8cb5347a676a6c7e19"
    },
    {
      "textId": 20,
      "value": "Click one box then find the next box that matches and click it.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/texts/20.txt",
      "bytes": 63,
      "sha256": "806c6cc5742a294191231c98451d2507a3c37f2cf815dff9dbdba0ae279a0f99"
    },
    {
      "textId": 21,
      "value": "When you are ready to play, choose a level and then click Start to begin the Ratio Match Game.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/texts/21.txt",
      "bytes": 118,
      "sha256": "f9927311dc87f61871b745b94479d01f1ad5eb0ddd84712b57502fe757520ba0"
    },
    {
      "textId": 25,
      "value": "For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score. Correct answers will reveal a picture and music.",
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/texts/25.txt",
      "bytes": 227,
      "sha256": "feb156babed3099acf783e99858ef94dd642de0ee58be50c2957df095df890d1"
    }
  ],
  "sourceVisibility": {
    "maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted": true
  },
  "scripts": {
    "level1": {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/scripts/DefineSprite_140/frame_748/PlaceObject2_132_55/CLIPACTIONRECORD on(release).as",
      "bytes": 138,
      "sha256": "25668139a9d5d68064702d01940b6411d9bebb854f229d296687d9420089b266"
    },
    "level2": {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/scripts/DefineSprite_140/frame_748/PlaceObject2_135_58/CLIPACTIONRECORD on(release).as",
      "bytes": 138,
      "sha256": "b4458643caa0b6a57e665c4bb456b138c232a580ece915ac1692da5ed992ed5a"
    },
    "start": {
      "path": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/work/g678-shared-page-factory/g678-alg-l09-gs02-diagnostic-20260904/export/scripts/DefineSprite_140/frame_748/PlaceObject2_139_62/CLIPACTIONRECORD on(release).as",
      "bytes": 258,
      "sha256": "861d7c84d4f60cb610be8b46eb39565a61328a05238e3160fa9c78536eae795f"
    }
  }
} as const);

const candidate = createPrivateAlgL09GameControllerCandidate(SHARED_ALG001_L09_P030_CONFIG, Object.freeze({
  directions: Object.freeze([
  {
    "textId": 19,
    "text": "In the Level 1 game, match ratios that are written in different forms. In the Level 2 game, match ratios that are in proportion to each other."
  },
  {
    "textId": 20,
    "text": "Click one box then find the next box that matches and click it."
  },
  {
    "textId": 25,
    "text": "For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score. Correct answers will reveal a picture and music."
  },
  {
    "textId": 21,
    "text": "When you are ready to play, choose a level and then click Start to begin the Ratio Match Game."
  }
] as const),
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P030_SOURCE};
export const SHARED_ALG001_L09_P030_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P030_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P030_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P030_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P030_RENDERER = candidate.Renderer;
export default animationModule;
