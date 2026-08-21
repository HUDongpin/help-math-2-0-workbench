import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_011_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 23,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN11.swf",
  swfSha256: "94d7cb372e19e6f641eb5e51633e86b57ceb818b5a7a148fe02925e141252364",
  pairedFlaStatus: "missing", externalSpanishAudioStatus: "missing",
  sourceStaticFrameDomain: "sprite-57", sourceStaticFrameCount: 835,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({instanceName: "animation", depth: "3",
    placementTwips: Object.freeze({x: 8_268, y: 5_666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3})}),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-in-011/manifest.json",
  candidateManifestSha256:
    "9f6696550a417751568b863ef77662aad89bc4c29e6e6f06621d32a304ce9e53",
  actionScriptExecuted: false, sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false, sourceButtonDefinitionCount: 5,
  modernPedagogicalControlCount: 5, sourceTerminalBehaviorEstablished: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_011_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-011",
  title: "Find the Length of Line Segments — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_011_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-011/canvas-renderer.js",
  assetSha256: "158cb15fe19b62a1aab1acb7874ce19140b0c56a45561b4527d2ac1099afa691",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}), fps: 12,
  rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: "sprite-57",
  mainFrameCount: 835, playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-57-ffdec-source-static-drawing", firstFrame: 1, lastFrame: 835})]),
  sourceControlBehaviorLabel:
    "Five glossary controls are modernized outside the Canvas runtime; old Shell navigation and player chrome, AVM1, embedded narration, Spanish source visuals, natural entry, terminal behavior, fidelity, and acceptance remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_011_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
