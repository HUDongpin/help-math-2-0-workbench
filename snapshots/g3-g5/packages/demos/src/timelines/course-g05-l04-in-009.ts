import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_IN_009_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN09.swf",
  swfSha256:
    "5445a53852cec9ee7723e6058d3d7338a4c8a3fcf62b3575f5957de2b8c8e533",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN09.fla",
  flaSha256:
    "c6d1c3c10fa69522a7bd01b462c01ab44c85ee956cc38d7ba3cb03de2be561fb",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN09.mp3",
  associatedAudioSha256:
    "afe7e32b7d266da41b88ad326a9f574ba6d82aa32220530849db4405689efe6f",
  spriteObjectId: 29,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_IN_009_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-009",
  title:
    "Represent Fractions and Mixed Numbers on Number Lines — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-009/canvas-renderer.js",
  assetSha256:
    "0f858fe82f59aef13cdb9cb5657f74934a13a286c5d711ef3e0ec293acfbb5d8",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-29",
  mainFrameCount: 504,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "fractions-number-line-source-drawing", firstFrame: 1, lastFrame: 504}),
  ]),
  sourceControlBehaviorLabel:
    "Root host entry, embedded audio, associated audio, Spanish visual disposition, terminal behavior, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
