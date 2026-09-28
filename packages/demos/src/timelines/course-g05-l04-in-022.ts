import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 412..475 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_022_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN22.swf",
  swfSha256:
    "af167f9d49133ec51d8d364df0fb09eb6f53d6018423aee4954ecd53ef9a314f",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN22.fla",
  flaSha256:
    "f82e4fba9387f0a315ece4e769a3f78d887cf02b0cf330c08d405fa74899ebab",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN22.mp3",
  associatedAudioSha256:
    "444becbd0472eab2736e00aaee7700e140056eeec26880d502bbfee822fd41fd",
  spriteObjectId: 355,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 412,
    lastSafeFrame: 411,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_022_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-022",
  title:
    "Placing Numbers on a Number Line Practice — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_022_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-022/canvas-renderer.js",
  assetSha256:
    "a5517b8ee9e5a27b8ae2cdf1731824078a18e4a656361d189c48a399089405f0",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-355",
  mainFrameCount: 475,
  livePlaybackEndFrame: 411,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 412,
      lastFrame: 475,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-022-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 411,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 412..475, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_022_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
