import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_VB_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB07.swf",
  swfSha256:
    "e3e6c45a56f343b3a8baf8a65dd34b615327029f808eec0c5f9cfee2dd2c1450",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB07.fla",
  flaSha256:
    "b4eb0a360733817b164356149bae97b11b21d9554a2a0a365a01a9ec69c4147c",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB07.mp3",
  associatedAudioSha256:
    "11dc5591a4e3ca66ec73432314ccc36d6b9cde4ff771096db26c7829ae96aacd",
  embeddedAudioStreamSha256: Object.freeze([
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
    "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af",
    "409b8ceceb0f8193edd69b9a8e8ea361bf7fadff3d465a761bce899568f72038",
    "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
    "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
    "bbd095ed279700bd07e1f597e87fa88b5d4151782eae5e5bc4a61ea44a8cece4",
  ]),
  spriteObjectId: 271,
  staticallyUnreachableSpriteObjectId: 40,
  buttonObjectIds: Object.freeze([10, 21, 22, 41]),
  quizStopFrame: 31,
  interactionOperationCount: 4,
  timelineNavigationOccurrenceCount: 44,
  replayResetOperationCount: 9,
  maskCandidateCount: 5,
  morphDefinitionCount: 89,
  embeddedRasterDefinitionCount: 2,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G04_L03_VB_007_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-007",
  title: "Positive Numbers Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_VB_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-271",
  mainFrameCount: 69,
  livePlaybackEndFrame: 31,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-42", frameCount: 1, label: "Wrong-feedback and glossary companion"}),
    Object.freeze({id: "sprite-45", frameCount: 28, label: "Nested timed practice companion"}),
    Object.freeze({id: "sprite-63", frameCount: 27, label: "Nested timed practice companion"}),
    Object.freeze({id: "sprite-68", frameCount: 1, label: "One-frame nested structural companion"}),
    Object.freeze({id: "sprite-77", frameCount: 31, label: "Nested timed practice companion"}),
    Object.freeze({id: "sprite-105", frameCount: 28, label: "Nested timed practice companion"}),
    Object.freeze({id: "sprite-114", frameCount: 22, label: "Nested visual companion"}),
    Object.freeze({id: "sprite-136", frameCount: 26, label: "Nested timed feedback companion"}),
    Object.freeze({id: "sprite-142", frameCount: 22, label: "Nested visual companion"}),
    Object.freeze({id: "sprite-166", frameCount: 19, label: "Nested visual companion"}),
    Object.freeze({id: "sprite-176", frameCount: 27, label: "Nested timed feedback companion"}),
    Object.freeze({id: "sprite-202", frameCount: 31, label: "Nested timed feedback companion"}),
    Object.freeze({id: "sprite-234", frameCount: 25, label: "Nested timed feedback companion"}),
    Object.freeze({id: "sprite-267", frameCount: 27, label: "Nested timed feedback companion"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "positive-numbers-practice", firstFrame: 1, lastFrame: 69}),
    Object.freeze({id: "four-answer-quiz-stop-static-drawing", firstFrame: 31, lastFrame: 31}),
    Object.freeze({id: "post-quiz-static-drawing", firstFrame: 32, lastFrame: 69}),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, four release/input operations, forty-four timeline-navigation occurrences, nine replay/reset operation candidates, wrong/right feedback, glossary callbacks, eleven embedded streams, the associated catalog-audio path, and all ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    frameDomain: "sprite-142",
    localFrameCount: 22,
    rootEntryFrame: 6,
    scenario: "source-static-reachable-domain",
    language: "en" as const,
    requirementId: "req:sprite-142:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-142:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256:
      "54e0b0922ae3295d938527704caa21f7d954bf4c2de7e8805c2bab2d26da6830",
    sourceFrame: 31,
    sourceFrameDomain: "sprite-271",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId:
      "g04-l03-vb-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite142-p02-target-frame-",
    pathIndex: 2,
    uniqueTargetVisualCount: 22,
    authority:
      "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    frameDomain: "sprite-166",
    localFrameCount: 19,
    rootEntryFrame: 6,
    scenario: "source-static-reachable-domain",
    language: "en" as const,
    requirementId: "req:sprite-166:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-166:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256:
      "ee0cc4b279c5a53bd3ed409c46d18448b4f3a07645112299be08a07ac6052268",
    sourceFrame: 31,
    sourceFrameDomain: "sprite-271",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId:
      "g04-l03-vb-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite166-p01-target-frame-",
    pathIndex: 1,
    uniqueTargetVisualCount: 19,
    authority:
      "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    frameDomain: "sprite-166",
    localFrameCount: 19,
    rootEntryFrame: 6,
    scenario: "source-static-reachable-domain",
    language: "en" as const,
    requirementId:
      "req:sprite-166:lesson-shell-natural-entry-path-2:en",
    traceId:
      "trace:sprite-166:lesson-shell-natural-entry-path-2:en:seed-0",
    entryStateSha256:
      "c3968134acb22145f1bfb35bc54a286ce0009fc567d26e772bb50bdd38059485",
    sourceFrame: 31,
    sourceFrameDomain: "sprite-271",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId:
      "g04-l03-vb-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite166-p02-target-frame-",
    pathIndex: 2,
    uniqueTargetVisualCount: 19,
    authority:
      "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
]);

