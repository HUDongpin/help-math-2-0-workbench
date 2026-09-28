import {COURSE_G04_L11_GS_003_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-gs-003-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_GS_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 33,
  swfSha256: "3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  pairedFlaStatus: "missing", externalSpanishAudioStatus: "absent",
  sourceStaticFrameDomain: "sprite-231", sourceStaticFrameCount: 6,
  rootBeginFrame: 6, level1Frame: 3, level2Frame: 5,
  sourceActivity: "two-level Coordinate Grid Match Game",
  sourcePairCountPerLevel: 6, sourceScoreRule: Object.freeze({correct: 10,
    incorrect: -2}),
  candidateManifest: "public/flash-assets/courses/course-g04-l11-gs-003/manifest.json",
  candidateManifestSha256:
    "7ef47eb4722a36d464db27e403ce15840a0b5bccb893dabde9e5048f131a9aea",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_GS_003_CONFIG = Object.freeze({
  animationId: "course-g04-l11-gs-003",
  title: "Coordinate Grid Match Game — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_GS_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-gs-003/canvas-renderer.js",
  assetSha256: "c57f65336de029ec727b360ece54a271e5ef083b2ffd31019aeb4acb8b16a419",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600,
    backgroundColor: "#b8d8f7"}), backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-231", mainFrameCount: 6,
  playbackMode: "once", strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-231-source-static-drawing", firstFrame: 1, lastFrame: 6,
  })]),
  sourceControlBehaviorLabel:
    "The source controller exposes Level 1 and Level 2, six exact pairs per level, +10/−2 score updates, Repeat Directions, Start, level controls, Close, feedback, completion, and picture/music reveal obligations. The modern Lesson candidate preserves the internal teaching interactions, exact pair stems, score deltas, and visual reward while excluding the old course Shell, preloader, navigation, and player chrome. AVM1 execution, same-card and timing parity, four embedded streams, original-runtime evidence, visual fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_GS_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_GS_003_FRAME_COUNT = 6 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 6) {
    throw new Error(`invalid GS003 source frame: ${frame}`);
  }
  return frame;
}
export function getCourseG04L11Gs003CandidateCanvasFrame(frame: number) {
  return exactFrame(frame);
}

export const COURSE_G04_L11_GS_003_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_GS_003_STATIC_SOURCE_FACTS,
  sourceFrameCount: 6, completeSourceStaticFrameMapping: true,
  naturalEntryAndExecutedInteractionModeled: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  originalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, acceptanceEffect: "none",
});
