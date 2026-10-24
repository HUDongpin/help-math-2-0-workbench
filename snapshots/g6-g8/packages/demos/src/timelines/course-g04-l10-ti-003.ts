import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TI_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 32,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI03.swf",
  swfSha256:
    "57830bd6780ce5a2caa320042c80238ad54eaa019f65ff07a1c2471dcae9caf4",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI03.fla",
  flaSha256:
    "d413bb3380a0db033f162205e69d43cbb910ec5ae6607270bde201ec4ea6d072",
  sourceStaticFrameDomain: "sprite-308",
  sourceStaticFrameCount: 395,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ti-003/manifest.json",
  candidateManifestSha256:
    "753f681ef666f87c36ee91a419ca1329a49b5ee503e71f82c01991ba08631154",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TI_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ti-003",
  title:
    "Question 2 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TI_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ti-003/canvas-renderer.js",
  assetSha256:
    "44090fbb7c07ddd6f9970e7185bcb2f90c5d3ac02e1205890b1972a2aa02ea69",
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
  mainFrameDomain: "sprite-308",
  mainFrameCount: 395,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-308-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 395,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TI_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
