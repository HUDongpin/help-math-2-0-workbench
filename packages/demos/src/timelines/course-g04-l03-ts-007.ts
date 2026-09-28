import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_TS_007_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS07.swf",
  swfSha256: "f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf",
  fla: null,
  flaSha256: null,
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS07.mp3",
  associatedAudioSha256: "6d57334f95e77ff124f4c9c7721cbaad50f9e7592ffc1a6b46b074f023049fd1",
  associatedAudioTechnicalDurationMs: 74_112,
  spriteObjectId: 441,
  mouseEventSignalCount: 34,
  replayOrResetSignalCount: 3,
  timelineNavigationOccurrenceCount: 87,
});

export const COURSE_G04_L03_TS_007_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-007",
  title: "Question 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-ts-007/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-441",
  mainFrameCount: 696,
  livePlaybackEndFrame: 235,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [47, 1], [49, 1], [90, 70], [114, 97], [127, 20], [183, 83],
    [193, 28], [211, 27], [216, 1], [225, 31], [253, 28], [262, 22],
    [284, 26], [290, 22], [314, 19], [324, 27], [350, 31], [382, 25],
    [415, 27], [439, 70], [445, 1],
  ].map(([id, frameCount]) => Object.freeze({id: `sprite-${id}`, frameCount,
    label: "Statically reachable companion; runtime composition disabled"}))),
  visualMarkers: Object.freeze([Object.freeze({
    id: "test-question-1-source-static-drawing",
    firstFrame: 1,
    lastFrame: 696,
  })]),
  sourceControlBehaviorLabel: "Twenty-eight source buttons, thirty-four mouse-event signals, Replay/reset actions, eighty-seven timeline-navigation occurrences, all audio, and all ActionScript execution are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-ts-007", frameDomain: "sprite-290",
    localFrameCount: 22, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-290:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-290:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256: "357f4da3174e976cda08435acdc1ad21beceec28bb94ef70e74329eb11f3e51c",
    sourceFrame: 679, sourceFrameDomain: "sprite-441",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-ts-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite290-p02-target-frame-",
    pathIndex: 2, uniqueTargetVisualCount: 21,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007", frameDomain: "sprite-314",
    localFrameCount: 19, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-314:lesson-shell-natural-entry:en",
    traceId: "trace:sprite-314:lesson-shell-natural-entry:en:seed-0",
    entryStateSha256: "a5cfa589a3fed6f0604b55bba5ffc2046c9f871380d6d88a9aa4b6a9be67d032",
    sourceFrame: 679, sourceFrameDomain: "sprite-441",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-ts-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite314-p01-target-frame-",
    pathIndex: 1, uniqueTargetVisualCount: 19,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007", frameDomain: "sprite-314",
    localFrameCount: 19, rootEntryFrame: 6,
    scenario: "source-static-reachable-domain", language: "en" as const,
    requirementId: "req:sprite-314:lesson-shell-natural-entry-path-2:en",
    traceId: "trace:sprite-314:lesson-shell-natural-entry-path-2:en:seed-0",
    entryStateSha256: "45e742a9825a0388a0d4f021062f67f77d09d89c10511837cc1b38adba82420f",
    sourceFrame: 679, sourceFrameDomain: "sprite-441",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: "g04-l03-ts-007-parent-composite-observability-v1",
    behaviorCompositeStatePrefix: "sprite314-p02-target-frame-",
    pathIndex: 2, uniqueTargetVisualCount: 19,
    authority: "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  }),
]);

