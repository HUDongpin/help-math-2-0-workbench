import {COURSE_G04_L11_IN_013_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-013-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_013_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 25,
  swfSha256: "9565fafc4a24c57f2b122fe2cbba59bdab66f551e758c077929f0d01549e2c49",
  pairedFlaStatus: "missing", externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-224", sourceStaticFrameCount: 67,
  rootBeginFrame: 6, naturalQuizStopFrame: 49,
  sourceAnswerControlCount: 3, sourceGlossaryControlCount: 2,
  sourceAnimationInternalPedagogicalControlCount: 5,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-013/manifest.json",
  candidateManifestSha256:
    "d528673eba2df6377618b8e6abd4d715808db2ad42ae16d3ae7d3d26bade3b47",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceFeedbackVariantSelectionEstablished: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_013_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-013",
  title: "Length of Line Segment Practice — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_013_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-013/canvas-renderer.js",
  assetSha256: "3d0cccb75a12617e1e23b17179b751786bc5e01a5eb00a162da140c91a204dfa",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-224", mainFrameCount: 67,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-224-source-static-drawing", firstFrame: 1, lastFrame: 67,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains three answer choices and two glossary controls; the modern Lesson wrapper preserves those teaching functions while the old course Shell remains excluded and AVM1, eleven embedded audio streams, host-selected feedback variants, natural branch timing, fidelity, acceptance, and release remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_013_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_IN_013_FRAME_COUNT = 67 as const;
export const COURSE_G04_L11_IN_013_QUIZ_STOP_FRAME = 49 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 67) {
    throw new Error(`invalid IN013 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11In013CandidateCanvasFrame(
  logicalFrame: number,
  postCorrect = false,
) {
  const frame = exactFrame(logicalFrame);
  if (frame < 49) return frame;
  return postCorrect ? Math.max(50, frame) : 48;
}

export const COURSE_G04_L11_IN_013_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_IN_013_STATIC_SOURCE_FACTS,
  sourceFrameCount: 67, completeSourceStaticFrameMapping: true,
  naturalQuizStopModeled: false, frame49StaticExportUsedAsExecutedState: false,
  candidateQuizBackgroundFrame: 48, candidateCompletedBackgroundFrame: 67,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
