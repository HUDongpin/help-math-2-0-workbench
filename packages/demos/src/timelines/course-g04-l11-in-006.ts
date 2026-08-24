import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_006_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 18,
  swfSha256: "2cc6448c72aa766a969def0c6fb1363e59120bbeff8599c955ecc824e4a4010f",
  flaSha256: "ecc3ec6bb04f459ccd417604101208baf032459c148246c4738f6ce5a4b13855",
  sourceStaticFrameDomain: "sprite-137", sourceStaticFrameCount: 287,
  sourceNaturalPracticeStopFrame: 275, sourceTerminalDefinitionFrame: 287,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-006/manifest.json",
  candidateManifestSha256: "28dfb6424be22f18599c3aa6f551388908ee350a3d157e6f69d529e821bd9cdc",
  sourcePointCount: 4, sourceEditableCoordinateFieldCount: 8,
  sourceGlossaryControlCount: 6, sourceWrongAnswerAttemptCount: 2,
  sourceEmbeddedAudioEnabled: false, sourceExternalSpanishAudioEnabled: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_006_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-006",
  title: "Name Points Practice — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-006/canvas-renderer.js",
  assetSha256: "5cef358ff4e3d09f09671387669d91f6844d0edfe92a3b590c2aefd9edcf52f3",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-137", mainFrameCount: 287,
  livePlaybackEndFrame: 275, playbackMode: "once",
  strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({id: "sprite-137-source-static-drawing",
    firstFrame: 1, lastFrame: 287})]),
  sourceControlBehaviorLabel:
    "The source-bound sequence is queryable through frame 287; natural playback stops at 275 and the modern wrapper preserves four point selections, eight editable coordinate fields, Done/Clear, first-error retry, second-error answer reveal, correct feedback, and six glossary controls without old course-shell chrome, ActionScript globals, or audio",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
