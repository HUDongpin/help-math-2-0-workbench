import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TI_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI02.swf",
  swfSha256: "e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI02.fla",
  flaSha256: "3068bbd11d14c4226b961edc7cc31117ba71515546195782771749727c2bc7d3",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TI02.mp3",
  associatedAudioSha256: "befdf13400e6b46d9a82510efbd66676c955d266fbb6fbf31016e6b98a81e4ef",
  associatedAudioTechnicalDurationMs: 15_144,
  spriteObjectId: 272,
  randomCalls: Object.freeze([Object.freeze({
    path: "DefineSprite_269/frame_2/DoAction.as",
    sha256: "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
    expression: "random(4)",
    disposition: "inventoried-not-executed",
  })]),
  branchSignalCount: 11,
  mouseEventSignalCount: 28,
  clipEventSignalCount: 5,
  timelineNavigationOccurrenceCount: 77,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TI_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ti-002",
  title: "Question 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TI_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ti-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-272",
  mainFrameCount: 254,
  livePlaybackEndFrame: 238,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [55, 1], [128, 1], [129, 1], [130, 1], [131, 1], [132, 1], [133, 1],
    [134, 1], [135, 1], [136, 1], [137, 1], [138, 1], [139, 1], [140, 1],
    [141, 1], [159, 2], [169, 2], [174, 10], [175, 2], [178, 2], [182, 2],
    [186, 25], [188, 1], [194, 1], [202, 1], [205, 28], [217, 25], [231, 32],
    [252, 33], [263, 28], [267, 15], [269, 55], [271, 20],
  ].map(([id, frameCount]) => Object.freeze({
    id: `sprite-${id}`,
    frameCount,
    label: id === 269
      ? "Random feedback-audio companion"
      : "Statically reachable companion; runtime composition disabled",
  }))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "question-1-source-static-drawing",
    firstFrame: 1,
    lastFrame: 254,
  })]),
  sourceControlBehaviorLabel: "The companion random call, twenty source buttons, twenty-eight mouse-event signals, five clip-event signals, seventy-seven timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TI_002_AUTHORITY = Object.freeze({
  implementationAuthorized: false,
  registryIsPrototypeOnly: true,
  productRouteMayBeAdded: false,
  strictLedgerMayBeChanged: false,
  publicStrictLibraryAdmission: false,
  legacyActionScriptExecuted: false,
  sourceRandomExecuted: false,
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
