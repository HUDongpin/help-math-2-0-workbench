import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_GS_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 36,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/GS/L10GS02.swf",
  swfSha256:
    "e7a473748005f43a5af8cc04ec72719752ea6b6751d0da190be1acde44d9ad9d",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-492",
  sourceStaticFrameCount: 853,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-gs-002/manifest.json",
  candidateManifestSha256:
    "a80bb6719c5644e88e7bc81978bb7c3e54462b92a62ded18b45c15b37ab921ef",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_GS_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-gs-002",
  title:
    "Game 1 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_GS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-gs-002/canvas-renderer.js",
  assetSha256:
    "b60f6d298ee89ea1751a559798a570224de4d5ad8a147ddf5d5c09f619ce0611",
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
  mainFrameDomain: "sprite-492",
  mainFrameCount: 853,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-492-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 853,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_GS_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
