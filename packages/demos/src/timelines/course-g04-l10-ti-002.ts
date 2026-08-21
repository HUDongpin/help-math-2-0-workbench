import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TI_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 31,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI02.swf",
  swfSha256:
    "5562d0078de02f66ed37e336bc459d7e8012d9600fc7c33eee19a6e248b06fc8",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-289",
  sourceStaticFrameCount: 291,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ti-002/manifest.json",
  candidateManifestSha256:
    "5804b04c6acca41203f7208a5c286880c5fced2f1057ab7a0a22abf08c0df921",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TI_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ti-002",
  title:
    "Question 1 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TI_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ti-002/canvas-renderer.js",
  assetSha256:
    "4b902e00309263daf8bc178d19acc61faecd9bd98d2a972973d542a52721ee03",
  stage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-289",
  mainFrameCount: 291,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-289-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 291,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TI_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
