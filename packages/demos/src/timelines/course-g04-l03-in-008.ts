import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_008_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN08.swf",
  swfSha256:
    "5462ead920862a48ddbacf7be068f9cadf9e509e7032a2dbbb2659a28e08757f",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN08.fla",
  flaSha256:
    "b4c50528ad9f5c808ead7f44cc0fdedacf0dd8b55d9fb196bfc39ef668738bd9",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN08.mp3",
  associatedAudioSha256:
    "a00419d76ea4628861e70ccb1204a0e740ff91bf7a1b5d69c6e8b2ba243b035e",
  associatedAudioTechnicalDurationMs: 27_312,
  embeddedAudioStreamSha256: Object.freeze([
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "f977f3b49c6c2f01fbff1f78a2f8f8f67a92a5f05957c2a1c4ca58fd0abf6a8c",
  ]),
  spriteObjectId: 57,
  staticallyUnreachableSpriteObjectId: 48,
  buttonObjectIds: Object.freeze([19, 35, 37, 49]),
  quizEntryFrame: 216,
  postStopStaticInspectionRange: Object.freeze({firstFrame: 217, lastFrame: 217}),
  sourceStopAtQuizEntry: true,
  safeLivePlaybackEndFrame: 216,
  terminalStopFrame: 217,
  sourceLocalPatternQuizContract:
    "migrations/course-g04-l03-in-008/audit/source-local-pattern-quiz-contract.json",
  sourceLocalPatternQuizContractSha256:
    "d2d43c82170d4566c5b9194a13fc0b3fa3b0e9889cb99ea55a4636f060d6673e",
  implementationSeedMapping:
    "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1",
  randomCalls: Object.freeze([
    Object.freeze({
      path: "DefineSprite_54/frame_2/DoAction.as",
      sha256:
        "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
      expression: "random(4)",
      disposition: "inventoried-not-executed",
    }),
    Object.freeze({
      path: "DefineSprite_57/frame_216/DoAction.as",
      sha256:
        "67e102691dec2ee138bf22e41a8751a1272cbc9d37fd16af12f93f8c0c3b519c",
      expression: "random(qLableArray.length)",
      disposition: "inventoried-not-executed",
    }),
  ]),
  quizSourceData: Object.freeze([
    Object.freeze({label: "10, 5, 0, -5,", answers: "-10~-15", decrement: 5}),
    Object.freeze({label: "18, 9, 0, -9,", answers: "-18~-27", decrement: 9}),
    Object.freeze({label: "7, 5, 3, 1,", answers: "-1~-3", decrement: 2}),
    Object.freeze({label: "0, -10, -20, -30,", answers: "-40~-50", decrement: 10}),
    Object.freeze({label: "16, 12, 8, 4,", answers: "0~-4", decrement: 4}),
  ]),
  branchSignalCount: 2,
  mouseEventSignalCount: 4,
  inputSignalCount: 4,
  timelineNavigationOccurrenceCount: 20,
  maskCandidateCount: 4,
  morphDefinitionCount: 0,
  embeddedRasterDefinitionCount: 1,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_008_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-008",
  title: "Patterns — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_008_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-008/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-57",
  mainFrameCount: 217,
  livePlaybackEndFrame: 216,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "One-frame page-title companion"}),
    Object.freeze({id: "sprite-52", frameCount: 1, label: "Quiz input-reset companion"}),
    Object.freeze({id: "sprite-54", frameCount: 55, label: "Random feedback-audio companion"}),
    Object.freeze({id: "sprite-56", frameCount: 20, label: "Feedback-audio companion"}),
  ]),
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "patterns-instruction-source-static-drawing", firstFrame: 1, lastFrame: 215}),
    Object.freeze({id: "patterns-quiz-source-local-initial-state", firstFrame: 216, lastFrame: 216}),
    Object.freeze({id: "patterns-quiz-post-stop-static-inspection", firstFrame: 217, lastFrame: 217}),
  ]),
  sourceControlBehaviorLabel:
    "Frame 216 renders only a deterministic source-local initial question with two empty source input boxes; frame 217 is post-stop static inspection only. Two source random calls, four buttons, input checking, quiz feedback/reset, four embedded streams, the associated catalog-audio path, source hyperlink behavior, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_008_AUTHORITY = Object.freeze({
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
