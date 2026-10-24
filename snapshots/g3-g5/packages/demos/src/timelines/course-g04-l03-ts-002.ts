import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TS_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS02.swf",
  swfSha256:
    "777224c6e7c1da786ce6f4af46532cb1617aaa0020c214e15cc6e2539c71e831",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS02.fla",
  flaSha256:
    "bf845949c452769c083fff279863d10c313a0550c20a200cc747b715f80b9f12",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS02.mp3",
  associatedAudioSha256:
    "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
  embeddedAudioStreamSha256:
    "3f47325f09641062c5437e8f0f87f57785f06269102cdb186efc03ed123bcde1",
  spriteObjectId: 27,
  companionSpriteObjectId: 3,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TS_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-002",
  title: "4 - Step Plan — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-ts-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-27",
  mainFrameCount: 355,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-3", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan", firstFrame: 1, lastFrame: 355}),
  ]),
  sourceControlBehaviorLabel:
    "All three source buttons, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_002_AUTHORITY = Object.freeze({
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
