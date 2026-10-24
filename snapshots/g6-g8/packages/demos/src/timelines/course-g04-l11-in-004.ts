import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 16,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN04.swf",
  swfSha256:
    "b987be3902c3937a7c1e010aa241d5a87e569eac056f897c8c223b12a9e65641",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  sourceStaticFrameDomain: "sprite-127",
  sourceStaticFrameCount: 233,
  sourceNaturalQuizStopFrame: 228,
  sourceTerminalDefinitionFrame: 233,
  sourceTerminalDefinitionReachabilityEstablished: false,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8_248, y: 5_666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-in-004/manifest.json",
  candidateManifestSha256:
    "f2f4c402479f3195fe438f7a7d2a976162bbcef50f216e4141952fabb2e4b559",
  actionScriptExecutedByCanvas: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceExternalSpanishAudioEnabled: false,
  sourceExternalSpanishAudioAccepted: false,
  sourceButtonDefinitionCount: 10,
  sourceGlossaryControlCount: 8,
  sourceGridHitTargetCount: 121,
  sourceRandomTargetCount: 18,
  modernPedagogicalInteractionRequired: true,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_004_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-004",
  title: "Plot Ordered Pairs — unregistered Lesson-internal quiz candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-in-004/canvas-renderer.js",
  assetSha256:
    "0dbe6d62165444d1b9c09cc78395d5e5ad04bea143ff6e59c0232490ea76b665",
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
  mainFrameDomain: "sprite-127",
  mainFrameCount: 233,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-127-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 233,
    }),
  ]),
  sourceControlBehaviorLabel:
    "The 233 structural frames remain queryable; the modern wrapper clamps natural playback at source stop frame 228 and separately implements the exact 18-target quiz, 121 grid locations, correct/wrong feedback, Next Ordered Pair, and eight glossary controls without executing legacy globals or audio",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_004_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
