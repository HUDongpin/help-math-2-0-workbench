import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 16,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN02.swf",
  swfSha256:
    "6d72ff40eca309470e8edab115105cef6fde9134b81ede0a4bb48b80d82b538b",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-45",
  sourceStaticFrameCount: 868,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-002/manifest.json",
  candidateManifestSha256:
    "cfe45c7490aa050b07faf5cb24346e720b6c5f0e095c2f2155c6400662316735",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-002",
  title:
    "Measure Length and Width — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-002/canvas-renderer.js",
  assetSha256:
    "405bc60729eedae30810a4004e67bf7c8348d5f78f65c4e32cb298fd39f9c620",
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
  mainFrameCount: 868,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-45-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 868,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
