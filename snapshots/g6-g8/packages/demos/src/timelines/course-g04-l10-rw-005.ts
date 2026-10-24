import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_RW_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 5,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf",
  swfSha256:
    "d613b174aa73cb79e672079b658e17ff88b7b0da257e82eb644cfe8725834b40",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-278",
  sourceStaticFrameCount: 925,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "Animation",
    depth: "1",
    placementTwips: Object.freeze({x: 7219, y: 5460}),
    placementPixels: Object.freeze({x: 360.95, y: 273}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-rw-005/manifest.json",
  candidateManifestSha256:
    "bcb35fbaf50ee5b5c4d5c378414ada64513a7bf8337217f5dbc450c0ab95280c",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_RW_005_CONFIG = Object.freeze({
  animationId: "course-g04-l10-rw-005",
  title:
    "Page 4 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_RW_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-rw-005/canvas-renderer.js",
  assetSha256:
    "645c21a2afdf77ed190b9cae6ee73101fb9a001bf4a5c7cbcb4b08991cfb6ad6",
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
  mainFrameDomain: "sprite-278",
  mainFrameCount: 925,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-278-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 925,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_RW_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
