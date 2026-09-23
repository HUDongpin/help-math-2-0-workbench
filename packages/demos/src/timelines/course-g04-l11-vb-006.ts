import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 9,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB06.swf",
  swfSha256:
    "12701c2e3e0edd8fd1bafbb942a8ff237cc931e0ab37e9a4f370df0060eb4a2e",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB06.fla",
  flaSha256:
    "aecd47a8ae6943a51fc7d488628294c0640f13ba219c19165bb90350c590fc81",
  sourceStaticFrameDomain: "sprite-85",
  sourceStaticFrameCount: 439,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-006/manifest.json",
  candidateManifestSha256:
    "28c0426be5687be916606e8fd91ff21495c1b00ef1059d4cd3121fff58a589b4",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceAnimationInternalControlCount: 7,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_006_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-006",
  title: "Ordered Pair / Coordinates — unregistered Lesson-internal interaction candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-006/canvas-renderer.js",
  assetSha256:
    "3dcf0f2d7448b7611f50059f580d3c7c3d37dace4701bc5d0d8b6be97d214fb0",
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
  mainFrameDomain: "sprite-85",
  mainFrameCount: 439,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-85-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 439,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Seven source key-term controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded audio, and unproven Spanish source visuals remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
