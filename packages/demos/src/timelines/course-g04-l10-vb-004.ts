import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 8,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB04.swf",
  swfSha256:
    "f0d0ebfc9abebcfb13e6fb150a8663503330f1fbc2289713a678d64df307e500",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB04.fla",
  flaSha256:
    "d1ba8716790dcec21a5a54990e165c7ac555ad901418ac10d20a3eaaf2b74cf0",
  sourceStaticFrameDomain: "sprite-45",
  sourceStaticFrameCount: 213,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-004/manifest.json",
  candidateManifestSha256:
    "3753bed35db9de6120d386bc33e01ceba90309fbf469712d8d939c8f90a5d77a",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_004_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-004",
  title:
    "Length — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-004/canvas-renderer.js",
  assetSha256:
    "6f6c089a92fd28fd1c2d547f51506932af6077935dc867eb86afc22453d52453",
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
  mainFrameDomain: "sprite-45",
  mainFrameCount: 213,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-45-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 213,
    }),
  ]),
  sourceControlBehaviorLabel:
    "The source-static core keeps ActionScript disabled; its private maintained wrapper binds the three exact glossary handlers plus source-exact engineering audio while Spanish visuals, natural runtime, terminal state, Replay parity, fidelity, and audio acceptance remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
