import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_RW_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW04.swf",
  swfSha256:
    "506c062e33d447d5837de2094e2d881581f602d7f10458b6eae2864e3b234710",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW04.mp3",
  associatedAudioSha256:
    "e14afaa951ea01d6e1e26b2fd641676628f92b4772a77c5d54f1f3031c5e10dd",
  embeddedAudioStreamSha256:
    "c411aa9bba9224dc19df665638720a2e776b65d7f2d675631a00b11b4b2a3e7d",
  spriteObjectId: 121,
  nestedSpriteObjectId: 82,
  nestedSpritePlacementFrame: 204,
  companionSpriteObjectId: 125,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

export const COURSE_G04_L03_RW_004_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-004",
  title: "Page 3 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_RW_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-rw-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-121",
  mainFrameCount: 442,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-125", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-numbers-number-line", firstFrame: 1, lastFrame: 442}),
  ]),
  sourceControlBehaviorLabel:
    "Both source buttons, six timeline-navigation signals, the nested sprite-82 playhead, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_RW_004_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  sourcePointerEventsEnabled: false,
  embeddedAudioRendered: false,
  associatedAudioRendered: false,
  spanishVisualRuntimeEstablished: false,
  rootCompositionEstablished: false,
  companionCompositionEstablished: false,
  nestedSpriteNaturalPlayheadEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
