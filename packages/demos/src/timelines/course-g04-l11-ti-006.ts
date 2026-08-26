import {COURSE_G04_L11_TI_006_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-006-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 30,
  swfSha256: "78b289bf76bf28941755bc30a96d0131bb3b804c115c85b75e187b085515f33e",
  flaSha256: "56d683bc918652b7f520a8b94922b3d27cfe85636984ba9ec95853b48a326e42",
  pairedFlaStatus: "present-partially-inspected",
  externalSpanishAudioStatus: "present-unaccepted",
  sourceStaticFrameDomain: "sprite-259", sourceStaticFrameCount: 95,
  rootBeginFrame: 6, naturalQuestionStopFrame: 76,
  candidateCleanBackgroundFrame: 75,
  sourceQuestion: "vertical segment from (2,5) to (2,8)",
  sourceAnswerChoiceControlCount: 3, sourceCorrectChoice: "3 units",
  sourceGlossaryVocabularyCount: 8, sourceHelpControlCount: 1,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-006/manifest.json",
  candidateManifestSha256:
    "24d181b8bcf097e2d9b53139cba9e90bf9df7ee97a65bab3480cde0bed3cce24",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  legacyCourseShellIncluded: false, registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_006_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-006",
  title: "Find vertical segment length — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-006/canvas-renderer.js",
  assetSha256: "51fb52c0a9820c92e87fba085ceba532bd51553e46238a5412eeb736b6f36723",
  stage: Object.freeze({width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 799.9, height: 599.75,
    backgroundColor: "#b8d8f7"}), backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-259", mainFrameCount: 95,
  playbackMode: "once", strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-259-source-static-drawing", firstFrame: 1, lastFrame: 95,
  })]),
  sourceControlBehaviorLabel:
    "The source animation asks for the length of the vertical segment from (2,5) to (2,8), offers three answer controls, Need More Help, eight glossary controls, retry feedback, right feedback, and Replay. The modern Lesson wrapper preserves those mathematical teaching functions while excluding the old course Shell, preloader, navigation, and player chrome. AVM1 execution, seven embedded audio streams, exact host-selected feedback, external Spanish audio, fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_006_FRAME_COUNT = 95 as const;
export const COURSE_G04_L11_TI_006_QUESTION_STOP_FRAME = 76 as const;
export const COURSE_G04_L11_TI_006_CLEAN_BACKGROUND_FRAME = 75 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 95) {
    throw new Error(`invalid TI006 source frame: ${frame}`);
  }
  return frame;
}
export function getCourseG04L11Ti006CandidateCanvasFrame(logicalFrame: number,
  completed = false) {
  const frame = exactFrame(logicalFrame);
  if (completed) return Math.max(77, frame);
  return frame < 76 ? frame : 75;
}

export const COURSE_G04_L11_TI_006_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_006_STATIC_SOURCE_FACTS,
  sourceFrameCount: 95, completeSourceStaticFrameMapping: true,
  naturalQuestionStopModeled: false, frame76StaticExportUsedAsExecutedState: false,
  candidateQuestionBackgroundFrame: 75, sourceAudioEnabled: false,
  sourceAudioAccepted: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, originalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  acceptanceEffect: "none",
});
