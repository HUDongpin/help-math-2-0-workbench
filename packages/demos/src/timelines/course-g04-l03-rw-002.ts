import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_RW_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW02.swf",
  swfSha256:
    "8b2aa7afd7e82fc582b8e7b936d178c87fea16106b26061f872c81ea7d422785",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
  associatedAudioSha256:
    "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e",
  embeddedAudioStreamSha256:
    "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c",
  spriteObjectId: 421,
  companionSpriteObjectId: 425,
  buttonObjectIds: Object.freeze([377, 378, 379]),
  sourceButtonPlacementFrame: 1099,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_219, y: 5_460}),
  rootPlacementPixels: Object.freeze({x: 360.95, y: 273}),
});

export const COURSE_G04_L03_RW_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-rw-002",
  title: "Page 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_RW_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-rw-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-421",
  mainFrameCount: 1289,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-425", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-numbers-number-line", firstFrame: 1, lastFrame: 1289}),
  ]),
  sourceControlBehaviorLabel:
    "Three source buttons, seven timeline-navigation signals, and their ActionScript behavior are disabled; byte-identical embedded and associated audio candidates are restored while synchronization and listening acceptance remain pending",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_RW_002_AUTHORITY = Object.freeze({
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
