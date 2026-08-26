import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 83..178 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_013_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN13.swf",
  swfSha256:
    "6756fad74a999e190a335500e32c9bca5f2dc35baab4401897f8197bbc9df482",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN13.fla",
  flaSha256:
    "cee4765d3285890f27ada410b41f957fcc8e9fe3d5fa067ffa2c7933e216af6f",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN13.mp3",
  associatedAudioSha256:
    "0b694dfcb65129b6fb5316f3ce3a3fe0beb832ca88791e6ac4dfaa156ec0b22a",
  spriteObjectId: 170,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_013_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-013",
  title:
    "Represent Positive and Negative Integers on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_013_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-013/canvas-renderer.js",
  assetSha256:
    "3453e5275d38001acb8d20cb8a1e4da1b68a3dd345aed03033f904709e8cbb03",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-170",
  mainFrameCount: 178,
  livePlaybackEndFrame: 82,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 83, lastFrame: 178, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "represent-integers-page-13-source-drawing",
      firstFrame: 1,
      lastFrame: 82,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 83..178, release handlers, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_013_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
