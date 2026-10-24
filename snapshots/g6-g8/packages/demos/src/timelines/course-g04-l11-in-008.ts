import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_008_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 20,
  swfSha256: "0b52735b2a6dcd67beb85f3cf9ca99d660cb92d7c27a3f280d664a51cf24c74a",
  pairedFlaStatus: "missing", sourceStaticFrameDomain: "sprite-129",
  sourceStaticFrameCount: 1_478, rootBeginFrame: 6,
  sourceEquation: "x + 1 = y", sourcePlottedPointCount: 9,
  sourceTableRowCount: 7, sourceButtonDefinitionCount: 0,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-008/manifest.json",
  candidateManifestSha256:
    "47461cec4c873aa95fc3ac47b454f6e2a9cd69ce3f3a98c1126f619ae52dbaaf",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_008_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-008",
  title: "Plot Points to Make a Line — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-008/canvas-renderer.js",
  assetSha256: "8a2c135cb6b1474d5210543e5cb4aa4cb719bd3fea8023be4f9d394d807de4d2",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-129", mainFrameCount: 1_478,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-129-source-static-drawing", firstFrame: 1, lastFrame: 1_478,
  })]),
  sourceControlBehaviorLabel:
    "The source has no animation-internal buttons; the modern Lesson host may pause, resume, or Replay the exact 1,478-frame visual sequence while embedded narration, natural entry, terminal looping, Spanish source visuals, and acceptance remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
