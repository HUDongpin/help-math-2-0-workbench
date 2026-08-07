import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 9,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB05.swf",
  swfSha256:
    "ad41ce348f5412f090598ef73154cec82aa54877c4f95af65495129f1309321f",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB05.fla",
  flaSha256:
    "db6b21bd2a39807bb91cb87393171e2e1f4e8227d20fb0da0bca32fbe0299fc2",
  sourceStaticFrameDomain: "sprite-44",
  sourceStaticFrameCount: 217,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8626, y: 4885}),
    placementPixels: Object.freeze({x: 431.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-005/manifest.json",
  candidateManifestSha256:
    "bab80bc5393b90baa2fa006a8763f7a69340b78d5b8996b60e390ea45faa5d04",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_005_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-005",
  title:
    "Width — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-005/canvas-renderer.js",
  assetSha256:
    "ebcf3af43c3998c99f8eb34f2af00240b2856a4aea31bf68eb96926f27f8dda9",
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
  mainFrameDomain: "sprite-44",
  mainFrameCount: 217,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-44-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 217,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_005_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
