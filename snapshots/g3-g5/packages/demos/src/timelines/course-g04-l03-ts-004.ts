import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TS_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS04.swf",
  swfSha256:
    "ec56922f78cb0096feb504be6b35a0957e5d178b703e0b586d0ed949f620ab76",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS04.mp3",
  associatedAudioSha256:
    "a2505e6988cca2f44777711d87175b385564a51c2cb5284c05d6246635cf5dbf",
  embeddedAudioStreamSha256:
    "391c37eb6f1d942a14c02150e9dc6b54dfc186a81caebd3e6f126b9dd8313ce2",
  spriteObjectId: 70,
  companionSpriteObjectId: 3,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_430, y: 5_667}),
  rootPlacementPixels: Object.freeze({x: 371.5, y: 283.35}),
});

export const COURSE_G04_L03_TS_004_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-004",
  title: "4 - Step Plan — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_004_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-ts-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-70",
  mainFrameCount: 336,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-3", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan", firstFrame: 1, lastFrame: 336}),
  ]),
  sourceControlBehaviorLabel:
    "All ten source buttons, thirteen timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_004_AUTHORITY = Object.freeze({
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
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
