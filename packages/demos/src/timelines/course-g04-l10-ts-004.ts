import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 39,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS04.swf",
  swfSha256:
    "2286f867a166f82fcd17382df7d4800c3d996d671f629d6ffec103fb9ce878fc",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS04.fla",
  flaSha256:
    "3c2895d3a6c80fa7968e124af398658c8b8cdf69e0453f6e85c231992a7fc4bb",
  sourceStaticFrameDomain: "sprite-38",
  sourceStaticFrameCount: 290,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 7430, y: 5667}),
    placementPixels: Object.freeze({x: 371.5, y: 283.35}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-004/manifest.json",
  candidateManifestSha256:
    "f46df805907e01044d877639655292a0870d38ba91bd9ee5f90bd639489abf17",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_004_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-004",
  title:
    "4 - Step Plan — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-004/canvas-renderer.js",
  assetSha256:
    "43e55e109357918b9f8f2d02940aa2ed63432bcd058055342dc8fbcb9ca36c05",
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
  mainFrameDomain: "sprite-38",
  mainFrameCount: 290,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-38-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 290,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
