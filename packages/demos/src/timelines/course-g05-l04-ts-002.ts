import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_TS_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS02.swf",
  swfSha256:
    "d5937429370f18bd1ee65cc09febcc2b0e431303310b8905a3248b9146de0e2e",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS02.fla",
  flaSha256:
    "b5d4f95feb18758a08124cf6c2f46a9549d7c9a3a2c098e5f56f7554a9af95f3",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS02.mp3",
  associatedAudioSha256:
    "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
  spriteObjectId: 28,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_TS_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-002",
  title:
    "Number Lines: 4 - Step Plan, Page 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-002/canvas-renderer.js",
  assetSha256:
    "568e79042ebc4423f041868e76d6507a15dd9a2e1d05258b76ea59f86ec8a580",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-28",
  mainFrameCount: 324,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan-page-2-source-drawing", firstFrame: 1, lastFrame: 324}),
  ]),
  sourceControlBehaviorLabel:
    "Three source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
