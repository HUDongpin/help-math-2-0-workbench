import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_011_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN11.swf",
  swfSha256:
    "a106b7a889b5da08377181e0e9d0e9ea2c59163103be0898fd5090f1a13fe1df",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN11.mp3",
  associatedAudioSha256:
    "d97d7e3b9cf9086c7dcfeadad8ecace32e5a66d545fec346c4b535423816913d",
  embeddedAudioStreamSha256:
    "0b1619190c83740dc5dbd120905eda3f4343a04706d8568c6943843de61228e0",
  spriteObjectId: 51,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_011_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-011",
  title:
    "Situations with Negative Numbers: Owing — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_011_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-011/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-51",
  mainFrameCount: 441,
  playbackMode: "once",
  companionDomains: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "owing-situation", firstFrame: 1, lastFrame: 441}),
  ]),
  sourceControlBehaviorLabel:
    "Both source buttons, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_011_AUTHORITY = Object.freeze({
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
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
