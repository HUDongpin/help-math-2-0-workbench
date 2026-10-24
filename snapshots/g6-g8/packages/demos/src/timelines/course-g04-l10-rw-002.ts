import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_RW_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 2,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
  swfSha256:
    "45b14745c04d452c71c7c7f9c99c26300a293d8d14f66afcd29a9ff590a01059",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-356",
  sourceStaticFrameCount: 1132,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "Animation",
    depth: "1",
    placementTwips: Object.freeze({x: 7219, y: 5460}),
    placementPixels: Object.freeze({x: 360.95, y: 273}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-rw-002/manifest.json",
  candidateManifestSha256:
    "5d9e324104f12ef0224cd7a33c8fa66679b624ab895ef47dd4a8349e73dc6bff",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_RW_002_CONFIG = Object.freeze({
  animationId: "course-g04-l10-rw-002",
  title:
    "Page 1 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_RW_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-rw-002/canvas-renderer.js",
  assetSha256:
    "bb2b59b15012aff475d29c5b9058da796c63344a935d9979c1d95245f04bf0f0",
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
  mainFrameDomain: "sprite-356",
  mainFrameCount: 1132,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-356-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1132,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_RW_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
