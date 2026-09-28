import {COURSE_G04_L11_GS_002_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-gs-002-static";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_GS_002_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 32,
  swfSha256: "1ab04fa783eed441afdf386261bd6816e9084082db3b5cfce8fc63360f9167fd",
  pairedFlaStatus: "missing", externalSpanishAudioStatus: "absent",
  sourceStaticFrameDomain: "sprite-227", sourceStaticFrameCount: 729,
  rootBeginFrame: 6, repeatDirectionsLabelFrame: 4,
  selectLevelStopFrame: 728, candidateCleanBackgroundFrame: 727,
  sourceActivity: "matching-game directions and Level 1 or Level 2 selection",
  sourceDirectionAndLaunchControlCount: 6, sourceGlossaryControlCount: 1,
  delegatedGameAnimationId: "course-g04-l11-gs-003",
  candidateManifest: "public/flash-assets/courses/course-g04-l11-gs-002/manifest.json",
  candidateManifestSha256:
    "1fa8dd6fc3fac8c67caece9fc7f4ad3f2ffb15607cbd621a8cbbb31e7bec3d07",
  sourceEmbeddedAudioEnabled: false, sourceEmbeddedAudioAccepted: false,
  hostHandoffSemanticsEstablished: false, legacyCourseShellIncluded: false,
  registered: false, strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_GS_002_CONFIG = Object.freeze({
  animationId: "course-g04-l11-gs-002",
  title: "Coordinate Grid Match directions — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_GS_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-gs-002/canvas-renderer.js",
  assetSha256: "4aaeae6d956026ca0f7d840fbd6eb8ef29fd22f4909232f6075623d97eb0b545",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600,
    backgroundColor: "#b8d8f7"}), backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-227", mainFrameCount: 729,
  playbackMode: "once", strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-227-source-static-drawing", firstFrame: 1, lastFrame: 729,
  })]),
  sourceControlBehaviorLabel:
    "The source animation presents matching-game directions, a +10/-2 score rule, Skip Directions, Repeat Directions, Level 1, Level 2, Start, Close, and a Pair glossary link. The modern Lesson wrapper preserves those mathematical teaching functions while excluding the old course Shell, preloader, navigation, and player chrome. The actual matching game remains the separate GS003 member. AVM1 execution, two embedded streams, exact doNeedMoreHelp host semantics, Spanish parity, fidelity, acceptance, and release remain unresolved.",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_GS_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
export const COURSE_G04_L11_GS_002_FRAME_COUNT = 729 as const;
export const COURSE_G04_L11_GS_002_SELECT_LEVEL_STOP_FRAME = 728 as const;
export const COURSE_G04_L11_GS_002_CLEAN_BACKGROUND_FRAME = 727 as const;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 729) {
    throw new Error(`invalid GS002 source frame: ${frame}`);
  }
  return frame;
}
export function getCourseG04L11Gs002CandidateCanvasFrame(logicalFrame: number,
  interactionVisible = false) {
  const frame = exactFrame(logicalFrame);
  return interactionVisible && frame >= 728 ? 727 : frame;
}

export const COURSE_G04_L11_GS_002_SOURCE_TIMELINE_AUTHORITY = Object.freeze({
  sourceFacts: COURSE_G04_L11_GS_002_STATIC_SOURCE_FACTS,
  sourceFrameCount: 729, completeSourceStaticFrameMapping: true,
  naturalDirectionsAndSelectionModeled: false,
  frame728StaticExportUsedAsExecutedState: false,
  candidateInteractionBackgroundFrame: 727, sourceAudioEnabled: false,
  sourceAudioAccepted: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, originalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  acceptanceEffect: "none",
});
