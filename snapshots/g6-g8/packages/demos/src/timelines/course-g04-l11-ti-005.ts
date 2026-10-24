import {COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-005-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 29,
  swfSha256: "43c21cec5b8e67b8af70aca374aec4f2f46c43490e9a19c472798e606467362a",
  flaSha256: "166e659fbe37346ea7d4c2a8f437361471487f49a8fa3c4508b71455aa85c3f7",
  pairedFlaStatus: "present-partially-inspected", externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-342", sourceStaticFrameCount: 433,
  rootBeginFrame: 6, naturalQuestionStopFrame: 419,
  candidateCleanBackgroundFrame: 418, sourceEquation: "x + 3 = y",
  sourceRowCount: 5, sourcePlotPointControlCount: 5,
  sourceDrawLineThreshold: 5, sourceGlossaryVocabularyCount: 11,
  sourceHelpControlCount: 1,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-005/manifest.json",
  candidateManifestSha256:
    "e6e9f96666c3028af600569292c6d91bbf063831561f3415d409d2f29a8ae598",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  legacyCourseShellIncluded: false, registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_005_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-005",
  title: "Plot x + 3 = y — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-005/canvas-renderer.js",
  assetSha256: "eb20ffb868162b06bb84e8844d3b6e5b85928f7060bbdc787adc42468fc3e9a3",
  stage: Object.freeze({width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 799.9, height: 599.75,
    backgroundColor: "#b8d8f7"}), backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-342", mainFrameCount: 433,
  playbackMode: "once", strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-342-source-static-drawing", firstFrame: 1, lastFrame: 433,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains five y-value inputs, five Plot Point controls, a five-point-gated Draw Line control, Need More Help, eleven glossary controls, retry/automatic-reveal feedback, and Replay. The modern Lesson wrapper preserves those mathematical teaching functions while excluding the old course Shell, preloader, and player chrome. AVM1 execution, eight embedded audio streams, source Number coercion, Spanish source parity, fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_005_FRAME_COUNT = 433 as const;
export const COURSE_G04_L11_TI_005_QUESTION_STOP_FRAME = 419 as const;
export const COURSE_G04_L11_TI_005_CLEAN_BACKGROUND_FRAME = 418 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 433) {
    throw new Error(`invalid TI005 source frame: ${frame}`);
  }
  return frame;
}
export function getCourseG04L11Ti005CandidateCanvasFrame(logicalFrame: number) {
  const frame = exactFrame(logicalFrame); return frame < 419 ? frame : 418;
}

export const COURSE_G04_L11_TI_005_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_005_STATIC_SOURCE_FACTS,
  sourceFrameCount: 433, completeSourceStaticFrameMapping: true,
  naturalQuestionStopModeled: false, frame419StaticExportUsedAsExecutedState: false,
  candidateQuestionBackgroundFrame: 418, sourceAudioEnabled: false,
  sourceAudioAccepted: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, originalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  acceptanceEffect: "none",
});
