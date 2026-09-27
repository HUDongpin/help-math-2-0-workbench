import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 112..167 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_TI_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI07.swf",
  swfSha256:
    "6d562128c1e87327776816035bffb6aeaaf0c0825c3ea415ff329effd10e82d9",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TI/L4TI07.fla",
  flaSha256:
    "62610266e42e35bf9dd9722fe3cb1766d3b0afb6b2b192ff3b28ced7ae9688c4",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TI07.mp3",
  associatedAudioSha256:
    "fec9a149d811e4d1d55fdc503073c3fd4f2070083511753c0921cfd907ba43b7",
  spriteObjectId: 177,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 112,
    lastSafeFrame: 111,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_TI_007_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ti-007",
  title:
    "Question 6 — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TI_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ti-007/canvas-renderer.js",
  assetSha256:
    "d12ddeb50b3f48021edca8092c455e117eea95b3c38fc06e2055b0e96f30e661",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-177",
  mainFrameCount: 167,
  livePlaybackEndFrame: 111,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 112,
      lastFrame: 167,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "ti-007-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 111,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 112..167, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TI_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
