import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_010_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 13,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB10.swf",
  swfSha256:
    "a4b46ef4c0a5476ecfc35f63d4fb78f3fd4d9c6340e760443e4f7d078013d5d8",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB10.fla",
  flaSha256:
    "185e22a067bc27d57801f35022ff76ced79c11b7e5eda61e847e0e327a97ef9b",
  sourceStaticFrameDomain: "sprite-43",
  sourceStaticFrameCount: 66,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-010/manifest.json",
  candidateManifestSha256:
    "3044b100cf8651183e4cbf22182a217074c1f15d931040548d69b10249d19d17",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceButtonDefinitionCount: 3,
  modernPedagogicalControlCount: 3,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_010_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-010",
  title: "Line Segment — unregistered Lesson-internal vocabulary candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-010/canvas-renderer.js",
  assetSha256:
    "a0e64cb3fd6dc2cfb1fc85d5d7f62b270cba6c48814ae313b63d52b057d74edc",
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
  mainFrameDomain: "sprite-43",
  mainFrameCount: 66,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-43-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 66,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Three glossary controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded narration, unproved Spanish source visuals, natural entry, and terminal behavior remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_010_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
