import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_RW_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 4,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf",
  swfSha256:
    "8f0fe3a78ad9757b4388e0fd1f79e5e275914e5377d5e7be184ffa1779b63f95",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW04.fla",
  flaSha256:
    "08f5890a1175c72db509ce697d6aa0ec8e2e93e1ab8814cc3d021134aa64db14",
  sourceStaticFrameDomain: "sprite-109",
  sourceStaticFrameCount: 1325,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "Animation",
    depth: "1",
    placementTwips: Object.freeze({x: 7219, y: 5460}),
    placementPixels: Object.freeze({x: 360.95, y: 273}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-rw-004/manifest.json",
  candidateManifestSha256:
    "068055fc3bd62e40d20d82463a0b3f5a46107df3038f15a9f1a1ff5a5950917f",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_RW_004_CONFIG = Object.freeze({
  animationId: "course-g04-l10-rw-004",
  title:
    "Page 3 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_RW_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-rw-004/canvas-renderer.js",
  assetSha256:
    "8022a71bbeb80e8f3d6c6d53321e9943ed0dd69179a2fd54f4c4677463d27bee",
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
  mainFrameDomain: "sprite-109",
  mainFrameCount: 1325,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-109-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1325,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_RW_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
