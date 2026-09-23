import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 209..257 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_VB_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB04.swf",
  swfSha256:
    "499418b013e3eb443cec84e1ea27c2e43fa3f19f57280354b42b44ea678f2b4b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB04.fla",
  flaSha256:
    "ebb47ebce6c452b7f239be9b848692f5a3a3e5c4b335afc9fceefabdb1111b10",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB04.mp3",
  associatedAudioSha256:
    "445ab9e8d19a9954fbb768f989412fd10ffa7d8f9da39720179a73c2f5f1c157",
  spriteObjectId: 71,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 209,
    lastSafeFrame: 208,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_VB_004_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-004",
  title:
    "Integers — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-004/canvas-renderer.js",
  assetSha256:
    "251297925bc18f50b1049de234b97dfa78de8f7a0d2bd201fb365d38698296c7",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-71",
  mainFrameCount: 257,
  livePlaybackEndFrame: 208,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 209,
      lastFrame: 257,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "vb-004-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 208,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 209..257, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
