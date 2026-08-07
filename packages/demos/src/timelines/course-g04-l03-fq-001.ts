import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_FQ_001_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ01.swf",
  swfSha256:
    "a7efda88b3246f34b35df08ef6feb718d00cda4850f458bb777357caa994e832",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ01.fla",
  flaSha256:
    "03ed6895b89b4a28334236c9b4e8516fe740f24be45b518997323c5284bbeb7e",
  embeddedAudioStreamCount: 0,
  sharedCatalogAudioGroupId: "course-g04-l03-fq-audio",
  sharedCatalogAudioAssociationCount: 108,
  spriteObjectId: 41,
  staticallyUnreachableSpriteObjectIds: Object.freeze([1, 2, 3, 4, 5]),
  terminalStopFrame: 52,
  inputAndKeyboardSignalCount: 40,
  inputOperationCount: 13,
  timelineNavigationOccurrenceCount: 19,
  replayResetOperationCount: 4,
  legacyComponentScriptCount: 2,
  maskCandidateCount: 0,
  morphDefinitionCount: 0,
  embeddedRasterDefinitionCount: 0,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_FQ_001_CONFIG = Object.freeze({
  animationId: "course-g04-l03-fq-001",
  title: "Final Quiz Introduction — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_FQ_001_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-fq-001/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-41",
  mainFrameCount: 52,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-22", frameCount: 1, label: "One-frame root structural companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "final-quiz-introduction", firstFrame: 1, lastFrame: 52}),
    Object.freeze({id: "terminal-stop-static-drawing", firstFrame: 52, lastFrame: 52}),
  ]),
  sourceControlBehaviorLabel:
    "Forty source input/keyboard signal candidates, nineteen timeline-navigation operations, thirteen input operations, four replay/reset candidates, two legacy component scripts, the 108-file shared Final Quiz audio group, and all ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_FQ_001_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  sourcePointerEventsEnabled: false,
  embeddedAudioRendered: false,
  sharedCatalogAudioRendered: false,
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
