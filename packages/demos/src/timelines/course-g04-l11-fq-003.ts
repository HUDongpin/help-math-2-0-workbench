import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_FQ_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 43,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf",
  swfSha256:
    "d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.fla",
  flaSha256:
    "f69ac59104bf8a05f9920b0dc2e6cb3fa84aa32d2d0da054203e972eb06a5c4c",
  sourceStaticFrameDomain: "sprite-910",
  sourceStaticFrameCount: 72,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 7350, y: 4322}),
    placementPixels: Object.freeze({x: 367.5, y: 216.1}),
  }),
  candidateManifest: "public/flash-assets/courses/course-g04-l11-fq-003/manifest.json",
  candidateManifestSha256:
    "4747204e97272392712852d0dcdff6d547e437818e63e3d142c6d23e164c0c9d",
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: true,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_FQ_003_CONFIG = Object.freeze({
  animationId: "course-g04-l11-fq-003",
  title:
    "Page 2 — fixed-English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L11_FQ_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-fq-003/canvas-renderer.js",
  assetSha256:
    "713f2c043ae793e66dea2adec5247faeef595734d03355386cee543608187228",
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
  mainFrameDomain: "sprite-910",
  mainFrameCount: 72,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-910-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 72,
    }),
  ]),
  sourceControlBehaviorLabel:
    "The modern A-D quiz, results, answer review, and reset controls are functionally reconstructed from source scripts; source drawing behavior and audio remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_FQ_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
