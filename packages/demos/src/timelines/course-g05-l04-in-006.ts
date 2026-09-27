import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 414..464 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN06.swf",
  swfSha256:
    "2b318a5873caacefb0a1f1fdd62457b8e77e67f8f99028eaaeae5ad9ad59bdd0",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN06.fla",
  flaSha256:
    "9f4ba2f90d66c478cb2c991bf9a92b0420461c8f11a7db6f0f9093087804a27d",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN06.mp3",
  associatedAudioSha256:
    "185ab9d5ae8b1a8403fc44353100ded349a47118eaa1fe38f7de60176a986984",
  spriteObjectId: 103,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 414,
    lastSafeFrame: 413,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_006_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-006",
  title:
    "Represent Decimals on Number Lines — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-006/canvas-renderer.js",
  assetSha256:
    "3c0a82678520f8bc8d12488a1f83f0cc3315a4717857825a2146272a49483b8f",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-103",
  mainFrameCount: 464,
  livePlaybackEndFrame: 413,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 414,
      lastFrame: 464,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-006-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 413,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 414..464, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
