import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 10,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB07.swf",
  swfSha256:
    "be59c2d00360e14088098482dafbc5d919b29d95ee1b4462c4077c9883ad076c",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB07.fla",
  flaSha256:
    "5fca080932418462ec5996f44333335a55a223a338ab3937f759d06806d0d1ac",
  sourceStaticFrameDomain: "sprite-254",
  sourceStaticFrameCount: 107,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8248, y: 5666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-007/manifest.json",
  candidateManifestSha256:
    "159aeb15a3966792e18595585646a40d0d028974800da191ff03712b187c1628",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceButtonDefinitionCount: 11,
  modernPedagogicalControlCount: 9,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_007_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-007",
  title:
    "Ordered Pair Practice — unregistered Lesson-internal quiz candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-007/canvas-renderer.js",
  assetSha256:
    "750c764a95294eaf3763b72f569e69e010af75ea5f70550f51fdf14d5a7c0926",
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
  mainFrameDomain: "sprite-254",
  mainFrameCount: 107,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-254-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 107,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Two answer controls and seven unique glossary terms are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, eleven embedded streams, the Spanish track, and unproved branch causality remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_007_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