export const COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-007-parent-composite",
  title: "Question 1 parent-composite diagnostics",
  sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-ts-007-parent-composite/canvas-renderer.js",
  assetSha256:
    "e61534640484f17fae940a0a90ad92930f87734f4f9f01c9130a0eec1834fc21",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-441", mainFrameCount: 696,
  playbackMode: "once",
  sourceBehaviorCompositeContractId:
    "g04-l03-ts-007-parent-composite-observability-v1",
  showEngineeringDisclosure: false,
  visualMarkers: Object.freeze([Object.freeze({
    id: "source-static-parent-composite", firstFrame: 679, lastFrame: 679,
  })]),
  sourceControlBehaviorLabel:
    "Exact source-static placement paths only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES =
  Object.freeze([
    Object.freeze({
      animationId: "course-g04-l03-ts-007",
      frameDomain: "sprite-284",
      localFrameCount: 26,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-284:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-284:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "90c165e6062149cf05e43140b7ad5f07d4cae98db0f44fe33d1cc3f8f4a7f4c6",
      sourceFrame: 679,
      sourceFrameDomain: "sprite-441",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-ts-007-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite284-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
    Object.freeze({
      animationId: "course-g04-l03-ts-007",
      frameDomain: "sprite-324",
      localFrameCount: 27,
      rootEntryFrame: 6,
      scenario: "source-static-reachable-domain",
      language: "en" as const,
      requirementId: "req:sprite-324:lesson-shell-natural-entry:en",
      traceId: "trace:sprite-324:lesson-shell-natural-entry:en:seed-0",
      entryStateSha256:
        "f987dec95d3cc0f90ed1d2173dfe5f8686e9ce551d41a9e1b55647ffef33c95d",
      sourceFrame: 679,
      sourceFrameDomain: "sprite-441",
      sourceScenario: "source-static-frame",
      behaviorCompositeContractId:
        "g04-l03-ts-007-natural-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite324-p01-target-frame-",
      pathIndex: 1,
      authority:
        "source-static-natural-parent-frame-override-not-original-runtime-or-fidelity",
    }),
  ]);

export const COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG =
  Object.freeze({
    animationId: "course-g04-l03-ts-007-natural-parent-composite",
    title: "Question 1 natural parent-composite diagnostics",
    sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
    assetSource:
      "/flash-assets/courses/course-g04-l03-ts-007-natural-parent-composite/canvas-renderer.js",
    assetSha256:
      "acb54274f85ae9f0f9b67c3109cae67380b0e68c0b8bc6a0149f3fbda9c2b8cd",
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-441",
    mainFrameCount: 696,
    playbackMode: "once",
    sourceBehaviorCompositeContractId:
      "g04-l03-ts-007-natural-parent-composite-v1",
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-natural-parent-composite",
      firstFrame: 679,
      lastFrame: 679,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static parent timeline frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig);

const TS_007_DIRECT_FRAME_374_ASSET =
  "course-g04-l03-ts-007-direct-companion-composite-frame-374";
const TS_007_DIRECT_FRAME_500_ASSET =
  "course-g04-l03-ts-007-direct-companion-composite-frame-500";
const TS_007_DIRECT_FRAME_617_ASSET =
  "course-g04-l03-ts-007-direct-companion-composite-frame-617";
const TS_007_DIRECT_FRAME_679_ASSET =
  "course-g04-l03-ts-007-direct-companion-composite-frame-679";

export const COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES =
  Object.freeze([
    ["sprite-90", 70, "82a3a2e541f687d47189d6b0a4c2ece5390be0a9be8534264d9f2466483d186a", 374, TS_007_DIRECT_FRAME_374_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-374-v1"],
    ["sprite-114", 97, "256a52b5b3dd6c2d1bfc3bde5b741927ab682fa5013fae9c89b906562c995b36", 500, TS_007_DIRECT_FRAME_500_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-500-v1"],
    ["sprite-127", 20, "ca2d8c2d9965073887332b386fb3125ec08749616cb23e852942fc360695cb27", 617, TS_007_DIRECT_FRAME_617_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-617-v1"],
    ["sprite-183", 83, "2ace372728dfa6e0cce6deb4246adda94bffbfba30ca1b6f11914e9748ac40e5", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-193", 28, "2688544c1289547b593152760e2e368bac934674555e5d4da7b1c1230eb67687", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-211", 27, "91ed4ea3e332f676837f4b7be6399222e9901e0300fa3467bee1989121c1d92c", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-225", 31, "66501f2512bb287cd1bf0cabaeac6687e1ec259a734f5f60cccf59e8db6c32c6", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-253", 28, "d0b15e68a721a46595664505d3ca5677fe9259d8d2be3851bb5759c0d77d5c6e", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-350", 31, "4f51022a825b2f071464cb162c438b50a1c3e2d64b4ffaf2a71d42d3dcd900b5", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-382", 25, "338ba45e3b83950c6cdf9bd58fd48e3fc26c71d26510531eb16c72d78001b6ee", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-415", 27, "cee9d6afea214c0fb0a5774bd66d4e1c31bc7a63e4c27eb48eb8034e4406131e", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
    ["sprite-439", 70, "1ed92c723d12829c6b2a4b870f81ef48828369a38e894e7d4b678b42f0d75a57", 679, TS_007_DIRECT_FRAME_679_ASSET, "g04-l03-ts-007-direct-companion-composite-frame-679-v1"],
  ].map(([
    frameDomain,
    localFrameCount,
    entryStateSha256,
    sourceFrame,
    assetKey,
    behaviorCompositeContractId,
  ]) => Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: assetKey as string,
    frameDomain: frameDomain as string,
    localFrameCount: localFrameCount as number,
    rootEntryFrame: 6,
    scenario: "source-static-reachable-domain",
    language: "en" as const,
    requirementId: `req:${frameDomain}:lesson-shell-natural-entry:en`,
    traceId: `trace:${frameDomain}:lesson-shell-natural-entry:en:seed-0`,
    entryStateSha256: entryStateSha256 as string,
    sourceFrame: sourceFrame as number,
    sourceFrameDomain: "sprite-441",
    sourceScenario: "source-static-frame",
    behaviorCompositeContractId: behaviorCompositeContractId as string,
    behaviorCompositeStatePrefix:
      `${String(frameDomain).replace("-", "")}-p01-target-frame-`,
    pathIndex: 1,
    authority:
      "source-static-direct-companion-frame-override-not-original-runtime-or-fidelity",
  })));

export const COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS =
  Object.freeze([
    Object.freeze({
      animationId: TS_007_DIRECT_FRAME_374_ASSET,
      title: "Question 1 direct companion frame-374 diagnostics",
      sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
      assetSource:
        "/flash-assets/courses/course-g04-l03-ts-007-direct-companion-composite-frame-374/canvas-renderer.js",
      assetSha256:
        "6f17f4ae03001832a3065284fbe27998e973d51c74be5b12c7a0be148534a587",
      sourceBehaviorCompositeContractId:
        "g04-l03-ts-007-direct-companion-composite-frame-374-v1",
      sourceFrame: 374,
    }),
    Object.freeze({
      animationId: TS_007_DIRECT_FRAME_500_ASSET,
      title: "Question 1 direct companion frame-500 diagnostics",
      sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
      assetSource:
        "/flash-assets/courses/course-g04-l03-ts-007-direct-companion-composite-frame-500/canvas-renderer.js",
      assetSha256:
        "eb4348026e84153807d6e45ea7d3f8709803191eb7ff5f67308ec3218073bd93",
      sourceBehaviorCompositeContractId:
        "g04-l03-ts-007-direct-companion-composite-frame-500-v1",
      sourceFrame: 500,
    }),
    Object.freeze({
      animationId: TS_007_DIRECT_FRAME_617_ASSET,
      title: "Question 1 direct companion frame-617 diagnostics",
      sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
      assetSource:
        "/flash-assets/courses/course-g04-l03-ts-007-direct-companion-composite-frame-617/canvas-renderer.js",
      assetSha256:
        "e51b664067b5a68a0d3d52f9d17287c524abd81e1c60b554a8b1de1eb3e511ba",
      sourceBehaviorCompositeContractId:
        "g04-l03-ts-007-direct-companion-composite-frame-617-v1",
      sourceFrame: 617,
    }),
    Object.freeze({
      animationId: TS_007_DIRECT_FRAME_679_ASSET,
      title: "Question 1 direct companion frame-679 diagnostics",
      sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256,
      assetSource:
        "/flash-assets/courses/course-g04-l03-ts-007-direct-companion-composite-frame-679/canvas-renderer.js",
      assetSha256:
        "04cef90a6ead416c61fff5dc3913be8725e2c8cefc127224225327038338c764",
      sourceBehaviorCompositeContractId:
        "g04-l03-ts-007-direct-companion-composite-frame-679-v1",
      sourceFrame: 679,
    }),
  ].map((config) => Object.freeze({
    ...config,
    stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    mainFrameDomain: "sprite-441",
    mainFrameCount: 696,
    playbackMode: "once" as const,
    showEngineeringDisclosure: false,
    visualMarkers: Object.freeze([Object.freeze({
      id: "source-static-direct-companion-composite",
      firstFrame: config.sourceFrame,
      lastFrame: config.sourceFrame,
    })]),
    sourceControlBehaviorLabel:
      "Exact source-static direct companion frames at source placement only; AVM1, audio, original runtime, fidelity, human review, and Owner acceptance remain disabled",
  } satisfies SourceStaticCanvasCandidateConfig)));

export const COURSE_G04_L03_TS_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;

import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

// Source placement intervals and bounds are retained; modern controls consolidate identical targets.
// These mappings do not establish original host lookup parity.
export const COURSE_G04_L03_TS_007_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "symbol-f1",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 1,
    lastFrame: 1,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 129.93960876464843, "bottom": 146.46039123535155}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f1",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 1,
    lastFrame: 1,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 129.93960876464843, "bottom": 146.46039123535155}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f2",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 2,
    lastFrame: 2,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 126.78960876464843, "bottom": 143.31039123535157}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f2",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 2,
    lastFrame: 2,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 126.78960876464843, "bottom": 143.31039123535157}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f3",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 3,
    lastFrame: 3,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 123.58960876464843, "bottom": 140.11039123535156}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f3",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 3,
    lastFrame: 3,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 123.58960876464843, "bottom": 140.11039123535156}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f4",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 4,
    lastFrame: 4,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 120.43960876464844, "bottom": 136.96039123535155}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f4",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 4,
    lastFrame: 4,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 120.43960876464844, "bottom": 136.96039123535155}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f5",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 5,
    lastFrame: 5,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 117.28960876464843, "bottom": 133.81039123535157}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f5",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 5,
    lastFrame: 5,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 117.28960876464843, "bottom": 133.81039123535157}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f6",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 6,
    lastFrame: 6,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 114.08960876464843, "bottom": 130.61039123535156}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f6",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 6,
    lastFrame: 6,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 114.08960876464843, "bottom": 130.61039123535156}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
  Object.freeze({
    id: "symbol-f7",
    characterId: 20,
    keyAttribute: "Symbol",
    firstFrame: 7,
    lastFrame: 696,
    depth: 54,
    sourceBounds: Object.freeze({"left": 112.11518952777843, "right": 163.69757687499515, "top": 110.93960876464844, "bottom": 127.46039123535157}),
    entryIds: Object.freeze({"en": "en-0677-bff39ce92c9e", "es": "es-0655-871afa316e73"}),
    labels: Object.freeze({"en": "Symbol", "es": "Símbolo"}),
  }),
  Object.freeze({
    id: "number-line-f7",
    characterId: 21,
    keyAttribute: "Number line",
    firstFrame: 7,
    lastFrame: 696,
    depth: 56,
    sourceBounds: Object.freeze({"left": 343.11130789672023, "right": 426.8094069964718, "top": 110.93960876464844, "bottom": 127.46039123535157}),
    entryIds: Object.freeze({"en": "en-0424-79116d5cfb19", "es": "es-0571-2c68dc77903f"}),
    labels: Object.freeze({"en": "Number line", "es": "Recta numérica"}),
  }),
]);
export const COURSE_G04_L03_TS_007_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-ts-007",
  frameDomain: "sprite-441",
  terms: COURSE_G04_L03_TS_007_GLOSSARY_HOTSPOTS,
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
