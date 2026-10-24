import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TI_004_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI04.swf",
  swfSha256: "04145dae5f7b295bed7ed882689be12ca7c4d31ef392a496d1c741ba1915a43c",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI04.fla",
  flaSha256: "68837d6c25eb947fcb76a7ecf1113f28db9a45136dd1d4ce9a966d890a245fc3",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TI04.mp3",
  associatedAudioSha256: "141ec0c31fa08c6e51314d7c7da671e0b577ee43dbacddabdccdec2c0196ef74",
  associatedAudioTechnicalDurationMs: 14_208,
  spriteObjectId: 274,
  randomCalls: Object.freeze([Object.freeze({
    path: "DefineSprite_225/frame_2/DoAction.as",
    sha256: "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
    expression: "random(4)",
    disposition: "inventoried-not-executed",
  })]),
  branchSignalCount: 68,
  mouseEventSignalCount: 19,
  clipEventSignalCount: 7,
  keyboardEventSignalCount: 4,
  inputFieldSignalCount: 36,
  timelineNavigationOccurrenceCount: 90,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TI_004_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ti-004",
  title: "Question 3 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TI_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ti-004/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-274",
  mainFrameCount: 125,
  livePlaybackEndFrame: 124,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [158, 1], [197, 1], [198, 1], [199, 1], [200, 1], [201, 1], [202, 1],
    [203, 1], [204, 1], [205, 1], [206, 1], [207, 1], [208, 1], [209, 1],
    [210, 1], [212, 7], [223, 15], [225, 55], [229, 25], [231, 35], [233, 20],
    [236, 25], [271, 1], [273, 1],
  ].map(([id, frameCount]) => Object.freeze({
    id: `sprite-${id}`,
    frameCount,
    label: id === 225
      ? "Random feedback-audio companion"
      : "Statically reachable companion; runtime composition disabled",
  }))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "question-3-source-static-drawing",
    firstFrame: 1,
    lastFrame: 125,
  })]),
  sourceControlBehaviorLabel: "The companion random call, thirteen source buttons, nineteen mouse-event signals, seven clip-event signals, keyboard/input behavior, ninety timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TI_004_AUTHORITY = Object.freeze({
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
