import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 257..275 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI02.swf",
  swfSha256:
    "9922c110563282176b765f3d0befbc81000d85505475c18d5cd8b3fb415e8158",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI02.mp3",
  associatedAudioSha256:
    "ceb01daec6d9d1a2f1524e4fac9df279cc2f481f0513640df5e8f7be9cbb8997",
  spriteObjectId: 413,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 257,
    lastSafeFrame: 256,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_002_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-002",
  title:
    "Question 1 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-002/canvas-renderer.js",
  assetSha256:
    "bcdb04ed1df92261499cc3e0e80c4e924cd141729ae50543018b6586d45f86c5",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-413",
  mainFrameCount: 275,
  livePlaybackEndFrame: 256,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 257,
      lastFrame: 275,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-002-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 256,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 257..275, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
