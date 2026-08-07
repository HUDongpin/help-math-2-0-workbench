import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 126..175 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.";

export const COURSE_G05_L04_VB_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB03.swf",
  swfSha256:
    "9ab43dd0bb28cf5567a5804d1fd5d65ccc69027bac8243c14d677e6a5484d3d8",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB03.fla",
  flaSha256:
    "f13cd465ef32807449df3349d9483e6aba90f7a86811f40779313d391e3cc7ea",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB03.mp3",
  associatedAudioSha256:
    "90325bdf66dce7508c96d2829fc684be1a1b25d220ab87821762b8987b21c074",
  spriteObjectId: 95,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_288, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 414.4, y: 283.3}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: 126,
    lastSafeFrame: 125,
    interactionKind: "drag",
    behaviorReconstructed: false,
  }),
});

export const COURSE_G05_L04_VB_003_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-003",
  title:
    "Number Line Practice — English source-static safe-prefix engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-003/canvas-renderer.js",
  assetSha256:
    "9957cc8bc7adcf4d452d94f771cd407ab82a355be1ad69880a4a3bbbdb7ccc85",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-95",
  mainFrameCount: 175,
  livePlaybackEndFrame: 125,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 126,
      lastFrame: 175,
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "vb-003-source-drawing-safe-prefix",
      firstFrame: 1,
      lastFrame: 125,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frames 126..175, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
