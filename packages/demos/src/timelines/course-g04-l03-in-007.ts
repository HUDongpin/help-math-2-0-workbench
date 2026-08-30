import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN07.swf",
  swfSha256:
    "91c013434558ec9d6b49df67ae29106073b1a98de19099fdda26ab8d5f2d8d45",
  fla: null,
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN07.mp3",
  associatedAudioSha256:
    "96447525dc60534210a1752626bb9a627df2ce815339fded5ae2e13447fc10aa",
  embeddedAudioStreamSha256:
    "35e62bb8ad052e76e20331722668f979a15588e6dbe39623a41291e0848fcaad",
  spriteObjectId: 98,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_007_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-007",
  title: "Patterns — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-98",
  mainFrameCount: 555,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "page-title"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-number-patterns", firstFrame: 1, lastFrame: 555}),
  ]),
  sourceControlBehaviorLabel:
    "All four source buttons, seven timeline-navigation signals, the embedded stream audio, the associated catalog-audio path, and their ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_007_AUTHORITY = Object.freeze({
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
