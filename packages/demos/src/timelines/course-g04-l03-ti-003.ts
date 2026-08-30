import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TI_003_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI03.swf",
  swfSha256: "7abcc6151596b89d7b3142985bf8de2aae1d31ddb6eb47b14d2b9950c095a262",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI03.fla",
  flaSha256: "4670c0aa1e8bf7ccf7ffe83bcffd880daf95250c88dc8f528210b033113692d2",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TI03.mp3",
  associatedAudioSha256: "063887f58c7ab3b45bd62320cbb4bd95a90db93214e987ffbc001e9c4cb80799",
  associatedAudioTechnicalDurationMs: 15_336,
  spriteObjectId: 126,
  randomCalls: Object.freeze([Object.freeze({
    path: "DefineSprite_84/frame_2/DoAction.as",
    sha256: "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
    expression: "random(4)",
    disposition: "inventoried-not-executed",
  })]),
  branchSignalCount: 7,
  mouseEventSignalCount: 17,
  clipEventSignalCount: 6,
  timelineNavigationOccurrenceCount: 58,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TI_003_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ti-003",
  title: "Question 2 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TI_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ti-003/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#bddbf7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-126",
  mainFrameCount: 140,
  livePlaybackEndFrame: 139,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [13, 1], [55, 1], [56, 1], [58, 1], [59, 1], [60, 1], [61, 1],
    [62, 1], [63, 1], [64, 1], [65, 1], [66, 1], [67, 1], [78, 15],
    [82, 25], [84, 55], [86, 35], [88, 20], [125, 1],
  ].map(([id, frameCount]) => Object.freeze({
    id: `sprite-${id}`,
    frameCount,
    label: id === 84
      ? "Random feedback-audio companion"
      : "Statically reachable companion; runtime composition disabled",
  }))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "question-2-source-static-drawing",
    firstFrame: 1,
    lastFrame: 140,
  })]),
  sourceControlBehaviorLabel: "The companion random call, twelve source buttons, seventeen mouse-event signals, six clip-event signals, fifty-eight timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TI_003_AUTHORITY = Object.freeze({
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
