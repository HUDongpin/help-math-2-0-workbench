import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 287..288 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_021_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN21.swf",
  swfSha256:
    "878c68db012550dc40b8ff01ccb9785d09f8adb7d2bb318eb5e945e3e6c629cd",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN21.fla",
  flaSha256:
    "2b043b1d7f082cb7795abe3090f9c85277637ae6f6ddd357187467956773b5df",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN21.mp3",
  associatedAudioSha256:
    "9ff051e175e83c94659c998f80c99111802a9de37f697abdcb9a8a7dc24537eb",
  spriteObjectId: 97,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 287,
    lastSafeFrame: 286,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_021_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-021",
  title:
    "Situations with Negative Integers — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_021_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-021/canvas-renderer.js",
  assetSha256:
    "f6e7f9b8f5fac4e5a530c14f95e3887a91629b6397fba21b3bda9c02e8af6213",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-97",
  mainFrameCount: 288,
  livePlaybackEndFrame: 286,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 287,
      lastFrame: 288,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-021-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 286,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 287..288, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_021_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
