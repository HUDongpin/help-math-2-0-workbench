import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L10_VB_008_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l10-perimeter-area",
  releaseOrdinal: 12,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB08.swf",
  swfSha256:
    "6ff6b55a0f97bdc333caa1d813619cf10ba8d7f07f265e325ccd191f8e0c58d1",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB08.fla",
  flaSha256:
    "947bdac74507d8f1aa6903b90d7c7827d8a2a4aac04dbc97ad51a21ddcc8072c",
  sourceStaticFrameDomain: "sprite-62",
  sourceStaticFrameCount: 413,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l10-vb-008/manifest.json",
  candidateManifestSha256:
    "1869c3fba663c845cab8687c0e6b445065225f21bb66268352c31749e6f14a02",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L10_VB_008_CONFIG = Object.freeze({
  animationId: "course-g04-l10-vb-008",
  title:
    "Perimeter — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L10_VB_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l10-vb-008/canvas-renderer.js",
  assetSha256:
    "8a6b258c53757ffaba7617547918f03d5f13d1284a14a9dc7bff2f4d1a12beca",
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
  mainFrameDomain: "sprite-62",
  mainFrameCount: 413,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-62-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 413,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L10_VB_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
