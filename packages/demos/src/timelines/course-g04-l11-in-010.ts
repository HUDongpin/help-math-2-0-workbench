import {COURSE_G04_L11_IN_010_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-010-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_010_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 22,
  swfSha256: "8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  pairedFlaStatus: "exact-source-present", sourceStaticFrameDomain: "sprite-246",
  sourceStaticFrameCount: 277, rootBeginFrame: 6, naturalQuizStopFrame: 191,
  sourceEquation: "2x = y", sourceAnswerCount: 3,
  sourceAnimationInternalPedagogicalControlCount: 8,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-010/manifest.json",
  candidateManifestSha256:
    "37b26b27982773842a3d836d73384d792c67c189a21d7d978908de45641c8af5",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_010_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-010",
  title: "Plot Points to Make a Line Practice — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_010_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-010/canvas-renderer.js",
  assetSha256: "5dd97fdb1b483f38d44f58c64b5103a662a4350a3ad4b8485cf13698e5b94275",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-246", mainFrameCount: 277,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-246-source-static-drawing", firstFrame: 1, lastFrame: 277,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains three answer choices, four glossary controls, and a wrong-feedback Close/retry loop; the modern Lesson wrapper preserves those teaching functions while the old course Shell remains excluded and AVM1, audio, host-selected feedback timing, fidelity, acceptance, and release remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_010_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_IN_010_FRAME_COUNT = 277 as const;
export const COURSE_G04_L11_IN_010_QUIZ_STOP_FRAME = 191 as const;

export type CourseG04L11In010VisualPhase =
  | "source-build"
  | "quiz-entry-static-export"
  | "post-correct-definition";

export interface CourseG04L11In010SourceFrameState {
  readonly animationId: "course-g04-l11-in-010";
  readonly frameDomain: "sprite-246";
  readonly sourceFrame: number;
  readonly sourceCanvasFrame: number;
  readonly phase: CourseG04L11In010VisualPhase;
  readonly naturalQuizStop: boolean;
  readonly interactionStateResolved: false;
  readonly frame191ScriptExecuted: false;
  readonly audioRendered: false;
  readonly acceptanceEffect: "none";
}

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 277) {
    throw new Error(`invalid IN010 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11In010SourceFrameState(
  frame: number,
): CourseG04L11In010SourceFrameState {
  const sourceFrame = exactFrame(frame);
  const phase: CourseG04L11In010VisualPhase = sourceFrame <= 190
    ? "source-build"
    : sourceFrame === 191
      ? "quiz-entry-static-export"
      : "post-correct-definition";
  return Object.freeze({
    animationId: "course-g04-l11-in-010", frameDomain: "sprite-246",
    sourceFrame, sourceCanvasFrame: sourceFrame, phase,
    naturalQuizStop: sourceFrame === 191, interactionStateResolved: false,
    frame191ScriptExecuted: false, audioRendered: false, acceptanceEffect: "none",
  });
}

export function getCourseG04L11In010CandidateCanvasFrame(
  logicalFrame: number,
  postCorrect = false,
) {
  const frame = exactFrame(logicalFrame);
  if (frame < 191) return frame;
  return postCorrect ? Math.max(192, frame) : 190;
}

export const COURSE_G04_L11_IN_010_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_IN_010_STATIC_SOURCE_FACTS,
  sourceFrameCount: 277, completeSourceStaticFrameMapping: true,
  naturalQuizStopModeled: false, frame191StaticExportUsedAsExecutedState: false,
  candidateQuizBackgroundFrame: 190, candidateCompletedBackgroundFrame: 277,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceDomainDeclared: true, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
