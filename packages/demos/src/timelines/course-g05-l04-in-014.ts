import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 84..197 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_014_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN14.swf",
  swfSha256:
    "0d4d9d3492d6188d6feb669c789c109b11ca1c01d55af9276e79197c18530e89",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN14.fla",
  flaSha256:
    "1732af116948beaa59f3e92470cf17649960f2a7fc2901ac4879ed2ca9d8f440",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN14.mp3",
  associatedAudioSha256:
    "5b4f40807bad1ddd51c675ddb7a502e104884ef8ddd20fe1297874ec3f5cc408",
  spriteObjectId: 170,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_014_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-014",
  title:
    "Represent Positive and Negative Integers on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_014_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-014/canvas-renderer.js",
  assetSha256:
    "de19e523f2d368b7eefa4a31330baf990998830cea1176305e081acb118c76c8",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-170",
  mainFrameCount: 197,
  livePlaybackEndFrame: 83,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 84, lastFrame: 197, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "represent-integers-page-14-source-drawing",
      firstFrame: 1,
      lastFrame: 83,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 84..197, release handlers, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_014_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
