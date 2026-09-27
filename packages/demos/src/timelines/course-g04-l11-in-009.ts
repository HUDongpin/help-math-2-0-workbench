import {COURSE_G04_L11_IN_009_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-009-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_009_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 21,
  swfSha256: "37ac27c9373b85c47842feba978057a17680140bdadb57d596a810628447c8c3",
  pairedFlaStatus: "exact-source-present", sourceStaticFrameDomain: "sprite-288",
  sourceStaticFrameCount: 421, rootBeginFrame: 6, naturalQuizStopFrame: 407,
  sourceEquation: "x + 2 = y", sourceRowCount: 5,
  sourceAnimationInternalPedagogicalControlCount: 10,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-009/manifest.json",
  candidateManifestSha256:
    "82664d5ff40a37edfe461247acae53a5e0bc67311534923539f8c968b9b2a862",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_009_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-009",
  title: "Plot Points to Make a Line Practice — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_009_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-009/canvas-renderer.js",
  assetSha256: "b4f993bc364176ed8baa5c5a9db6fed4808de4bbce475b162f125134e945c186",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-288", mainFrameCount: 421,
  playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-288-source-static-drawing", firstFrame: 1, lastFrame: 421,
  })]),
  sourceControlBehaviorLabel:
    "The source animation contains five Plot Point controls, Draw Line, and four glossary controls; the modern Lesson wrapper preserves those teaching functions while the old course Shell remains excluded and AVM1, audio, natural entry, fidelity, acceptance, and release remain unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_009_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;

export const COURSE_G04_L11_IN_009_FRAME_COUNT = 421 as const;
export const COURSE_G04_L11_IN_009_QUIZ_STOP_FRAME = 407 as const;

export type CourseG04L11In009VisualPhase =
  | "source-build"
  | "quiz-entry-static-export"
  | "post-quiz-definition";

export interface CourseG04L11In009SourceFrameState {
  readonly animationId: "course-g04-l11-in-009";
  readonly frameDomain: "sprite-288";
  readonly sourceFrame: number;
  readonly sourceCanvasFrame: number;
  readonly phase: CourseG04L11In009VisualPhase;
  readonly naturalQuizStop: boolean;
  readonly interactionStateResolved: false;
  readonly frame407ScriptExecuted: false;
  readonly audioRendered: false;
  readonly acceptanceEffect: "none";
}

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 421) {
    throw new Error(`invalid IN009 source frame: ${frame}`);
  }
  return frame;
}

export function getCourseG04L11In009SourceFrameState(
  frame: number,
): CourseG04L11In009SourceFrameState {
  const sourceFrame = exactFrame(frame);
  const phase: CourseG04L11In009VisualPhase = sourceFrame <= 406
    ? "source-build"
    : sourceFrame === 407
      ? "quiz-entry-static-export"
      : "post-quiz-definition";
  return Object.freeze({
    animationId: "course-g04-l11-in-009",
    frameDomain: "sprite-288",
    sourceFrame,
    sourceCanvasFrame: sourceFrame,
    phase,
    naturalQuizStop: sourceFrame === 407,
    interactionStateResolved: false,
    frame407ScriptExecuted: false,
    audioRendered: false,
    acceptanceEffect: "none",
  });
}

export function getCourseG04L11In009CandidateCanvasFrame(
  logicalFrame: number,
  lineDrawn = false,
) {
  const frame = exactFrame(logicalFrame);
  if (frame < 407) return frame;
  return lineDrawn ? 421 : 406;
}

export const COURSE_G04_L11_IN_009_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_IN_009_STATIC_SOURCE_FACTS,
  sourceFrameCount: 421,
  completeSourceStaticFrameMapping: true,
  naturalQuizStopModeled: false,
  frame407StaticExportUsedAsExecutedState: false,
  candidateQuizBackgroundFrame: 406,
  candidateCompletedBackgroundFrame: 421,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  sourceDomainDeclared: false,
  registeredCurrentJavascript: false,
  originalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  acceptanceEffect: "none",
});
