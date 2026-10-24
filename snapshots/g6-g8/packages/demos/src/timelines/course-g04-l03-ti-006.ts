import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TI_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI06.swf",
  swfSha256: "8b1b570cb14dc3fd8f5a73920d0661b8a14c971eb477d5bfb6d8579f5ce842e8",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI06.fla",
  flaSha256: "4143f5a7ac3816078ee076adf5157ceba538c6599360ed2e387b1a687e3df5ae",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TI06.mp3",
  associatedAudioSha256: "c435c1947826678ff4058c58b89943f680408e229bfa5fdc0f0e669e635c4c31",
  associatedAudioTechnicalDurationMs: 18_384,
  spriteObjectId: 269,
  randomCalls: Object.freeze([Object.freeze({
    path: "DefineSprite_224/frame_2/DoAction.as",
    sha256: "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
    expression: "random(4)",
    disposition: "inventoried-not-executed",
  })]),
  branchSignalCount: 64,
  mouseEventSignalCount: 15,
  clipEventSignalCount: 5,
  keyboardEventSignalCount: 4,
  inputFieldSignalCount: 36,
  timelineNavigationOccurrenceCount: 71,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TI_006_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ti-006",
  title: "Question 5 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TI_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ti-006/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-269",
  mainFrameCount: 167,
  livePlaybackEndFrame: 166,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [158, 1], [201, 1], [202, 1], [203, 1], [204, 1], [205, 1], [207, 1],
    [208, 1], [209, 1], [210, 1], [211, 1], [222, 15], [224, 55], [228, 25],
    [230, 35], [263, 1], [265, 20], [268, 25],
  ].map(([id, frameCount]) => Object.freeze({
    id: `sprite-${id}`,
    frameCount,
    label: id === 224
      ? "Random feedback-audio companion"
      : "Statically reachable companion; runtime composition disabled",
  }))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "question-5-source-static-drawing",
    firstFrame: 1,
    lastFrame: 167,
  })]),
  sourceControlBehaviorLabel: "The companion random call, eleven source buttons, mouse/clip/keyboard/input behavior, seventy-one timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TI_006_AUTHORITY = Object.freeze({
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
