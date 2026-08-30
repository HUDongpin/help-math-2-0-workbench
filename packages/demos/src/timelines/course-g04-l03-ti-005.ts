import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_TI_005_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI05.swf",
  swfSha256: "c6c46c779084d0f4a7888e3061310f84461d4858ff32c34c5ff9ffab5435de06",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TI/L3TI05.fla",
  flaSha256: "40d3cb630a0736e6b5b8ac5e1556a2a23b501a5472f879c57154c5f1dc2a1207",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TI05.mp3",
  associatedAudioSha256: "194ad5830ad8b4a4bb9008cf7a75f9ace3b568de609aaa4115fb5d899f4ecee3",
  associatedAudioTechnicalDurationMs: 25_200,
  spriteObjectId: 208,
  buttonObjectIds: Object.freeze([147, 185, 190, 200]),
  quizEntryFrame: 209,
  postStopStaticInspectionRange: Object.freeze({firstFrame: 210, lastFrame: 210}),
  sourceStopAtQuizEntry: true,
  safeLivePlaybackEndFrame: 209,
  sourceLocalPatternQuizContract:
    "migrations/course-g04-l03-ti-005/audit/source-local-pattern-quiz-contract.json",
  sourceLocalPatternQuizContractSha256:
    "dde5990ecbe7783b255cbb924a53d55c6ec40e1b64fd2c9cccef203ea8b4f555",
  implementationSeedMapping:
    "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1",
  randomCalls: Object.freeze([
    Object.freeze({
      path: "DefineSprite_205/frame_2/DoAction.as",
      sha256: "816e183d51a10c83131a99d9a1d3b0198bda532af6ca34cbdf918ddab13499cd",
      expression: "random(4)",
      disposition: "inventoried-not-executed",
    }),
    Object.freeze({
      path: "DefineSprite_208/frame_209/DoAction.as",
      sha256: "24d6dd5c20cd8f8427136d51e6dc42f94185c7558dbabdadb43ebd4cffd15404",
      expression: "random(arr.length)",
      disposition: "inventoried-not-executed",
    }),
  ]),
  quizSourceData: Object.freeze([
    Object.freeze({label: "-3, -5, -7, -9,", answers: "-11~-13", decrement: 2}),
    Object.freeze({label: "16, 8, 0, -8,", answers: "-16~-24", decrement: 8}),
    Object.freeze({label: "20, 10, 0, -10,", answers: "-20~-30", decrement: 10}),
    Object.freeze({label: "-10, -15, -20, -25,", answers: "-30~-35", decrement: 5}),
    Object.freeze({label: "9, 6, 3, 0,", answers: "-3~-6", decrement: 3}),
  ]),
  branchSignalCount: 60,
  mouseEventSignalCount: 4,
  keyboardEventSignalCount: 4,
  inputFieldSignalCount: 40,
  timelineNavigationOccurrenceCount: 36,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_TI_005_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ti-005",
  title: "Question 4 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TI_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ti-005/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-208",
  mainFrameCount: 210,
  livePlaybackEndFrame: 209,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [157, 1], [171, 1], [179, 5], [203, 1], [205, 55], [207, 20],
  ].map(([id, frameCount]) => Object.freeze({
    id: `sprite-${id}`,
    frameCount,
    label: id === 205
      ? "Random feedback-audio companion"
      : "Statically reachable companion; runtime composition disabled",
  }))),
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "question-4-source-static-drawing",
      firstFrame: 1,
      lastFrame: 208,
    }),
    Object.freeze({
      id: "question-4-quiz-source-local-initial-state",
      firstFrame: 209,
      lastFrame: 209,
    }),
    Object.freeze({
      id: "question-4-quiz-post-stop-static-inspection",
      firstFrame: 210,
      lastFrame: 210,
    }),
  ]),
  sourceControlBehaviorLabel: "Frame 209 renders only a deterministic source-local initial question with two empty source input boxes; frame 210 is post-stop static inspection only. Both source random calls, four exported button scripts, mouse/keyboard/input behavior, thirty-six timeline-navigation occurrences, all audio, the source device-font runtime, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TI_005_AUTHORITY = Object.freeze({
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
