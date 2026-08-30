import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 97..114 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_009_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI09.swf",
  swfSha256:
    "58068d194e4ae7b61ae85505e36fb0fab6d4286b4ce8b893a4260d0f6df0e900",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI09.fla",
  flaSha256:
    "d6194c314613e6efe3371bc6386b92b79037b9bc6632ea943d21dfda5726b56e",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI09.mp3",
  associatedAudioSha256:
    "262db24807b2d7e663ccd22559d8d4147e83e9aa2ee5e3da8a64eb675060b242",
  spriteObjectId: 171,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 97,
    lastSafeFrame: 96,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_009_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-009",
  title:
    "Question 8 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-009/canvas-renderer.js",
  assetSha256:
    "d686b05e0997cd50172bd95ca9a6fba426b7cfd6d48658a42fc9b8e5b3480686",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-171",
  mainFrameCount: 114,
  livePlaybackEndFrame: 96,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 97,
      lastFrame: 114,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-009-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 96,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 97..114, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
