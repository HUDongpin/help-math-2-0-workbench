import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_RW_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 3,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf",
  swfSha256:
    "1e6a62a11fddd08c083d2a4556ff95f4fbb0e2447f442b7bdb264998dedba81e",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-253",
  sourceStaticFrameCount: 1046,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "Animation",
    depth: "1",
    placementTwips: Object.freeze({x: 7219, y: 5460}),
    placementPixels: Object.freeze({x: 360.95, y: 273}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-rw-003/manifest.json",
  candidateManifestSha256:
    "4aa29906420af1c25823c0c4c96d55ea4e07ca43127d2eee3301b3d397267b73",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_RW_003_CONFIG = Object.freeze({
  animationId: "course-g04-l10-rw-003",
  title:
    "Page 2 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_RW_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-rw-003/canvas-renderer.js",
  assetSha256:
    "1c5b9c542bea7a4ee3f13c712dfab18ec44b31f58673fd7f1dba55aa12cc36d9",
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
  mainFrameDomain: "sprite-253",
  mainFrameCount: 1046,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-253-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1046,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_RW_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
