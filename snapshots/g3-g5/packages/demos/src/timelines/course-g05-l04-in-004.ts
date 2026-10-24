import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 308..320 place source right/wrong feedback clips whose visibility and progression depend on unresolved host and ActionScript state.";

export const COURSE_G05_L04_IN_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN04.swf",
  swfSha256:
    "afc644e764ab13e421b1c8f67c736fb4ae484056782bb56e472ac25ff6f23965",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN04.mp3",
  associatedAudioSha256:
    "28ae9419916fb64e8280960d8baaa7b1c84a28d1eee98e97a62acc63b5ce3290",
  spriteObjectId: 436,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_004_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-004",
  title:
    "Represent Decimals on a Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-004/canvas-renderer.js",
  assetSha256:
    "b278a5a691133f90e2ed28d0a33a85b95b251ad99999e9f3148c8e5957ba5526",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-436",
  mainFrameCount: 320,
  livePlaybackEndFrame: 307,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 308, lastFrame: 320, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "represent-decimals-number-line-source-drawing",
      firstFrame: 1,
      lastFrame: 307,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Glossary buttons are inert; feedback frames 308..320, host callbacks, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
