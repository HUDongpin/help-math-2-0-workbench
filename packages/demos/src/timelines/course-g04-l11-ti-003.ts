import {COURSE_G04_L11_TI_003_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-003-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 27,
  swfSha256: "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  flaSha256: "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
  pairedFlaStatus: "present-partially-inspected",
  externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-346", sourceStaticFrameCount: 236,
  rootBeginFrame: 6, naturalQuizStopFrame: 235,
  candidateCleanBackgroundFrame: 230, sourceGridPointCount: 121,
  sourceInitialCoordinateCount: 14, sourceReplacementCoordinateCount: 18,
  sourceGlossaryVocabularyCount: 12, sourceHelpControlCount: 1,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-003/manifest.json",
  candidateManifestSha256:
    "2b24e64ae858a008bc64dc017c51ae9bfd5373b30382f6aa099feda534fc1e7b",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  sourceReplacementPoolNaturalBehaviorEstablished: false,
  sourceReplacementPoolRepairAuthorized: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_003_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-003",
  title: "Plot Ordered Pairs — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-003/canvas-renderer.js",
  assetSha256: "ec830525625558002f3988f8187764f85e998c69c6dd60729b0430ab367d041a",
  stage: Object.freeze({width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 799.9, height: 599.75,
    backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-346", mainFrameCount: 236,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-346-source-static-drawing", firstFrame: 1, lastFrame: 236,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains a 121-point coordinate-grid activity, Next Ordered Pair, Need More Help, twelve glossary controls, correct and wrong feedback, and Replay. The modern Lesson wrapper preserves those teaching functions with an accessible coordinate picker while the old course Shell remains excluded. AVM1 point hit geometry, eight embedded audio streams, host-selected feedback, the source arr.lenght replacement-pool defect, Spanish source parity, fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_003_FRAME_COUNT = 236 as const;
export const COURSE_G04_L11_TI_003_QUIZ_STOP_FRAME = 235 as const;
export const COURSE_G04_L11_TI_003_CLEAN_BACKGROUND_FRAME = 230 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 236) {
    throw new Error(`invalid TI003 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11Ti003CandidateCanvasFrame(logicalFrame: number) {
  const frame = exactFrame(logicalFrame);
  return frame < 235 ? frame : 230;
}

export const COURSE_G04_L11_TI_003_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_003_STATIC_SOURCE_FACTS,
  sourceFrameCount: 236, completeSourceStaticFrameMapping: true,
  naturalQuizStopModeled: false, frame235StaticExportUsedAsExecutedState: false,
  candidateQuizBackgroundFrame: 230,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceReplacementPoolNaturalBehaviorEstablished: false,
  sourceReplacementPoolRepairAuthorized: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
