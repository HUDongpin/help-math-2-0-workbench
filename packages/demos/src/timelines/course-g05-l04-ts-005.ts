import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_TS_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS05.swf",
  swfSha256:
    "ae36d9fcf75b33826f00030fb89adebac8be73dcfc3c35156bf838651534cbda",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS05.fla",
  flaSha256:
    "66b00dd9e0ff3c7616ed8fdfc54965888ee5971c82beecfbdbf3599af759963a",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS05.mp3",
  associatedAudioSha256:
    "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
  spriteObjectId: 30,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_477, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 373.85, y: 283.3}),
});

export const COURSE_G05_L04_TS_005_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-005",
  title:
    "Number Lines: 4 - Step Plan, Page 5 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-005/canvas-renderer.js",
  assetSha256:
    "8ad1d646f9ae5f2bc87a15695b19a3b8829ac07e259352622c2093705c4fbb63",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-30",
  mainFrameCount: 234,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan-page-5-source-drawing", firstFrame: 1, lastFrame: 234}),
  ]),
  sourceControlBehaviorLabel:
    "Five source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
