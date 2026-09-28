import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 221..274 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_019_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN19.swf",
  swfSha256:
    "5126885a718fd05ec98cadb0fc56d280ab510e578f34d8784de345fdc7875449",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN19.fla",
  flaSha256:
    "2b805805da40e42a3519b0a9fc499c94c234157e8bd53f8706a51d7ef7d0f95a",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN19.mp3",
  associatedAudioSha256:
    "72db4af7e2305fb7df133a34e8af004c946606f6525a8a60f80a85bf5718394e",
  spriteObjectId: 265,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 221,
    lastSafeFrame: 220,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_019_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-019",
  title:
    "Placing Numbers on a Number Line Practice — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_019_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-019/canvas-renderer.js",
  assetSha256:
    "c15e0a967664522fd17755dc8a296befec6cc7b2bba5f6cefec671fda93a9ffa",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-265",
  mainFrameCount: 274,
  livePlaybackEndFrame: 220,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 221,
      lastFrame: 274,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-019-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 220,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 221..274, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_019_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
