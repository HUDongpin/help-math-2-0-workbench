import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L03_IN_012_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN12.swf",
  swfSha256:
    "fa131c4cfad5619beb1343d0bfbc941bd9ffa59f190ae1b002f81d5f9d8cde55",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN12.fla",
  flaSha256:
    "9b53a7990ab3f2954c81b83cf4a0d516828d4b72c6bb2269c402c3826ffcdce4",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN12.mp3",
  associatedAudioSha256:
    "573658185d37494f947c33a47bd3406da09c66a1c792cdb774de3e7ae47c0d75",
  associatedAudioTechnicalDurationMs: 19_128,
  embeddedAudioStreamSha256: Object.freeze([
    "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af",
    "409b8ceceb0f8193edd69b9a8e8ea361bf7fadff3d465a761bce899568f72038",
    "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
    "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
    "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
    "57c455b31967737803c2cbaf6092fd2bd28f21ae178bd32cca81a231884728b2",
  ]),
  spriteObjectId: 228,
  staticallyUnreachableSpriteObjectId: 219,
  buttonObjectIds: Object.freeze([31, 34, 35, 220]),
  dragItemObjectIds: Object.freeze([207, 208, 209, 210, 211]),
  dragPlacementFrame: 174,
  terminalStopFrame: 215,
  branchSignalCount: 11,
  clipEventSignalCount: 5,
  mouseEventSignalCount: 9,
  eventHandlerOperationCount: 19,
  inputOperationCount: 24,
  lifecycleOperationCount: 5,
  timelineNavigationOccurrenceCount: 49,
  replayResetOperationCount: 7,
  audioOperationCount: 5,
  maskCandidateCount: 6,
  morphDefinitionCount: 68,
  embeddedRasterDefinitionCount: 2,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_268, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 413.4, y: 283.3}),
});

