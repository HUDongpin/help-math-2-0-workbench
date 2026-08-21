import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 11,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB07.swf",
  swfSha256:
    "8480ad793b8f1f02caea83bea16b9fb4f2e08f573df4f4d22d6362366fe657c1",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB07.fla",
  flaSha256:
    "943ffc9f32773a0cde3063308cad86a206e992334ca9db8a908d71d573229795",
  sourceStaticFrameDomain: "sprite-204",
  sourceStaticFrameCount: 130,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-007/manifest.json",
  candidateManifestSha256:
    "23a9736f943307b800060cabf438988665ae8e0954add436b2d3e84063d3662b",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_007_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-007",
  title:
    "Length/Width Practice — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-007/canvas-renderer.js",
  assetSha256:
    "cc2fcdf8de2c1da29dd5c8edc88565e197371c821509a6660c59a68a2fbba3db",
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
  mainFrameDomain: "sprite-204",
  mainFrameCount: 130,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-204-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 130,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
