import {COURSE_G04_L11_TI_007_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-007-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 31,
  swfSha256: "b358b553e11311b7b2576e293ec9a587dd618969d009ed1c5639eafe3feb6a0b",
  flaSha256: "857891e9c56d2f998cf5954ec243e226c3ccd283da3fdde65308d5d61cb2e568",
  pairedFlaStatus: "present-partially-inspected",
  externalSpanishAudioStatus: "absent",
  sourceStaticFrameDomain: "sprite-258", sourceStaticFrameCount: 143,
  rootBeginFrame: 6, naturalQuestionStopFrame: 119,
  candidateCleanBackgroundFrame: 118,
  sourceQuestion: "horizontal segment from (9,1) to (4,1)",
  sourceAnswerChoiceControlCount: 3, sourceCorrectChoice: "5 units",
  sourceGlossaryVocabularyCount: 8, sourceHelpControlCount: 1,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-007/manifest.json",
  candidateManifestSha256:
    "c6ea857092d92f9d423c19627e44cb68d6b3b82c77347197aa1a2eefae534877",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  legacyCourseShellIncluded: false, registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_007_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-007",
  title: "Find horizontal segment length — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-007/canvas-renderer.js",
  assetSha256: "1206fa5b666fae841008c0c951b640a74d297e4df11bbbaa442a603a5feacf0f",
  stage: Object.freeze({width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 799.9, height: 599.75,
    backgroundColor: "#b8d8f7"}), backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-258", mainFrameCount: 143,
  playbackMode: "once", strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-258-source-static-drawing", firstFrame: 1, lastFrame: 143,
  })]),
  sourceControlBehaviorLabel:
    "The source animation asks for the length of the horizontal segment from (9,1) to (4,1), offers three answer controls, Need More Help, eight glossary controls, retry feedback, right feedback, and Replay. The modern Lesson wrapper preserves those mathematical teaching functions while excluding the old course Shell, preloader, navigation, and player chrome. AVM1 execution, seven embedded audio streams, exact host-selected feedback, Spanish source visual parity, fidelity, acceptance, and release remain unresolved; no external Spanish audio file is bound.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_007_FRAME_COUNT = 143 as const;
export const COURSE_G04_L11_TI_007_QUESTION_STOP_FRAME = 119 as const;
export const COURSE_G04_L11_TI_007_CLEAN_BACKGROUND_FRAME = 118 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 143) {
    throw new Error(`invalid TI007 source frame: ${frame}`);
  }
  return frame;
}
export function getCourseG04L11Ti007CandidateCanvasFrame(logicalFrame: number,
  completed = false) {
  const frame = exactFrame(logicalFrame);
  if (completed) return Math.max(120, frame);
  return frame < 119 ? frame : 118;
}

export const COURSE_G04_L11_TI_007_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_007_STATIC_SOURCE_FACTS,
  sourceFrameCount: 143, completeSourceStaticFrameMapping: true,
  naturalQuestionStopModeled: false, frame119StaticExportUsedAsExecutedState: false,
  candidateQuestionBackgroundFrame: 118, sourceAudioEnabled: false,
  sourceAudioAccepted: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, originalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  acceptanceEffect: "none",
});
