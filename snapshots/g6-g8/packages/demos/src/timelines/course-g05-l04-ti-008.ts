import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 95..146 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI08.swf",
  swfSha256:
    "e197fc8947f129ebe4f615cdeb5a17c48baa7343d89e5b581585ef530b1ae538",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI08.fla",
  flaSha256:
    "f058bec9ce82ddca689fb1eacd8a3e2bf18adc2b5a38f87c0bf4d020e819dd9e",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI08.mp3",
  associatedAudioSha256:
    "41fe30f8aaf05b8a213047264ef5df7d1e169be9e19ead921460325046203032",
  spriteObjectId: 160,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 95,
    lastSafeFrame: 94,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_008_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-008",
  title:
    "Question 7 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-008/canvas-renderer.js",
  assetSha256:
    "c9b150f664eaf93da7803091f23d98406d1823086411ee17304cf75283b37010",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-160",
  mainFrameCount: 146,
  livePlaybackEndFrame: 94,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 95,
      lastFrame: 146,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-008-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 94,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 95..146, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
