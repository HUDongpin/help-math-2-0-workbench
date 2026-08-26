import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 198..472 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI04.swf",
  swfSha256:
    "7b169519348c889f15b5e8a23408a9423aaef7aa7aea366488cde12bc6bd10b9",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI04.fla",
  flaSha256:
    "d84d6da97ba8fc0a2028eb00331a5fb56a66b05ddd319cd6832ade1c456fc1d4",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI04.mp3",
  associatedAudioSha256:
    "f53159c34b0894d48b8ee6eb76086f87c832ea426a6e4327fb78c567379fb71d",
  spriteObjectId: 299,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 198,
    lastSafeFrame: 197,
    interactionKind: "answer-button",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_004_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-004",
  title:
    "Question 3 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-004/canvas-renderer.js",
  assetSha256:
    "95ab482dce807d640b721bffc6435152288510720def3155e7e76bf8e1510ffc",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-299",
  mainFrameCount: 472,
  livePlaybackEndFrame: 197,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 198,
      lastFrame: 472,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-004-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 197,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 198..472, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
