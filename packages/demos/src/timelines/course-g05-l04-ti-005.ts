import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 138..363 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI05.swf",
  swfSha256:
    "3885922f634898e27deee2e04f79dca5129be35a96e1675e3882760f1d285d23",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI05.fla",
  flaSha256:
    "eac0ed6b83b4ceb1a46b1eac872cdb564a33837f975663300c23fef9a99bb14c",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI05.mp3",
  associatedAudioSha256:
    "ebffb598ff11bff88bb78770618bec13c4d19ae6c4208d5155c93c2508618232",
  spriteObjectId: 272,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 138,
    lastSafeFrame: 137,
    interactionKind: "answer-button",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_005_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-005",
  title:
    "Question 4 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-005/canvas-renderer.js",
  assetSha256:
    "8e92319b1049bfb69953ccbc962b474b387551996fff85cef017955eab919213",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-272",
  mainFrameCount: 363,
  livePlaybackEndFrame: 137,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 138,
      lastFrame: 363,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-005-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 137,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 138..363, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