export const COURSE_G04_L03_IN_012_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-012",
  title:
    "Situations with Negative Numbers: Owing — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_IN_012_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-012/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-228",
  mainFrameCount: 215,
  livePlaybackEndFrame: 174,
  playbackMode: "once",
  companionDomains: Object.freeze([
    Object.freeze({id: "sprite-5", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-37", frameCount: 20, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-46", frameCount: 22, label: "Feedback timeline"}),
    Object.freeze({id: "sprite-68", frameCount: 26, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-74", frameCount: 22, label: "Feedback timeline"}),
    Object.freeze({id: "sprite-98", frameCount: 19, label: "Feedback timeline"}),
    Object.freeze({id: "sprite-108", frameCount: 27, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-134", frameCount: 31, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-166", frameCount: 25, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-199", frameCount: 27, label: "Narration and transition timeline"}),
    Object.freeze({id: "sprite-201", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-202", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-203", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-204", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-205", frameCount: 1, label: "One-frame structural companion"}),
    Object.freeze({id: "sprite-207", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-208", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-209", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-210", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-211", frameCount: 1, label: "Drag-item companion"}),
    Object.freeze({id: "sprite-223", frameCount: 15, label: "Wrong-feedback timeline"}),
    Object.freeze({id: "sprite-227", frameCount: 25, label: "Completion-feedback timeline"}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({id: "owing-situations", firstFrame: 1, lastFrame: 215}),
    Object.freeze({id: "five-drag-object-stop-static-drawing", firstFrame: 174, lastFrame: 174}),
    Object.freeze({id: "post-drag-static-drawing", firstFrame: 175, lastFrame: 215}),
    Object.freeze({id: "terminal-stop-static-drawing", firstFrame: 215, lastFrame: 215}),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, five draggable clips, nineteen event-handler operations, twenty-four input operations, five lifecycle operations, forty-nine timeline-navigation operations, seven replay/reset candidates, five audio operations, nine embedded streams, the associated catalog-audio path, and all ActionScript behavior are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CAPTURES = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-in-012", frameDomain: "sprite-74",
    localFrameCount: 22, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-74:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-74:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256: "67ccb1cf6c0bb79fce60cde6ffe3a8f16f0ba790ae93a8a54990cf0804be2c76",
    sourceFrame: 174, sourceFrameDomain: "sprite-228",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-in-012-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite74-p02-target-frame-",
    pathIndex: 2, uniqueTargetVisualCount: 22,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012", frameDomain: "sprite-98",
    localFrameCount: 19, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-98:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-98:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256: "86553dbe80fe138c72cbeddf947be0cb2b3ce5eece59ac935c9543fd7248543d",
    sourceFrame: 174, sourceFrameDomain: "sprite-228",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-in-012-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite98-p01-target-frame-",
    pathIndex: 1, uniqueTargetVisualCount: 19,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012", frameDomain: "sprite-98",
    localFrameCount: 19, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-98:lesson-shell-natural-entry-path-2:en",
    traceId: "trace:sprite-98:lesson-shell-natural-entry-path-2:en:seed-0",
    entryStateSha256: "748d3391db448e750625b2d8228c3152826eaaf30f039867b694c1cf03774e91",
    sourceFrame: 174, sourceFrameDomain: "sprite-228",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-in-012-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite98-p02-target-frame-",
    pathIndex: 2, uniqueTargetVisualCount: 19,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
]);

export const COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-012-parent-composite",
  title: "Owing Situations parent-composite diagnostics",
  sourceSwfSha256: COURSE_G04_L03_IN_012_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-in-012-parent-composite/canvas-renderer.js",
  assetSha256:
    "3cbb9410855a3a10151231f617277a6f82a054995834f6ceccfc229b3b327fe4",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-228", mainFrameCount: 215,
  playbackMode: "once",
  sourceBehaviorCompositeContractId:
    "g04-l03-in-012-parent-composite-observability-v1",
  showEngineeringDisclosure: false,
  visualMarkers: Object.freeze([Object.freeze({
    id: "source-static-parent-composite", firstFrame: 174, lastFrame: 174,
  })]),
  sourceControlBehaviorLabel:
    "Exact source-static placement paths only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CAPTURES =
  Object.freeze([
    Object.freeze({
      animationId: "course-g04-l03-in-012",
      frameDomain: "sprite-68",
      localFrameCount: 26,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-68:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-68:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "c075219d6f6b55bc70111f42a70ea23690d193eb9e7cbca905a783dbab4d1300",
      sourceFrame: 174,
      sourceFrameDomain: "sprite-228",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-in-012-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite68-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
    Object.freeze({
      animationId: "course-g04-l03-in-012",
      frameDomain: "sprite-108",
      localFrameCount: 27,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-108:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-108:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "8747ef0ca912c7c2673c4016cc4e0f83a93a865059cfadc9894ea4effedfb05b",
      sourceFrame: 174,
      sourceFrameDomain: "sprite-228",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-in-012-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite108-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
  ]);

export const COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CONFIG =
  Object.freeze({
    animationId: "course-g04-l03-in-012-natural-parent-composite",
    title: "Owing Situations natural parent-composite diagnostics",
    sourceSwfSha256: COURSE_G04_L03_IN_012_SOURCE.swfSha256,
    assetSource:
      "/flash-assets/courses/course-g04-l03-in-012-natural-parent-composite/canvas-renderer.js",
    assetSha256:
      "68dcec64874ccbf7fb0858a5857dadc76982e0a92e61d4dbfbebec9c4875f8f2",
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-228",
    mainFrameCount: 215,
    playbackMode: "once",
    sourceBehaviorCompositeContractId:
      "g04-l03-in-012-natural-parent-composite-v1",
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-natural-parent-composite",
      firstFrame: 174,
      lastFrame: 174,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static parent timeline frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig);

const IN_012_DIRECT_COMPANION_ASSET =
  "course-g04-l03-in-012-direct-companion-composite";

export const COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CAPTURES =
  Object.freeze([
    ["sprite-134", 31, "e5bb6dea096402cdd31d451e43d627a1a4e07fea32030ec592e04c1b494afea5"],
    ["sprite-166", 25, "2ce21548d3f3bab9b0ed0109cf2de73162510c65a8abe3f001bd7103bf1baf93"],
    ["sprite-199", 27, "6d54eaf49f60dd1fce066bfe8c6acbec6170db3c585f39bff675f1d1ed269acd"],
    ["sprite-223", 15, "7f1ac15b6b0575d817b4e7f278fe4257aadbebf3854295a929e9f8f3a3870f37"],
    ["sprite-227", 25, "2ba10806bc01d78bc652752c5fd9e4a689a4461c561beae3d5eaa47702612858"],
  ].map(([frameDomain, localFrameCount, entryStateSha256]) =>
    Object.freeze({
      animationId: "course-g04-l03-in-012",
      assetKey: IN_012_DIRECT_COMPANION_ASSET,
      frameDomain: frameDomain as string,
      localFrameCount: localFrameCount as number,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: `req:${frameDomain}:lesson-shell-natural-entry:en`,
      traceId: `trace:${frameDomain}:lesson-shell-natural-entry:en:seed-0`,
      entryStateSha256: entryStateSha256 as string,
      sourceFrame: 174,
      sourceFrameDomain: "sprite-228",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-in-012-direct-companion-composite-v1",
      behaviorCompositeStatePrefix:
        `${String(frameDomain).replace("-", "")}-p01-target-frame-`,
      pathIndex: 1,
      authority:
        "source-static-direct-companion-frame-override-not-original-runtime-or-fidelity",
    })),
  );

export const COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CONFIGS =
  Object.freeze([Object.freeze({
    animationId: IN_012_DIRECT_COMPANION_ASSET,
    title: "Owing Situations direct companion diagnostics",
    sourceSwfSha256: COURSE_G04_L03_IN_012_SOURCE.swfSha256,
    assetSource:
      "/flash-assets/courses/course-g04-l03-in-012-direct-companion-composite/canvas-renderer.js",
    assetSha256:
      "6ce2e79e997afd237f9e8639be1d909b5eab33ed94c43ba84607cbfadff6f83b",
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-228",
    mainFrameCount: 215,
    playbackMode: "once",
    sourceBehaviorCompositeContractId:
      "g04-l03-in-012-direct-companion-composite-v1",
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-direct-companion-composite",
      firstFrame: 174,
      lastFrame: 174,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static direct companion frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig)]);

export const COURSE_G04_L03_IN_012_AUTHORITY = Object.freeze({
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
  naturalRuntimeReachabilityEstablished: false,
  replayParityEstablished: false,
  behaviorParityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

// Source-locked glossary placements; geometry remains audit metadata.
export const COURSE_G04_L03_IN_012_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "position",
    characterId: 31,
    keyAttribute: "Position",
    firstFrame: 7,
    lastFrame: 215,
    depth: 35,
    sourceBounds: Object.freeze({"left": 518.0, "right": 590.7192611694336, "top": 89.4, "bottom": 107.97767486572266}),
    entryIds: Object.freeze({"en": "en-0495-b62037868041", "es": "es-0515-dc08c9ff19c0"}),
    labels: Object.freeze({"en": "Position", "es": "Posición"}),
  }),
  Object.freeze({
    id: "owe",
    characterId: 34,
    keyAttribute: "Owe",
    firstFrame: 123,
    lastFrame: 215,
    depth: 41,
    sourceBounds: Object.freeze({"left": 634.5, "right": 685.634147644043, "top": 119.4, "bottom": 137.97767486572266}),
    entryIds: Object.freeze({"en": "en-0451-a7f0d0283926", "es": "es-0133-2ce224d0bb7f"}),
    labels: Object.freeze({"en": "Owe", "es": "Deber"}),
  }),
  Object.freeze({
    id: "number-line",
    characterId: 35,
    keyAttribute: "Number line",
    firstFrame: 123,
    lastFrame: 215,
    depth: 43,
    sourceBounds: Object.freeze({"left": 62.55, "right": 172.20399169921876, "top": 119.4, "bottom": 137.97767486572266}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
] as const);

export const COURSE_G04_L03_IN_012_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-in-012",
  frameDomain: "sprite-228",
  terms: COURSE_G04_L03_IN_012_GLOSSARY_HOTSPOTS,
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
