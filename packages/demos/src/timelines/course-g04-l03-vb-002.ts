import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB02.swf",
  swfSha256:
    "0e378f21899cd615107a08a085b4f37b96066e49e409eb9793219f7c953eb4f3",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB02.fla",
  flaSha256:
    "e47d05e8ebbd23f9b573ebee9041fca72277a015d76180aae0eefd7a8da65dd0",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB02.mp3",
  associatedAudioSha256:
    "a611b160a2dec23c7e2368a72661a03f8b291e586d5148d048d48f16c8daa610",
  embeddedAudioSha256:
    "4b00a2b44e86ef46ff876850a09073f12790bb107e92b8072840fc0ebacee78f",
  spriteObjectId: 52,
  companionSpriteObjectId: 5,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G04_L03_VB_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-002",
  title: "Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-52",
  mainFrameCount: 193,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "number-line", firstFrame: 1, lastFrame: 193}),
  ]),
  sourceControlBehaviorLabel:
    "All six source buttons, embedded stream audio, the associated Spanish audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_002_AUTHORITY = Object.freeze({
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
