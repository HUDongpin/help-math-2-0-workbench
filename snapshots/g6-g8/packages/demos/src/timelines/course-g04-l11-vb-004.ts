import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 7,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB04.swf",
  swfSha256:
    "46c6d94e6646a9f799d8f8625c3dec6c1e9fcf8bdcac57cc2d0fdbfa59404608",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB04.fla",
  flaSha256:
    "df23d8626433a8a127afdbfbfbd0773e73997ddd6997fa22d32c60e2c126435c",
  sourceStaticFrameDomain: "sprite-71",
  sourceStaticFrameCount: 157,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-004/manifest.json",
  candidateManifestSha256:
    "e3dc8eae8f581245d84d975ea41f05d20ff636523401c2bbd5da2eb44f5a3edc",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceAnimationInternalControlCount: 4,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_004_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-004",
  title: "Y-axis / Vertical — unregistered Lesson-internal interaction candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-004/canvas-renderer.js",
  assetSha256:
    "ef6a122b501a8ed5691e4497f55e74470f12a29665b14c47cf54548f268638bc",
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
  mainFrameDomain: "sprite-71",
  mainFrameCount: 157,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-71-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 157,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Four source key-term controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded audio, and unproven Spanish source visuals remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
