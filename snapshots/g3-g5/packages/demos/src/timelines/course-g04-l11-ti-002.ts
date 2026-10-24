import {COURSE_G04_L11_TI_002_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-ti-002-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_TI_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 26,
  swfSha256: "80c3b4c7ab4f69e0f7cc9f41cf8a6ca310d4724865d270f235cc580a4ea7df22",
  flaSha256: "dfd919b45da3817828cfd3accbdf238c510f5e29753f76a8c16b90c1a53ccec3",
  pairedFlaStatus: "present-uninspected", externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-325", sourceStaticFrameCount: 247,
  rootBeginFrame: 6, naturalQuizStopFrame: 230,
  sourceTermCount: 5, sourceTargetCount: 5, sourcePictureControlCount: 5,
  sourceGlossaryVocabularyCount: 15,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-ti-002/manifest.json",
  candidateManifestSha256:
    "e072366f0b183cb25d386364930d749027be6616b4e4aae795548c81901cbcfe",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TI_002_CONFIG = Object.freeze({
  animationId: "course-g04-l11-ti-002",
  title: "Coordinate Grid matching — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_TI_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-ti-002/canvas-renderer.js",
  assetSha256: "9c9d06783e833d82ce4bccc3d414933341c33fd21d86cbf2acd4dc2685af9dc9",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-325", mainFrameCount: 247,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-325-source-static-drawing", firstFrame: 1, lastFrame: 247,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains five draggable terms, five target rows, five picture enlargement controls, glossary-linked teaching terms, retry popup, feedback and coach-audio branches; the modern Lesson wrapper preserves those teaching functions while the old course Shell remains excluded and AVM1, eight embedded audio streams, natural drag geometry, random host selection, fidelity, acceptance, and release remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_TI_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_TI_002_FRAME_COUNT = 247 as const;
export const COURSE_G04_L11_TI_002_QUIZ_STOP_FRAME = 230 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 247) {
    throw new Error(`invalid TI002 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11Ti002CandidateCanvasFrame(
  logicalFrame: number,
  completed = false,
) {
  const frame = exactFrame(logicalFrame);
  if (frame < 230) return frame;
  return completed ? 247 : 229;
}

export const COURSE_G04_L11_TI_002_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_TI_002_STATIC_SOURCE_FACTS,
  sourceFrameCount: 247, completeSourceStaticFrameMapping: true,
  naturalQuizStopModeled: false, frame230StaticExportUsedAsExecutedState: false,
  candidateQuizBackgroundFrame: 229, candidateCompletedBackgroundFrame: 247,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
