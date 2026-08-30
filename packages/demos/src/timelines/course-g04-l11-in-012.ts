import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_012_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid", releaseOrdinal: 24,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN12.swf",
  swfSha256: "8c77afe6a63ff8254be0307f90b3e3f15dd9d1243fc370550af8c5049a341cb2",
  pairedFlaStatus: "missing",
  externalSpanishAudio: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11IN12.mp3",
    bytes: 320_208,
    sha256: "4e152e75d4c5eb99bd29b20729c57b53c6f40bd946f33e3fe7bbb3ff914a619f",
    enabled: false, accepted: false,
  }),
  sourceStaticFrameDomain: "sprite-68", sourceStaticFrameCount: 440,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({instanceName: "animation", depth: "3",
    placementTwips: Object.freeze({x: 8_268, y: 5_666}),
    placementPixels: Object.freeze({x: 413.4, y: 283.3})}),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-in-012/manifest.json",
  candidateManifestSha256:
    "74051112e6eb4c6c343484629c77772867bd2f12e34ca10f6c7096788addb0a9",
  actionScriptExecuted: false, sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false, sourceButtonDefinitionCount: 2,
  modernPedagogicalControlCount: 2, sourceTerminalBehaviorEstablished: false,
  legacyCourseShellIncluded: false, registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_012_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-012",
  title: "Find the Length of Line Segments — unregistered Lesson candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_012_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l11-in-012/canvas-renderer.js",
  assetSha256: "61090b272a9da16a6910f84a9b9f1f0d5a277f415016215a24922a1055447932",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  nativeStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  backingStage: Object.freeze({width: 800, height: 600}), fps: 12,
  rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: "sprite-68",
  mainFrameCount: 440, playbackMode: "once", strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-68-ffdec-source-static-drawing", firstFrame: 1, lastFrame: 440})]),
  sourceControlBehaviorLabel:
    "Two glossary controls are modernized outside the Canvas runtime; old Shell navigation and player chrome, AVM1, embedded narration, external Spanish audio, Spanish source visuals, natural entry, terminal behavior, fidelity, and acceptance remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_012_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
