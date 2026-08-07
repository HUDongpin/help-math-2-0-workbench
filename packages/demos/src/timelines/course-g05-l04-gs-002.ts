import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 452..460 begin a stop- and release-handler-controlled randomized game; question selection, scoring/timer state, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_GS_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/GS/L4GS02.swf",
  swfSha256:
    "f2b6fc8157b04757e551d1d4fda5987af1e4dc6ecb1a101708fc822e1c7f1d43",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/GS/L4GS02.fla",
  flaSha256:
    "5b1cb4a12213f1dd80de7f2695ac04d292986900fe9c97b216cb7fff1b3c1768",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4GS02.mp3",
  associatedAudioSha256:
    "9d447d7a4300e3c7f671a8e815d91af841cfe8b3523a90d457ec23732f22fd47",
  spriteObjectId: 436,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 452,
    lastSafeFrame: 451,
    interactionKind: "random-game",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_GS_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-gs-002",
  title:
    "Game 1 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_GS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-gs-002/canvas-renderer.js",
  assetSha256:
    "bfc2b31d45fd89773677744ff9a9bd0a0213caa5d78cb1a7d4eef6f80f4c3c07",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-436",
  mainFrameCount: 460,
  livePlaybackEndFrame: 451,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 452,
      lastFrame: 460,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "gs-002-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 451,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 452..460, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_GS_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
