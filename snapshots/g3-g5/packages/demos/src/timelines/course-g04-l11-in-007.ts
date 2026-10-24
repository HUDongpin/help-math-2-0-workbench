import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_007_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 19,
  swfSha256: "f18fc0017197980cd8e4398b4320b82ca924d38466299f61e8664c8c039de97a",
  pairedFlaStatus: "missing",
  sourceStaticFrameDomain: "sprite-232", sourceStaticFrameCount: 137,
  sourceNaturalQuestionStopFrame: 66, sourceTerminalDefinitionFrame: 137,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-007/manifest.json",
  candidateManifestSha256:
    "219f5730ee2551727c2cd2541fe2e73a5a64927d2597ddc0b49f17b66f53408a",
  sourcePoint: "Z(7,5)", sourceChoiceCount: 3,
  sourcePrincipalGlossaryControlCount: 3, sourceWrongFeedbackTermCount: 5,
  sourceEmbeddedAudioEnabled: false, sourceExternalPageAudioPresent: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_007_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-007",
  title: "Name Points Practice — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-007/canvas-renderer.js",
  assetSha256: "ef2fe9ac2e9f261fac73fbdf323b29a03991f1ec4380e8991f7424e922565ae5",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-232", mainFrameCount: 137,
  livePlaybackEndFrame: 66, playbackMode: "once",
  strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({id: "sprite-232-source-static-drawing",
    firstFrame: 1, lastFrame: 137})]),
  sourceControlBehaviorLabel:
    "The source-bound sequence is queryable through frame 137; natural playback stops at 66 and the modern wrapper preserves point Z at (7,5), the three exact ordered-pair choices, wrong explanation and retry, correct feedback, and source glossary terms without old course-shell chrome, ActionScript globals, or audio",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
