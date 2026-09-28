import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TI_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 33,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI04.swf",
  swfSha256:
    "004d8dead784f263ee73417cbde2ee68206b338acba9d5dd7db420bff55af873",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI04.fla",
  flaSha256:
    "7ea410df6be541b7b3e2ad1632966c4c6fdab559a9a98ffe5478e8d8e89ad4fa",
  sourceStaticFrameDomain: "sprite-271",
  sourceStaticFrameCount: 555,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ti-004/manifest.json",
  candidateManifestSha256:
    "c6374ec3e48d3274454f2c99f9e16fdd0bf1d7c2b80cc0a3bc345c98d21a585d",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TI_004_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ti-004",
  title:
    "Question 3 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TI_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ti-004/canvas-renderer.js",
  assetSha256:
    "5f27ab1017e5b9c341c5e51b4ad4e07ff4889eea48cfae134c1be39b8298b07e",
  stage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 799.9,
    height: 599.75,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-271",
  mainFrameCount: 555,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-271-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 555,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TI_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
