import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN06.swf",
  swfSha256:
    "e303dcdd4dbd48a45625663f8630c546987d1212cb3750cd710da853f25d59ba",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN06.fla",
  flaSha256:
    "c79c838ba91c4e2b4dc072b9ebe3997d99130e8dfd723e66677089d03ec002a9",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN06.mp3",
  associatedAudioSha256:
    "93479131bd93642f59ac7999b6c0f8a03c9fee2cadda96989a4a0591d522f03c",
  associatedAudioTechnicalDurationMs: 38_760,
  embeddedAudioStreamSha256: Object.freeze([
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "2b8c754a6a8b55434a6672525b8e300b5ed1f4c84760d3c89c5eb01605380717",
  ]),
  spriteObjectId: 151,
  staticallyUnreachableSpriteObjectIds: Object.freeze([26, 34]),
  buttonObjectIds: Object.freeze([28, 120, 138]),
  quizDragObjectIds: Object.freeze([122, 125, 130, 133]),
  arrowObjectId: 142,
  quizEntryFrame: 1_054,
  postStopStaticInspectionRange: Object.freeze({firstFrame: 1_055, lastFrame: 1_057}),
  sourceStopAtQuizEntry: true,
  safeLivePlaybackEndFrame: 1_054,
  sourceLocalNumberLineQuizContract:
    "migrations/course-g04-l03-in-006/audit/source-local-number-line-quiz-contract.json",
  sourceLocalNumberLineQuizContractSha256:
    "14fc5ccd5bded69f7caeb7e11d61f54f972ddaad9a6f43dd83306e6c28c8e512",
  implementationSeedMapping:
    "seed-modulo-eight-for-deterministic-current-javascript-only-not-injected-into-avm1",
  randomCalls: Object.freeze([
    Object.freeze({
      path: "DefineSprite_144/frame_2/DoAction.as",
      sha256:
        "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
      expression: "random(4)",
      disposition: "inventoried-not-executed",
    }),
    Object.freeze({
      path: "DefineSprite_151/frame_1054/DoAction.as",
      sha256:
        "4810e7cde4e772ad4f36bb07e396d4dd48de98a4b133b0d8c51d9489d31a5e45",
      expression: "random(arr.length), with one conditional redraw",
      disposition: "inventoried-not-executed",
    }),
  ]),
  quizSourcePairs: Object.freeze([
    "-11~-8", "-8~-15", "-15~-4", "-4~5",
    "5~9", "9~15", "15~1", "1~-6",
  ]),
  branchSignalCount: 27,
  mouseEventSignalCount: 8,
  clipEventSignalCount: 4,
  timelineNavigationOccurrenceCount: 68,
  maskCandidateCount: 3,
  morphDefinitionCount: 0,
  embeddedRasterDefinitionCount: 1,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_606}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 280.3}),
});

export const COURSE_G04_L03_IN_006_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-006",
  title:
    "Numbers on the Number Line — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-006/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-151",
  mainFrameCount: 1_057,
  livePlaybackEndFrame: 1_054,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-11", frameCount: 1, label: "One-frame page-title companion"}),
    Object.freeze({id: "sprite-15", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-122", frameCount: 3, label: "Quiz drag-item companion"}),
    Object.freeze({id: "sprite-125", frameCount: 3, label: "Quiz drag-item companion"}),
    Object.freeze({id: "sprite-130", frameCount: 4, label: "Quiz drag-item companion"}),
    Object.freeze({id: "sprite-133", frameCount: 3, label: "Quiz drag-item companion"}),
    Object.freeze({id: "sprite-135", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-137", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-142", frameCount: 2, label: "Arrow control companion"}),
    Object.freeze({id: "sprite-144", frameCount: 55, label: "Random feedback-audio companion"}),
    Object.freeze({id: "sprite-146", frameCount: 20, label: "Feedback-audio companion"}),
    Object.freeze({id: "sprite-150", frameCount: 25, label: "Completion-feedback timeline"}),
  ]),
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "number-line-instruction-source-static-drawing", firstFrame: 1, lastFrame: 1_053}),
    Object.freeze({id: "number-line-quiz-source-local-initial-state", firstFrame: 1_054, lastFrame: 1_054}),
    Object.freeze({id: "number-line-quiz-post-stop-static-inspection", firstFrame: 1_055, lastFrame: 1_057}),
  ]),
  sourceControlBehaviorLabel:
    "Frame 1054 renders only a deterministic source-local initial question and 31 labels; frames 1055–1057 are post-stop static inspection only. Three source random calls, three scripted buttons, four draggable quiz clips, an arrow control, checking/reset/equation/feedback behavior, twenty-seven branch signals, eight mouse-event signals, four clip-event signals, sixty-eight timeline-navigation occurrences, five embedded streams, the associated catalog-audio path, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_006_AUTHORITY = Object.freeze({
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
