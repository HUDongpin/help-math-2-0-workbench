import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 130..180 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_IN_010_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN10.swf",
  swfSha256:
    "53056f0fa5ab16aa1b18539b49b4c34d3dfe7d5f58ad0ce5f0e82ff7ef6807ba",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4IN10.mp3",
  associatedAudioSha256:
    "7a27d1a0812010c5b4bce1042b5662a401c59362d201e55601f5c50606c9dd83",
  spriteObjectId: 58,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G05_L04_IN_010_CONFIG = Object.freeze({
  animationId: "course-g05-l04-in-010",
  title:
    "Represent Fractions and Mixed Numbers on Number Lines — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_IN_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-in-010/canvas-renderer.js",
  assetSha256:
    "0832445a5a39159f6af818908e90fbc5a39142d7833d6bfc51a47d8c88bfbdfa",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-58",
  mainFrameCount: 180,
  livePlaybackEndFrame: 129,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 130, lastFrame: 180, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "fractions-mixed-number-lines-page-10-source-drawing",
      firstFrame: 1,
      lastFrame: 129,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 130..180, release handlers, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_IN_010_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