export const COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG = Object.freeze({
  animationId: "course-g04-l03-vb-007-parent-composite",
  title: "Positive Numbers Practice parent-composite diagnostics",
  sourceSwfSha256: COURSE_G04_L03_VB_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-vb-007-parent-composite/canvas-renderer.js",
  assetSha256:
    "05aa87f28633bef5aadac6549df653720cf6bf6689544e837441652b59af3525",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-271",
  mainFrameCount: 69,
  playbackMode: "once",
  sourceBehaviorCompositeContractId:
    "g04-l03-vb-007-parent-composite-observability-v1",
  showEngineeringDisclosure: false,
  visualMarkers: Object.freeze([Object.freeze({
    id: "source-static-parent-composite",
    firstFrame: 31,
    lastFrame: 31,
  })]),
  sourceControlBehaviorLabel:
    "Exact source-static placement paths only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES =
  Object.freeze([
    Object.freeze({
      animationId: "course-g04-l03-vb-007",
      frameDomain: "sprite-136",
      localFrameCount: 26,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-136:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-136:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "415fdfe0f86e2846fbdff786a68ad6b0d4400b066022a98fc87de16c580b4f8f",
      sourceFrame: 31,
      sourceFrameDomain: "sprite-271",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-vb-007-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite136-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
    Object.freeze({
      animationId: "course-g04-l03-vb-007",
      frameDomain: "sprite-176",
      localFrameCount: 27,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-176:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-176:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "df059bb5b3071b129dd7cf26d6759ff0d65a74c4febc922f1f6eacfbfe36c7b0",
      sourceFrame: 31,
      sourceFrameDomain: "sprite-271",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-vb-007-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite176-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
  ]);

export const COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG =
  Object.freeze({
    animationId: "course-g04-l03-vb-007-natural-parent-composite",
    title: "Positive Numbers Practice natural parent-composite diagnostics",
    sourceSwfSha256: COURSE_G04_L03_VB_007_SOURCE.swfSha256,
    assetSource:
      "/flash-assets/courses/course-g04-l03-vb-007-natural-parent-composite/canvas-renderer.js",
    assetSha256:
      "dc7398f247294c9e80209c914447b515761808b6f291ae05edbb2e6108f435d9",
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-271",
    mainFrameCount: 69,
    playbackMode: "once",
    sourceBehaviorCompositeContractId:
      "g04-l03-vb-007-natural-parent-composite-v1",
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-natural-parent-composite",
      firstFrame: 31,
      lastFrame: 31,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static parent timeline frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig);

const VB_007_DIRECT_COMPANION_ASSET =
  "course-g04-l03-vb-007-direct-companion-composite";

export const COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES =
  Object.freeze([
    ["sprite-45", 28, "f6b3032996d22b025c1a1c3b7265b2afd327cc9729456177532c40d01bf68259"],
    ["sprite-63", 27, "279bfeceff681a4bccede0525917ab6ed4564314c3e0695293103e04287cd951"],
    ["sprite-77", 31, "6d289ccfd21aef3cc29a679348745d19062a009c0f26f09d5cfa4546753ef4dd"],
    ["sprite-105", 28, "94606c2d7326b99c69e7727a7d4a0aed0322208350de38c3c1f62ed6c6a70bc2"],
    ["sprite-202", 31, "90608e41a1fc2b5b8470666ce8c5ba46d3394f4d74ca3f3907df83f35cfc3353"],
    ["sprite-234", 25, "3905fde629172b1985c56f74a617d28802ee9578f2469940fa1850ea0a31dca0"],
    ["sprite-267", 27, "e191e63fea38cc786654bc9af5161151dd27b610c226358bccf8e0a68194de21"],
  ].map(([frameDomain, localFrameCount, entryStateSha256]) =>
    Object.freeze({
      animationId: "course-g04-l03-vb-007",
      assetKey: VB_007_DIRECT_COMPANION_ASSET,
      frameDomain: frameDomain as string,
      localFrameCount: localFrameCount as number,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: `req:${frameDomain}:lesson-shell-natural-entry:en`,
      traceId: `trace:${frameDomain}:lesson-shell-natural-entry:en:seed-0`,
      entryStateSha256: entryStateSha256 as string,
      sourceFrame: 31,
      sourceFrameDomain: "sprite-271",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-vb-007-direct-companion-composite-v1",
      behaviorCompositeStatePrefix:
        `${String(frameDomain).replace("-", "")}-p01-target-frame-`,
      pathIndex: 1,
      authority:
        "source-static-direct-companion-frame-override-not-original-runtime-or-fidelity",
    })),
  );

export const COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS =
  Object.freeze([Object.freeze({
    animationId: VB_007_DIRECT_COMPANION_ASSET,
    title: "Positive Numbers Practice direct companion diagnostics",
    sourceSwfSha256: COURSE_G04_L03_VB_007_SOURCE.swfSha256,
    assetSource:
      "/flash-assets/courses/course-g04-l03-vb-007-direct-companion-composite/canvas-renderer.js",
    assetSha256:
      "464e62aa3509c445696404761d5415124e3a535489a750a4791a49fae855ff71",
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-271",
    mainFrameCount: 69,
    playbackMode: "once",
    sourceBehaviorCompositeContractId:
      "g04-l03-vb-007-direct-companion-composite-v1",
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-direct-companion-composite",
      firstFrame: 31,
      lastFrame: 31,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static direct companion frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig)]);

export const COURSE_G04_L03_VB_007_AUTHORITY = Object.freeze({
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
  nestedTimelineClockEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});
