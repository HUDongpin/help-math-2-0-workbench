import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_IR_001_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 1,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf",
  swfSha256:
    "06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IR/L10RW01.fla",
  flaSha256:
    "6c4261ad96af697f605d979f326db72617a139fbfa4b60474c6a211e7615059b",
  sourceStaticFrameDomain: "sprite-31",
  sourceStaticFrameCount: 136,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "1",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ir-001/manifest.json",
  candidateManifestSha256:
    "225d1e447480e935bd369b103bc3451674db511fb16b364bc0d404985038fc1b",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_IR_001_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ir-001",
  title:
    "Introduction — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_IR_001_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ir-001/canvas-renderer.js",
  assetSha256:
    "9112be5f3edb12bb0d6a1ecc7e04ddca28a21c253f42cd9c5dea3d87c6a8f10e",
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
  mainFrameDomain: "sprite-31",
  mainFrameCount: 136,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-31-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 136,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_IR_001_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
