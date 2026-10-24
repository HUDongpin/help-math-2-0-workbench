import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN02.swf",
  swfSha256:
    "60a1a78e5e927d6732c69518699caf71307e4f30da3b9e2bab29d0bab241989d",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN02.mp3",
  associatedAudioSha256:
    "65fbaef6b2a96b18da2bed86118a754d64c075af251bd5f0074ed16f5c40aafa",
  embeddedAudioStreamSha256:
    "ae955baab49711089ae10e2425bcce1e1327cadcd0f7f0d65039fe23ebb05263",
  spriteObjectId: 88,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-002",
  title:
    "Numbers on the Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-88",
  mainFrameCount: 492,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "page-title"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "numbers-on-number-line", firstFrame: 1, lastFrame: 492}),
  ]),
  sourceControlBehaviorLabel:
    "All six source buttons, nine timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_002_AUTHORITY = Object.freeze({
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
