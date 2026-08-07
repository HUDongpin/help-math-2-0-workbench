import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 163..164 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI03.swf",
  swfSha256:
    "5e8dc4213ec766215a7dcb92d5681ed70c694e1e9f21d00a6f73ca75777b9fef",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI03.fla",
  flaSha256:
    "f27e524258541201d85f8473cec6a50c192e14568169815d225aabcbedc25ece",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI03.mp3",
  associatedAudioSha256:
    "c620ba3ef7461355a1f985ffc10355eb3f847d40ae814aec7204cae8d493e852",
  spriteObjectId: 270,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 163,
    lastSafeFrame: 162,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-003",
  title:
    "Question 2 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-003/canvas-renderer.js",
  assetSha256:
    "589433ea1087962ae26d02877e406dc327cd81c281525e720f60d4345ffc67ca",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-270",
  mainFrameCount: 164,
  livePlaybackEndFrame: 162,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 163,
      lastFrame: 164,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-003-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 162,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 163..164, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
