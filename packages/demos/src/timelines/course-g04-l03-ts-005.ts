import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TS_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS05.swf",
  swfSha256:
    "877b15eb4a1454a30fabe607e5dc20b4bacb58364fe589b560daa19b83655312",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS05.fla",
  flaSha256:
    "bcc558c091fc69af5cbd49c630ce134a006da579bdbfd0a08783d54f18b95c89",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS05.mp3",
  associatedAudioSha256:
    "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
  embeddedAudioStreamSha256:
    "b3f26fee8a0ee5be53bbbdf8a000ae7056e1f26fd44f6409a462ada99cf2aebb",
  spriteObjectId: 40,
  companionSpriteObjectId: 3,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 7_477, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 373.85, y: 283.3}),
});

export const COURSE_G04_L03_TS_005_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-005",
  title: "4 - Step Plan — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_005_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-ts-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-40",
  mainFrameCount: 275,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-3", frameCount: 1, label: "Page title companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan", firstFrame: 1, lastFrame: 275}),
  ]),
  sourceControlBehaviorLabel:
    "All nine source buttons, thirteen timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_005_AUTHORITY = Object.freeze({
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
