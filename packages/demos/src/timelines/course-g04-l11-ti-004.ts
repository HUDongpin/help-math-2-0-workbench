import {COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-004-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_004_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 28,
  swfSha256: "84b1c705d5f6799b09ceb295f52219c9d2bf7c39cfbe88ca6330be8fa5dd0511",
  flaSha256: "f093747b59dbc2f2c095e00f8ebd883899a4a4c7c448058a6773cc76369ab357",
  pairedFlaStatus: "present-partially-inspected",
  externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-423", sourceStaticFrameCount: 275,
  rootBeginFrame: 6, naturalQuestionStopFrame: 274,
  candidateCleanBackgroundFrame: 273, sourcePointCount: 5,
  sourceCoordinateInputCount: 10, sourceGlossaryVocabularyCount: 12,
  sourceHelpControlCount: 1,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-004/manifest.json",
  candidateManifestSha256:
    "73247eae8a9cdcae94e22c2256dac40fdcd55be0ce77e541cc76368cac4bc780",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  sourceClearFieldResetEstablished: false,
  modernBoundedSelectedRowResetApplied: true,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_004_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-004",
  title: "Enter Coordinates for Points — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-004/canvas-renderer.js",
  assetSha256: "98d192959a70e1e173a9b47b03388e021a7be89f114c1756a9435c2c9159fa4c",
  stage: Object.freeze({width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 799.9, height: 599.75,
    backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-423", mainFrameCount: 275,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-423-source-static-drawing", firstFrame: 1, lastFrame: 275,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains five selectable coordinate-grid points, ten coordinate text inputs, Done, Clear, Need More Help, twelve glossary controls, two-attempt feedback, and Replay. The modern Lesson wrapper preserves those mathematical teaching functions while excluding the old course Shell, preloader, and player chrome. AVM1 execution, twelve embedded audio streams, source parseInt coercion, exact source field-reset behavior, Spanish source parity, fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_004_FRAME_COUNT = 275 as const;
export const COURSE_G04_L11_TI_004_QUESTION_STOP_FRAME = 274 as const;
export const COURSE_G04_L11_TI_004_CLEAN_BACKGROUND_FRAME = 273 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 275) {
    throw new Error(`invalid TI004 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11Ti004CandidateCanvasFrame(logicalFrame: number) {
  const frame = exactFrame(logicalFrame);
  return frame < 274 ? frame : 273;
}

export const COURSE_G04_L11_TI_004_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_004_STATIC_SOURCE_FACTS,
  sourceFrameCount: 275, completeSourceStaticFrameMapping: true,
  naturalQuestionStopModeled: false, frame274StaticExportUsedAsExecutedState: false,
  candidateQuestionBackgroundFrame: 273,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceClearFieldResetEstablished: false,
  modernBoundedSelectedRowResetApplied: true,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
