/**
 * Acceptance-neutral, source-bound inspection material for TI003 sprite-345.
 *
 * The accepted read-only proposal establishes structural facts and a future
 * descriptor contract only. This module deliberately does not declare a
 * frame domain, execute AVM1, create a renderer, or expose playback state.
 */

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

export const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-ti-003" as const;
export const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN =
  "sprite-345" as const;
export const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_SCENARIO =
  "prospective-source-domain-entry-unresolved" as const;

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_LANGUAGES = deepFreeze([
  "en",
  "es",
] as const);

export type CourseG04L11Ti003Sprite345PredecessorSourceFrameLanguage =
  (typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_LANGUAGES)[number];

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INPUT_BINDINGS = deepFreeze([
  {
    id: "source-swf" as const,
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.swf" as const,
    bytes: 442966,
    sha256: "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  },
  {
    id: "source-fla" as const,
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.fla" as const,
    bytes: 3131904,
    sha256: "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
  },
  {
    id: "migration-manifest" as const,
    path: "migrations/course-g04-l11-ti-003/migration.json" as const,
    bytes: 7003,
    sha256: "df551ba1a874d7f35c73f15f8f4a0f9dcf38c705c61cb6512fa2c305bfcd25bc",
  },
  {
    id: "machine-report" as const,
    path: "migrations/course-g04-l11-ti-003/audit/machine/report.json" as const,
    bytes: 22455,
    sha256: "0118afe46f801f8e3a77f4c951400f96cbadcbb137f8edc11550f000aff1658c",
  },
  {
    id: "machine-frame-domain-candidates" as const,
    path: "migrations/course-g04-l11-ti-003/audit/machine/swf-frame-domain-candidates.json" as const,
    bytes: 9020,
    sha256: "0c7169c9db5c958a0b59716b684d942ee484bc680b097fd977a2951013a0a189",
  },
  {
    id: "swfmill-xml-gzip" as const,
    path: "migrations/course-g04-l11-ti-003/audit/machine/swfmill.xml.gz" as const,
    bytes: 978340,
    sha256: "c9425dcd36a927a457499457deb369d525c408b000445e930665e62962038885",
    uncompressed: {
      bytes: 9233755,
      sha256: "b6fd9bab72440473553ae51c27f98004bb8a7591568c31e14ca43068cc45d9f8",
    },
  },
  {
    id: "ffdec-scripts-gzip" as const,
    path: "migrations/course-g04-l11-ti-003/audit/machine/ffdec-scripts.txt.gz" as const,
    bytes: 1514,
    sha256: "b15f831eab680f1d9b2798d761e0f441ea8d037016436eacaecad0b80df74d1d",
    uncompressed: {
      bytes: 8634,
      sha256: "fbd9847001c78d60d8addc39f9512e2505bb7f07642d222abdbe48e99e5ffa5d",
    },
  },
  {
    id: "scenario-inventory" as const,
    path: "migrations/course-g04-l11-ti-003/audit/scenario-inventory.json" as const,
    bytes: 625895,
    sha256: "d008c6900a61fe0988d5b183fbe82a1798a4f6eda4a61f0904940b7dc4d6be77",
  },
  {
    id: "frame-domain-disposition" as const,
    path: "migrations/course-g04-l11-ti-003/audit/frame-domain-disposition.json" as const,
    bytes: 57898,
    sha256: "444768f9a424b05f672fcdda66ac7f2c99e9e524adca10f19c65f0514c2252ab",
  },
  {
    id: "runtime-dependency-scope" as const,
    path: "migrations/course-g04-l11-ti-003/audit/runtime-dependency-scope.json" as const,
    bytes: 2714,
    sha256: "8be89090d576829e893579f5f4fc501b988d01232006f53c9751704821e22711",
  },
  {
    id: "audio-runtime-evidence" as const,
    path: "migrations/course-g04-l11-ti-003/audit/audio-runtime-evidence.json" as const,
    bytes: 17478,
    sha256: "faab66283a7078388baf060d2817251e89c68130e9a5fde37dd5f36ac02a52cf",
  },
  {
    id: "audio-inventory" as const,
    path: "migrations/course-g04-l11-ti-003/audio-inventory.csv" as const,
    bytes: 4489,
    sha256: "58e2f63c0ed37eb66ff593fb8077c699a9907ddafa32a52c46ac10a153282377",
  },
  {
    id: "lesson-release-catalog" as const,
    path: "catalog/lesson-releases.json" as const,
    bytes: 145216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  {
    id: "accepted-ti003-predecessor-spec" as const,
    path: "packages/demos/src/source-domain-specifications/g4-l11/course-g04-l11-ti-003-predecessor.ts" as const,
    bytes: 14871,
    sha256: "4159ceb5a9034feb70ab221ceaa1447ab0b7feb574fd066f235cccb19ca8e649",
  },
  {
    id: "source-proof-engine" as const,
    path: "scripts/source-proven-independent-frame-domain-evidence.mjs" as const,
    bytes: 24440,
    sha256: "dee04072232ec4e8ac31a49eac2c974f965178eb4028448ee263632c03848c2f",
  },
  {
    id: "static-disposition-engine" as const,
    path: "scripts/build-static-frame-domain-disposition-evidence.mjs" as const,
    bytes: 140795,
    sha256: "87b40d7d2066758669a03d08fc2366a5612775dd7967e92d1619176f2ae3b825",
  },
  {
    id: "disposition-builder" as const,
    path: "scripts/build-frame-domain-dispositions.mjs" as const,
    bytes: 108958,
    sha256: "a5f0b3f68b07e745c7f43eebe448a9c7bae97a60769e075fa3c3ce16b7213f8b",
  },
  {
    id: "scenario-builder" as const,
    path: "scripts/build-course-scenario-inventories.mjs" as const,
    bytes: 105695,
    sha256: "93ec99d5928f9ad78f6c76e8d2e1070686831b2a63bebb6f9391dc400fffe402",
  },
  {
    id: "projection-engine" as const,
    path: "scripts/evidence-projections.mjs" as const,
    bytes: 10849,
    sha256: "0a5a4126fd72fa8137af6105a8a22759ebbaab8a46f7538bd13074af7d9e7a08",
  },
] as const);

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INPUT_SET = deepFreeze({
  bindings: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INPUT_BINDINGS,
  count: 19,
  encoding: "fixed-order-path-tab-bytes-tab-sha256-newline-v1" as const,
  sha256: "8bf79611662460b19cfca2c70cd617adfb2ba45ae05f35154c03754cf1a75566",
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_FRAME_LABELS = deepFreeze([
  {frame: 3, label: "S1" as const},
  {frame: 18, label: "S2" as const},
  {frame: 31, label: "S3" as const},
  {frame: 40, label: "S4" as const},
] as const);

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_LABELS = deepFreeze({
  S1: {frame: 3, label: "S1" as const},
  S2: {frame: 18, label: "S2" as const},
  S3: {frame: 31, label: "S3" as const},
  S4: {frame: 40, label: "S4" as const},
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ROOT_PLACEMENT_CHAIN = deepFreeze([
  {
    childTimelineId: "sprite-346" as const,
    depth: "4" as const,
    frame: 6,
    hasClipActions: false,
    instanceName: "animation" as const,
    matrixTwips: {a: 1, b: 0, c: 0, d: 1, tx: 8248, ty: 5666},
    parentTimelineId: "root" as const,
    replace: "0" as const,
    sourceObjectId: "346" as const,
    tag: "PlaceObject2" as const,
  },
  {
    childTimelineId: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    depth: "306" as const,
    frame: 235,
    hasClipActions: false,
    instanceName: "Coach_audio_1" as const,
    matrixTwips: {a: 1, b: 0, c: 0, d: 1, tx: -14451, ty: 703},
    parentTimelineId: "sprite-346" as const,
    replace: "0" as const,
    sourceObjectId: "345" as const,
    tag: "PlaceObject2" as const,
  },
] as const);

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_TAG_CENSUS = deepFreeze({
  DoAction: 6,
  End: 1,
  FrameLabel: 4,
  PlaceObject2: 1,
  RemoveObject2: 1,
  ShowFrame: 55,
  SoundStreamBlock: 53,
  SoundStreamHead: 1,
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_ACTION_RECORDS = deepFreeze([
  {
    frame: 1,
    script: "DefineSprite_345/frame_1/DoAction.as" as const,
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    parserBlockSpanV1: {headingLine: 217, lineStart: 218, lineEnd: 219},
    legacyScenarioEvidenceSpan: {lineStart: 217, lineEnd: 218},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "stop" as const,
  },
  {
    frame: 2,
    script: "DefineSprite_345/frame_2/DoAction.as" as const,
    bodyBytes: 257,
    bodySha256: "790951eecf396145aff2136f219c1d0b45d08bca5bb74399896964f76eab6109",
    parserBlockSpanV1: {headingLine: 223, lineStart: 224, lineEnd: 233},
    legacyScenarioEvidenceSpan: {lineStart: 223, lineEnd: 232},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "initialize-random-S1-S4-and-gotoAndPlay-selected-label" as const,
  },
  {
    frame: 16,
    script: "DefineSprite_345/frame_16/DoAction.as" as const,
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    parserBlockSpanV1: {headingLine: 220, lineStart: 221, lineEnd: 222},
    legacyScenarioEvidenceSpan: {lineStart: 220, lineEnd: 221},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    frame: 27,
    script: "DefineSprite_345/frame_27/DoAction.as" as const,
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    parserBlockSpanV1: {headingLine: 234, lineStart: 235, lineEnd: 236},
    legacyScenarioEvidenceSpan: {lineStart: 234, lineEnd: 235},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    frame: 36,
    script: "DefineSprite_345/frame_36/DoAction.as" as const,
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    parserBlockSpanV1: {headingLine: 237, lineStart: 238, lineEnd: 239},
    legacyScenarioEvidenceSpan: {lineStart: 237, lineEnd: 238},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    frame: 54,
    script: "DefineSprite_345/frame_54/DoAction.as" as const,
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    parserBlockSpanV1: {headingLine: 240, lineStart: 241, lineEnd: 242},
    legacyScenarioEvidenceSpan: {lineStart: 240, lineEnd: 241},
    recordOnly: true,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
] as const);

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION_ACTION_RECORDS = deepFreeze([
  {
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    frame: 1,
    legacyScenarioEvidenceSpan: {lineEnd: 218, lineStart: 217},
    parserBlockSpanV1: {headingLine: 217, lineEnd: 219, lineStart: 218},
    script: "DefineSprite_345/frame_1/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "stop" as const,
  },
  {
    bodyBytes: 257,
    bodySha256: "790951eecf396145aff2136f219c1d0b45d08bca5bb74399896964f76eab6109",
    frame: 2,
    legacyScenarioEvidenceSpan: {lineEnd: 232, lineStart: 223},
    parserBlockSpanV1: {headingLine: 223, lineEnd: 233, lineStart: 224},
    script: "DefineSprite_345/frame_2/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "initialize-random-S1-S4-and-gotoAndPlay-selected-label" as const,
  },
  {
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    frame: 16,
    legacyScenarioEvidenceSpan: {lineEnd: 221, lineStart: 220},
    parserBlockSpanV1: {headingLine: 220, lineEnd: 222, lineStart: 221},
    script: "DefineSprite_345/frame_16/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    frame: 27,
    legacyScenarioEvidenceSpan: {lineEnd: 235, lineStart: 234},
    parserBlockSpanV1: {headingLine: 234, lineEnd: 236, lineStart: 235},
    script: "DefineSprite_345/frame_27/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    frame: 36,
    legacyScenarioEvidenceSpan: {lineEnd: 238, lineStart: 237},
    parserBlockSpanV1: {headingLine: 237, lineEnd: 239, lineStart: 238},
    script: "DefineSprite_345/frame_36/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
  {
    bodyBytes: 15,
    bodySha256: "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469",
    frame: 54,
    legacyScenarioEvidenceSpan: {lineEnd: 241, lineStart: 240},
    parserBlockSpanV1: {headingLine: 240, lineEnd: 242, lineStart: 241},
    script: "DefineSprite_345/frame_54/DoAction.as" as const,
    semanticsExecuted: false,
    staticOperation: "gotoAndStop-1" as const,
  },
] as const);

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_AUTHORITY_BOUNDARY = deepFreeze({
  audioAccepted: false,
  audioEngineeringAccepted: false,
  audioListeningAccepted: false,
  audioModeled: false,
  authoringAuditCompleted: false,
  authoritativeOriginalRuntimeEstablished: false,
  candidateQaCompleted: false,
  currentJavascriptImplemented: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  interactionBehaviorEstablished: false,
  languageBehaviorEstablished: false,
  naturalTraceEstablished: false,
  ownerAccepted: false,
  publicationAuthorized: false,
  releaseAuthorized: false,
  replayBehaviorEstablished: false,
  runtimeEntryEstablished: false,
  runtimeReachabilityEstablished: false,
  scoreBehaviorEstablished: false,
  sourceActionSemanticsExecuted: false,
  sourceDomainDeclared: false,
  strictAcceptanceEffect: "none" as const,
  strictComplete: false,
  structuralSourceEvidenceOnly: true,
  terminalBehaviorEstablished: false,
  visualFidelityEstablished: false,
});

export const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_EVIDENCE_CAVEATS =
  COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_AUTHORITY_BOUNDARY;

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_BLOCKERS = deepFreeze({
  actions: {
    actionFrames: [1, 2, 16, 27, 36, 54],
    actionSemanticsExecuted: false,
    answerFeedbackEstablished: false,
    frame2RandomSelection: {
      labels: ["S1", "S2", "S3", "S4"],
      randomFunction: "random" as const,
      selectedLabelTarget: "tempLabel" as const,
      sourceGlobal: "_global.rndAudio" as const,
      staticOnly: true,
    },
    scoreEstablished: false,
    terminalBehaviorEstablished: false,
  },
  audio: {
    cueMeaningEstablished: false,
    cueNaturalTriggerEstablished: false,
    cueOverlapEstablished: false,
    cueStartEndEstablished: false,
    durationMs: 4389,
    engineeringAccepted: false,
    language: "und" as const,
    languageResolved: false,
    listeningAccepted: false,
    replayBehaviorEstablished: false,
    sourceStream: {
      blockCount: 53,
      channels: 1,
      firstBlockFrame: 3,
      format: "mp3" as const,
      lastBlockFrame: 55,
      sampleRateHz: 22050,
      streamIndex: 7,
      syncMode: "stream" as const,
    },
    spokenContentResolved: false,
    timingEstablished: false,
  },
  authoring: {
    humanFlaAuditCompleted: false,
    status: "not-performed-by-this-script" as const,
  },
  frameDomains: {
    currentDeclaredTimelineIds: ["root"],
    currentDispositionCounts: {
      declaredFrameDomainCount: 1,
      unresolvedTimelineCount: 19,
    },
    otherUnresolvedTimelineIds: [
      "sprite-57", "sprite-59", "sprite-60", "sprite-64", "sprite-108", "sprite-109",
      "sprite-111", "sprite-115", "sprite-131", "sprite-156", "sprite-223", "sprite-225",
      "sprite-226", "sprite-252", "sprite-299", "sprite-323", "sprite-343", "sprite-346",
    ],
    parentFrameDomainDeclared: false,
    parentRuntimeClockEstablished: false,
    parentTimelineId: "sprite-346" as const,
    targetCurrentDisposition: "unresolved" as const,
  },
  interaction: {
    S1ThroughS4MeaningEstablished: false,
    answerBehaviorEstablished: false,
    feedbackBehaviorEstablished: false,
  },
  replay: {
    replayCandidates: 0,
    replayStateResetEstablished: false,
    terminalStateEstablished: false,
  },
  runtime: {
    dependencyClosure: false,
    naturalEntryEstablished: false,
    sourceActionSemanticsExecuted: false,
  },
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION = deepFreeze({
  acceptedTimelineIds: [COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN],
  actionFrameSequence: {
    count: 6,
    encoding: "one-indexed-decimal-frame-newline-v1" as const,
    ffdecSha256: "b61ed910992c140e2cb9424a620a28fb90ad8c13db61c0812546751db233bf7b",
    frames: [1, 2, 16, 27, 36, 54],
    swfmillSha256: "b61ed910992c140e2cb9424a620a28fb90ad8c13db61c0812546751db233bf7b",
  },
  actionRecords: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION_ACTION_RECORDS,
  lineNumberConvention: {
    authority: "parserBlockSpanV1" as const,
    authoritySemantics: "one-based normalized-LF positions emitted by parseFfdecDispositionScripts; lineStart is the first nonempty body line and lineEnd is the line immediately before the next heading, including a blank separator where emitted",
    joinKey: "script+bodySha256" as const,
    legacyRecord: "legacyScenarioEvidenceSpan" as const,
    legacySemantics: "checked-in scenario-inventory evidence span; begins on the heading line and ends on the last nonempty body line; record-only and not source-proof authority",
  },
  proofEngineFunction: "deriveSourceProvenIndependentRequiredAudit" as const,
  proofType: "multi-frame-local-action-independent-domain" as const,
  rejectedTimelineIds: [],
  remainingTimelineIds: [COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN],
  sourceConclusion: "separate-local-frame-action-domain-required-before-strict-acceptance" as const,
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INSPECTION_CONTRACT = deepFreeze({
  captureIdentity: null,
  deepFreezeRequired: true,
  descriptorOnlyExactRequest: true,
  entryStateSha256: null,
  failClosedBlockers: [
    "invalid-request",
    "invalid-frame",
    "unsupported-frame-domain",
    "unsupported-language",
    "unsupported-scenario",
    "unsupported-seed",
  ],
  frameDomain: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN,
  frameRange: {first: 1, last: 55},
  futureLanguageFrameDescriptorCount: 110,
  implementationAuthorized: false,
  positiveZeroOnly: true,
  registryEntryAuthorized: false,
  requirementId: null,
  rootFrame: null,
  sourceDomainDeclared: false,
  status: "proposal-only-no-module-authorized" as const,
  supportedLanguages: ["en", "es"],
  supportedScenario: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_SCENARIO,
  supportedSeed: 0,
  traceId: null,
  wholeLessonEntryAuthorized: false,
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_TARGET = deepFreeze({
  currentDisposition: "unresolved" as const,
  frameCount: 55,
  frameIndexing: "one-indexed" as const,
  labels: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_LABELS,
  root: {fps: 12, frameCount: 10},
  rootPlacementChain: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ROOT_PLACEMENT_CHAIN,
  sourceObjectId: "345" as const,
  stage: {
    captureRaster: {
      height: 600,
      rule: "ceil-positive-native-stage-dimensions" as const,
      units: "px" as const,
      width: 800,
    },
    native: {height: 599.75, units: "px" as const, width: 799.9},
    twips: {height: 11995, twipsPerPixel: 20, units: "twips" as const, width: 15998},
  },
  staticSignals: {controlStateCount: 11, namedChildPlacementCount: 0},
  tagCensus: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_TAG_CENSUS,
  timelineId: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN,
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_WRITE_POLICY = deepFreeze({
  applySupported: false,
  permittedWritePaths: [],
  readOnly: true,
  rendererAuthorized: false,
  sourceStaticModuleIsInput: false,
  sourceStaticTestIsInput: false,
  targetFiles: [],
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_CORE = deepFreeze({
  animationId: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ANIMATION_ID,
  authorityBoundary: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_AUTHORITY_BOUNDARY,
  blockers: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_BLOCKERS,
  derivation: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION,
  inputSet: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INPUT_SET,
  prospectiveInspectionContract:
    COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_INSPECTION_CONTRACT,
  releaseId: "lesson-g04-l11-coordinate-grid" as const,
  releaseMembership: {
    ordinal: 27,
    releaseRole: "active-xml-referenced-page" as const,
    xmlOccurrence: 27,
  },
  target: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_TARGET,
  writePolicy: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_WRITE_POLICY,
});

const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROSPECTIVE_PROOF = deepFreeze({
  proofEngineFunction: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.proofEngineFunction,
  proofType: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.proofType,
  sourceConclusion: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.sourceConclusion,
  acceptedTimelineIds: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.acceptedTimelineIds,
  rejectedTimelineIds: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.rejectedTimelineIds,
  remainingTimelineIds: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_DERIVATION.remainingTimelineIds,
  prospective: true,
  materialized: false,
  successorPresent: false,
  sourceDomainDeclared: false,
  strictAcceptanceEffect: "none" as const,
});

/**
 * These data are a hash-bound planning record. They do not permit a source
 * domain declaration or make the parent runtime entry path available.
 */
export const COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE = deepFreeze({
  animationId: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ANIMATION_ID,
  assetId: "swf-83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  releaseMembership: {
    releaseId: "lesson-g04-l11-coordinate-grid" as const,
    releaseRole: "active-xml-referenced-page" as const,
    ordinal: 27,
    xmlOccurrence: 27,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.fla" as const,
    bytes: 3131904,
    sha256: "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
    presenceAndHashOnly: true,
  },
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.swf" as const,
    bytes: 442966,
    sha256: "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  },
  runtimeHeader: {
    stage: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_TARGET.stage,
    fps: 12,
    root: {id: "root" as const, frameCount: 10},
  },
  sprite345: {
    id: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "345" as const,
    frameCount: 55,
    frameIndexing: "one-indexed" as const,
    currentDisposition: "unresolved" as const,
    frameLabels: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_FRAME_LABELS,
    rootPlacementChain: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_ROOT_PLACEMENT_CHAIN,
    tagCensus: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_TAG_CENSUS,
    actionFrames: [1, 2, 16, 27, 36, 54],
    actionFrameSequenceSha256:
      "b61ed910992c140e2cb9424a620a28fb90ad8c13db61c0812546751db233bf7b",
    actionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1" as const,
    actionRecords: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_ACTION_RECORDS,
    staticSignals: {controlStateCount: 11, namedChildPlacementCount: 0},
    embeddedSoundStream: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_BLOCKERS.audio.sourceStream,
  },
  currentFrameDomainState: {
    persistedDeclaredTimelineIds: ["root"],
    currentDeclaredTimelineIds: ["root"],
    declaredFrameDomainCount: 1,
    unresolvedTimelineCount: 19,
    sprite345Disposition: "unresolved" as const,
    parentTimelineId: "sprite-346" as const,
    parentFrameDomainDeclared: false,
    parentRuntimeClockEstablished: false,
    sourceDomainDeclared: false,
    successorPresent: false,
  },
  prospectiveProof: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROSPECTIVE_PROOF,
  predecessorProposal: {
    planner: {
      path: "scripts/prepare-g4-l11-ti003-sprite345-source-domain-predecessor.mjs" as const,
      bytes: 47698,
      sha256: "1fa8edb1f4ec696da33f412aeac380787ed560d5df2c43f3722a917b281e320a",
    },
    artifactType: "g4-l11-ti003-sprite345-source-domain-predecessor-proposal" as const,
    schemaVersion: 1,
    stdout: {
      bytes: 18377,
      sha256: "d74c99230aac52e0a1ff5e83c447427fe3383c73d2779780c98307e1f462b420",
    },
    proposalCoreCanonicalJson: {
      bytes: 17056,
      sha256: "1a1ce638d72d7528c74e2b9429f070ea95cc9af10478438a0a47a237e274236a",
    },
    proposalCoreSha256: "1a1ce638d72d7528c74e2b9429f070ea95cc9af10478438a0a47a237e274236a",
    proposalCore: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_PROPOSAL_CORE,
  },
  sourceDomainDeclared: false,
  captureIdentity: null,
});

export type CourseG04L11Ti003Sprite345PredecessorSourceFrameStructuralMarker =
  | "first-local-frame"
  | "source-frame-label"
  | "record-only-avm1-doaction-frame"
  | "last-local-frame";

export type CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11Ti003Sprite345PredecessorSourceFrameInspection {
  readonly status: "prospective-source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11Ti003Sprite345PredecessorSourceFrameLanguage;
  readonly seed: 0;
  readonly rootFrame: null;
  readonly sourceDomainDeclared: false;
  readonly rootPlacementChain:
    typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.rootPlacementChain;
  readonly frameLabel:
    | (typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.frameLabels)[number]
    | null;
  readonly structuralMarkers:
    readonly CourseG04L11Ti003Sprite345PredecessorSourceFrameStructuralMarker[];
  readonly avm1Action: Readonly<{
    readonly presentAtRequestedFrame: boolean;
    readonly sourceRecord:
      | (typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.actionRecords)[number]
      | null;
    readonly recordOnly: true;
    readonly semanticsExecuted: false;
  }>;
  readonly embeddedSoundStream:
    typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.embeddedSoundStream;
  readonly cueAtRequestedFrameEstablished: false;
  readonly tagCensus:
    typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.tagCensus;
  readonly blockers:
    typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.predecessorProposal.proposalCore.blockers;
  readonly prospectiveProof:
    typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.prospectiveProof;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_EVIDENCE_CAVEATS;
}

export interface CourseG04L11Ti003Sprite345PredecessorBlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionBlocker;
  readonly frame: null;
  readonly frameDomain: null;
  readonly scenario: null;
  readonly lang: null;
  readonly seed: null;
  readonly rootFrame: null;
  readonly sourceDomainDeclared: false;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_EVIDENCE_CAVEATS;
}

export type CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionResult =
  | CourseG04L11Ti003Sprite345PredecessorSourceFrameInspection
  | CourseG04L11Ti003Sprite345PredecessorBlockedSourceFrameInspection;

const isSourceFrameLanguage = (
  value: unknown,
): value is CourseG04L11Ti003Sprite345PredecessorSourceFrameLanguage =>
  COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_LANGUAGES.includes(
    value as CourseG04L11Ti003Sprite345PredecessorSourceFrameLanguage,
  );

const isSourceFrame = (frame: unknown): frame is number =>
  typeof frame === "number"
  && Number.isSafeInteger(frame)
  && frame >= 1
  && frame <= COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.frameCount;

type ExactSourceFrameRequestValues = Readonly<{
  readonly frameDomain: unknown;
  readonly scenario: unknown;
  readonly lang: unknown;
  readonly seed: unknown;
}>;

/**
 * Inspect descriptors only. This must never invoke a caller-supplied getter
 * or use inherited properties to turn an arbitrary probe into a request.
 */
const exactRequestValues = (
  request: object,
): ExactSourceFrameRequestValues | null => {
  try {
    const expectedKeys = ["frameDomain", "scenario", "lang", "seed"] as const;
    const ownKeys = Reflect.ownKeys(request);
    if (ownKeys.length !== expectedKeys.length
      || ownKeys.some((key) => typeof key !== "string")
      || expectedKeys.some((key) => !ownKeys.includes(key))) return null;

    const descriptors = Object.getOwnPropertyDescriptors(request);
    const descriptorKeys = Reflect.ownKeys(descriptors);
    if (descriptorKeys.length !== expectedKeys.length
      || descriptorKeys.some((key) => typeof key !== "string")
      || expectedKeys.some((key) => !descriptorKeys.includes(key))) return null;

    for (const key of expectedKeys) {
      const descriptor = descriptors[key];
      if (descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.prototype.hasOwnProperty.call(descriptor, "value")
        || Object.prototype.hasOwnProperty.call(descriptor, "get")
        || Object.prototype.hasOwnProperty.call(descriptor, "set")) return null;
    }

    return {
      frameDomain: descriptors.frameDomain?.value,
      scenario: descriptors.scenario?.value,
      lang: descriptors.lang?.value,
      seed: descriptors.seed?.value,
    };
  } catch {
    return null;
  }
};

const sourceFrameLabel = (frame: number):
  | (typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.frameLabels)[number]
  | null => COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.frameLabels.find(
  (label) => label.frame === frame,
) ?? null;

const sourceActionRecord = (frame: number):
  | (typeof COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.actionRecords)[number]
  | null => COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.actionRecords.find(
  (record) => record.frame === frame,
) ?? null;

const structuralMarkersForSourceFrame = (
  frame: number,
): readonly CourseG04L11Ti003Sprite345PredecessorSourceFrameStructuralMarker[] => {
  const markers: CourseG04L11Ti003Sprite345PredecessorSourceFrameStructuralMarker[] = [];
  if (frame === 1) markers.push("first-local-frame");
  if (sourceFrameLabel(frame) !== null) markers.push("source-frame-label");
  if (sourceActionRecord(frame) !== null) markers.push("record-only-avm1-doaction-frame");
  if (frame === COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.frameCount) {
    markers.push("last-local-frame");
  }
  return deepFreeze(markers);
};

const blockedSourceFrameInspection = (
  blocker: CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionBlocker,
): CourseG04L11Ti003Sprite345PredecessorBlockedSourceFrameInspection => deepFreeze({
  status: "blocked" as const,
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  rootFrame: null,
  sourceDomainDeclared: false,
  captureIdentity: null,
  requirementId: null,
  traceId: null,
  entryStateSha256: null,
  evidenceCaveats: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_EVIDENCE_CAVEATS,
}) as CourseG04L11Ti003Sprite345PredecessorBlockedSourceFrameInspection;

/**
 * Inspect one exact one-indexed sprite-345 source record. Valid results carry
 * no parent playhead, runtime entry, capture identity, or cue timing claim.
 */
export const inspectCourseG04L11Ti003Sprite345PredecessorSourceFrame = (
  frame: unknown,
  request: unknown,
): CourseG04L11Ti003Sprite345PredecessorSourceFrameInspectionResult => {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    return blockedSourceFrameInspection("invalid-request");
  }
  const values = exactRequestValues(request);
  if (values === null) return blockedSourceFrameInspection("invalid-request");
  if (values.frameDomain !== COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN) {
    return blockedSourceFrameInspection("unsupported-frame-domain");
  }
  if (!isSourceFrameLanguage(values.lang)) {
    return blockedSourceFrameInspection("unsupported-language");
  }
  if (values.scenario !== COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_SCENARIO) {
    return blockedSourceFrameInspection("unsupported-scenario");
  }
  if (!Object.is(values.seed, 0)) return blockedSourceFrameInspection("unsupported-seed");
  if (!isSourceFrame(frame)) return blockedSourceFrameInspection("invalid-frame");

  const action = sourceActionRecord(frame);
  return deepFreeze({
    status: "prospective-source-static" as const,
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: values.lang,
    seed: 0 as const,
    rootFrame: null,
    sourceDomainDeclared: false,
    rootPlacementChain: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.rootPlacementChain,
    frameLabel: sourceFrameLabel(frame),
    structuralMarkers: structuralMarkersForSourceFrame(frame),
    avm1Action: {
      presentAtRequestedFrame: action !== null,
      sourceRecord: action,
      recordOnly: true,
      semanticsExecuted: false,
    },
    embeddedSoundStream: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.embeddedSoundStream,
    cueAtRequestedFrameEstablished: false,
    tagCensus: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.sprite345.tagCensus,
    blockers: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.predecessorProposal.proposalCore.blockers,
    prospectiveProof: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_SOURCE.prospectiveProof,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_TI_003_SPRITE345_PREDECESSOR_EVIDENCE_CAVEATS,
  }) as CourseG04L11Ti003Sprite345PredecessorSourceFrameInspection;
};
