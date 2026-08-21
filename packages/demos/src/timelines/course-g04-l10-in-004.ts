import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IN_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 18,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IN/L10IN04.swf",
  swfSha256:
    "8d1387c5a450ed8c0ab8a430632578d69b80460825677fa6b47787a32b8387f8",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-119",
  sourceStaticFrameCount: 927,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8268, y: 5666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-in-004/manifest.json",
  candidateManifestSha256:
    "2f33ad09387a406eda9ceb9924fbc64318110889ac7431931784e01ab9d5cc9b",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IN_004_CONFIG = Object.freeze({
  animationId: "course-g04-l10-in-004",
  title:
    "Perimeter — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IN_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-in-004/canvas-renderer.js",
  assetSha256:
    "c4361bea1519ee7941b243a6a898c8b0b52209f23e5f50b0a5f920d4afb5a47b",
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
  mainFrameDomain: "sprite-119",
  mainFrameCount: 927,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-119-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 927,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IN_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
