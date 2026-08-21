import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_TS_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 42,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
  swfSha256:
    "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-415",
  sourceStaticFrameCount: 851,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "1",
    placementTwips: Object.freeze({x: 8247, y: 5658}),
    placementPixels: Object.freeze({x: 412.35, y: 282.9}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-ts-007/manifest.json",
  candidateManifestSha256:
    "d66731faf18fb0b125f46f08d0769e5cffaddd0e86ffebe3f82cdf836a2865eb",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_TS_007_CONFIG = Object.freeze({
  animationId: "course-g04-l10-ts-007",
  title:
    "Question 1 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_TS_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-ts-007/canvas-renderer.js",
  assetSha256:
    "bfd3bc016f4baddac7b743a6f6b6d21f6e943151b1cd607e4b81fbd17696d78b",
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
  mainFrameDomain: "sprite-415",
  mainFrameCount: 851,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-415-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 851,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_TS_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
