import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 14,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN02.swf",
  swfSha256:
    "a87ccf50c6291e27d2de4a0fac3e959ec6f426cb6e4dcd828eef08ed3dab6894",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN02.fla",
  flaSha256:
    "74d31a919e7d1f139e67574b57a2490f03b0895d6833aee2cf5678258718bee3",
  sourceStaticFrameDomain: "sprite-80",
  sourceStaticFrameCount: 331,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8_026, y: 4_885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-in-002/manifest.json",
  candidateManifestSha256:
    "3b41276873a830ca4119dea1214199cc3cf1ad52a23d6d438166d8c55b07ab61",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceExternalSpanishAudioEnabled: false,
  sourceExternalSpanishAudioAccepted: false,
  sourceButtonDefinitionCount: 9,
  modernPedagogicalControlCount: 9,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_002_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-002",
  title: "Coordinate Grid — unregistered Lesson-internal instruction candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-in-002/canvas-renderer.js",
  assetSha256:
    "f42e66fd4ab89cf36996bb250e5bf7c0454976c6479b2858a1458c409f77a3be",
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
  mainFrameDomain: "sprite-80",
  mainFrameCount: 331,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-80-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 331,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Nine glossary controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded narration, external Spanish audio, unproved Spanish source visuals, natural entry, and terminal behavior remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_002_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
