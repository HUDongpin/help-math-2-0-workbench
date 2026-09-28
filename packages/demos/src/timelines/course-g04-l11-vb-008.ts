import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_VB_008_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 11,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB08.swf",
  swfSha256:
    "59dc96842caf162d103f3d2f0fcc14981eeaacb251b5757c4a0e5f39a56768c1",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB08.fla",
  flaSha256:
    "c57a70d1a1a12c5795e79b210f30420955cc653cc2d6961bc7a52e98eddc3eb0",
  sourceStaticFrameDomain: "sprite-41",
  sourceStaticFrameCount: 95,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "4",
    placementTwips: Object.freeze({x: 8026, y: 4885}),
    placementPixels: Object.freeze({x: 401.3, y: 244.25}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-vb-008/manifest.json",
  candidateManifestSha256:
    "cc114836e3381c76ee7c56b357cfa6624654d2fb70bd27cfbb56458c99c69b4b",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceButtonDefinitionCount: 6,
  modernPedagogicalControlCount: 6,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_008_CONFIG = Object.freeze({
  animationId: "course-g04-l11-vb-008",
  title: "Plot — unregistered Lesson-internal vocabulary candidate",
  sourceSwfSha256: COURSE_G04_L11_VB_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-vb-008/canvas-renderer.js",
  assetSha256:
    "fdfaf329aa13093450de5feb5e16d7f11235f5c21be5f7a2a09b51da2bafe86c",
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
  mainFrameDomain: "sprite-41",
  mainFrameCount: 95,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-41-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 95,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Six glossary controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded narration, unproved Spanish source visuals, and unproved natural entry remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_VB_008_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
