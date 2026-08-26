import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_009_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 12,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB09.swf",
  swfSha256:
    "ef1b1c902cf362b5a75455033fb49d5ad04afa910c6d5612f851a54099677a7e",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB09.fla",
  flaSha256:
    "71a0318c37399672580a69d40527e17800ab3c0453588aff36b50621955fe500",
  sourceStaticFrameDomain: "sprite-60",
  sourceStaticFrameCount: 217,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-009/manifest.json",
  candidateManifestSha256:
    "cb72a1de4c1b5b209e2aa1e2f50d93d9c0c87a987f3b5cc7dd3eb4ab76b4dc8d",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceButtonDefinitionCount: 4,
  modernPedagogicalControlCount: 4,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_009_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-009",
  title: "Point — unregistered Lesson-internal vocabulary candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-009/canvas-renderer.js",
  assetSha256:
    "ab38aefc1e40f155f60023ae1d06737aceb26d86a2fc8ece0e2c9c367a91e3b0",
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
  mainFrameDomain: "sprite-60",
  mainFrameCount: 217,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-60-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 217,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Four glossary controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded narration, unproved Spanish source visuals, and unproved natural entry remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
