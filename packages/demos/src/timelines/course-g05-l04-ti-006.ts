import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 188..237 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI06.swf",
  swfSha256:
    "9c83e06d0943009ffa3e3eda2b00cdc390a84dd948b3e7cfef0019a5d7ee10c9",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI06.fla",
  flaSha256:
    "d0d1429793e28692ee28c3dcc0a0d7c1e9e16129bdcc33bf540846167a55a61c",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI06.mp3",
  associatedAudioSha256:
    "f6eba426c4d39a575c62aab613dc15ae26ef91a0ecd06cf13488053973a97f73",
  spriteObjectId: 191,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 188,
    lastSafeFrame: 187,
    interactionKind: "answer-release",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_006_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-006",
  title:
    "Question 5 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-006/canvas-renderer.js",
  assetSha256:
    "9f0b990f287c0bf66722c5ebe5f959deee522f1226b374866a162224efe4d0a5",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-191",
  mainFrameCount: 237,
  livePlaybackEndFrame: 187,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 188,
      lastFrame: 237,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-006-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 187,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 188..237, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
