import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 37,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS02.swf",
  swfSha256:
    "852ef6a6f24e0666fe4d14d3bce63d0170f01c255c5f61e147db559895db032f",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS02.fla",
  flaSha256:
    "cec688e616ec5005ae333edf2c90d3d64e4feb189c19369238aade7c62007409",
  sourceStaticFrameDomain: "sprite-29",
  sourceStaticFrameCount: 324,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "6",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-002/manifest.json",
  candidateManifestSha256:
    "3dcbe78f2046dd24f518113500449f5d1d7891296681bc34de41fceaf3d3e6a5",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-002",
  title:
    "4 - Step Plan — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-002/canvas-renderer.js",
  assetSha256:
    "a5dae5ae14de393370be24426dab15753060100bb5095bfaf2463a02cdfab0f9",
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
  mainFrameDomain: "sprite-29",
  mainFrameCount: 324,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-29-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 324,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
