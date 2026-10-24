import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 122..195 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN08.swf",
  swfSha256:
    "7dbd66d557ba8fa79fb111e97faf333c5e7e6f8b5d55ef9b11b731215854d125",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN08.fla",
  flaSha256:
    "83cd113246c4e457e7a03ad20d97713d45c44cd6d8cad6dd4ccf51baf3f3d4fb",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN08.mp3",
  associatedAudioSha256:
    "51c60228d92bd8f3d325ffe5f9b609cf7eda92ca02084496dbaf95e2a6ed7d5b",
  spriteObjectId: 123,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 122,
    lastSafeFrame: 121,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_008_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-008",
  title:
    "Represent Fractions and Mixed Numbers on a Number Line — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-008/canvas-renderer.js",
  assetSha256:
    "09725c3fc1c3610b3a3ac092c4d2d6731a3e645152ffb511721730abcb98d484",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-123",
  mainFrameCount: 195,
  livePlaybackEndFrame: 121,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 122,
      lastFrame: 195,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-008-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 121,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 122..195, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
