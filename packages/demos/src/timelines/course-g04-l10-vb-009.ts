import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_009_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 13,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB09.swf",
  swfSha256:
    "32a2905e40071d302cd350f09b0df8b4017550cbd93cac48648f5716dec4222d",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB09.fla",
  flaSha256:
    "b4f502e6b6d891ed6dfd39d345800e5e44f91524d0ebdd795530f52aadfb98fd",
  sourceStaticFrameDomain: "sprite-104",
  sourceStaticFrameCount: 351,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-009/manifest.json",
  candidateManifestSha256:
    "04569deea15f9b222d41294de32f94810325e115f77867a474a375fb28f00280",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_009_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-009",
  title:
    "Area — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-009/canvas-renderer.js",
  assetSha256:
    "fd7eda1b24e5cde50555b14bfe560b66a52471d20273a658a0721f364b33ca86",
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
  mainFrameDomain: "sprite-104",
  mainFrameCount: 351,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-104-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 351,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
