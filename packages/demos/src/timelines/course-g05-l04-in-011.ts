import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 342..428 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_011_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN11.swf",
  swfSha256:
    "3c254d6f089cab112ab7187a3b56daedfd39b7e64d3b103344606923d1d355ea",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN11.fla",
  flaSha256:
    "6548d127db5665c309d4a0788bd50c47110408d7a3675b6cefb09dd42ef243ea",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN11.mp3",
  associatedAudioSha256:
    "bf49a23e18d0b05e558d99f92f88836931eb6eeac8549954ed385babc4ccc6e8",
  spriteObjectId: 231,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 342,
    lastSafeFrame: 341,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_IN_011_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-011",
  title:
    "Represent Fractions and Mixed Numbers on Number Lines Practice — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-011/canvas-renderer.js",
  assetSha256:
    "a72d0fd6a6fa1609f58eb6e326b734e010cf9d2274051f9f88d1b4fd25649497",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-231",
  mainFrameCount: 428,
  livePlaybackEndFrame: 341,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 342,
      lastFrame: 428,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "in-011-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 341,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 342..428, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_011_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
