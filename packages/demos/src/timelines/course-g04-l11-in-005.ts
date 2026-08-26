import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_005_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 17,
  swfSha256: "40dbbb3dabe3a762ee9da5c2a9e9d7a69bbb5c4f7647a28bbd6a94bc563ec25a",
  flaSha256: "451818ef506b72bda7955f503ad436e7379d72409dcd0dc8da754c5871461f5a",
  sourceStaticFrameDomain: "sprite-137", sourceStaticFrameCount: 661,
  sourceNaturalHoverStopFrame: 647, sourceTerminalDefinitionFrame: 661,
  candidateManifest: "public/flash-assets/courses/course-g04-l11-in-005/manifest.json",
  candidateManifestSha256: "f695b0dd7a7b046c97ffd30a204a8062abd3163a19dc153f7c181cb7cd7c6334",
  sourcePointCount: 6, sourceGlossaryControlCount: 3,
  sourceEmbeddedAudioEnabled: false, sourceExternalSpanishAudioEnabled: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_005_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-005",
  title: "Name Points on a Coordinate Grid — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-005/canvas-renderer.js",
  assetSha256: "c119630063031aeb81d484ade8230516369512c0fbd2cc921e51298f974cc4e9",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-137", mainFrameCount: 661,
  livePlaybackEndFrame: 647, playbackMode: "once",
  strictCaptureIdentity: true, blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({id: "sprite-137-source-static-drawing",
    firstFrame: 1, lastFrame: 661})]),
  sourceControlBehaviorLabel:
    "The source-bound sequence is queryable through frame 661; natural playback stops at 647 and the modern wrapper preserves the six point-coordinate reveals and three glossary controls without old course-shell chrome, ActionScript globals, or audio",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
