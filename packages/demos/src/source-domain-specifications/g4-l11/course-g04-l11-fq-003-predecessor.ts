/**
 * This is a predecessor-bound, source-static inspection query for FQ003
 * sprite-910. It records a hash-bound proposal's structural facts only. It
 * does not declare the domain, execute AVM1, or offer playback.
 */

export const COURSE_G04_L11_FQ_003_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-fq-003" as const;
export const COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN =
  "sprite-910" as const;
export const COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO =
  "prospective-source-domain-entry-unresolved" as const;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES = deepFreeze([
  "en",
  "es",
] as const);

export type CourseG04L11Fq003PredecessorSourceFrameLanguage =
  (typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES)[number];

const COURSE_G04_L11_FQ_003_PREDECESSOR_FRAME_LABELS = deepFreeze([
  {frame: 1, label: "FirstSection"},
  ...Array.from({length: 26}, (_, index) => ({
    frame: index + 2,
    label: `Q${index + 1}`,
  })),
  {frame: 29, label: "Review"},
  ...Array.from({length: 26}, (_, index) => ({
    frame: index + 46,
    label: `R${index + 1}`,
  })),
] as const);

const COURSE_G04_L11_FQ_003_PREDECESSOR_ROOT_PLACEMENT = deepFreeze({
  parentTimelineId: "root" as const,
  childTimelineId: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
  sourceObjectId: "910" as const,
  frame: 6,
  depth: "3" as const,
  instanceName: "animation" as const,
  tag: "PlaceObject2" as const,
  replace: "0" as const,
  hasClipActions: false,
  matrixTwips: {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 7350,
    ty: 4322,
  },
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_ACTION_RECORDS = deepFreeze([
  {
    frame: 1,
    script: "DefineSprite_910/frame_1/DoAction.as" as const,
    bodyBytes: 7727,
    bodySha256:
      "01831a3666908aa549172819c226b0af5952d57fdafdea2ebaf5fb8a4d824d7c",
    parserBlockSpanV1: {headingLine: 194, lineStart: 195, lineEnd: 419},
    legacyScenarioEvidenceSpan: {lineStart: 194, lineEnd: 418},
    recordOnly: true,
    semanticsExecuted: false,
  },
  {
    frame: 29,
    script: "DefineSprite_910/frame_29/DoAction.as" as const,
    bodyBytes: 28,
    bodySha256:
      "70b687558cb87688f2abb52576857fdb7a866f83112ac7b59b1364392023268e",
    parserBlockSpanV1: {headingLine: 952, lineStart: 953, lineEnd: 954},
    legacyScenarioEvidenceSpan: {lineStart: 952, lineEnd: 953},
    recordOnly: true,
    semanticsExecuted: false,
  },
  {
    frame: 45,
    script: "DefineSprite_910/frame_45/DoAction.as" as const,
    bodyBytes: 7,
    bodySha256:
      "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    parserBlockSpanV1: {headingLine: 1011, lineStart: 1012, lineEnd: 1013},
    legacyScenarioEvidenceSpan: {lineStart: 1011, lineEnd: 1012},
    recordOnly: true,
    semanticsExecuted: false,
  },
] as const);

const COURSE_G04_L11_FQ_003_PREDECESSOR_TAG_CENSUS = deepFreeze({
  DoAction: 3,
  End: 1,
  FrameLabel: 54,
  PlaceObject2: 1069,
  RemoveObject2: 635,
  ShowFrame: 72,
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_INPUT_BINDINGS = deepFreeze([
  {
    id: "source-swf" as const,
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf" as const,
    bytes: 57010,
    sha256: "d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  },
  {
    id: "source-fla" as const,
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.fla" as const,
    bytes: 3217408,
    sha256: "f69ac59104bf8a05f9920b0dc2e6cb3fa84aa32d2d0da054203e972eb06a5c4c",
  },
  {
    id: "migration-manifest" as const,
    path: "migrations/course-g04-l11-fq-003/migration.json" as const,
    bytes: 8062,
    sha256: "9b1719c8e3c5c865e3393991afaf74f982a0d20dc5275368f42bec8b7f1cd489",
  },
  {
    id: "machine-report" as const,
    path: "migrations/course-g04-l11-fq-003/audit/machine/report.json" as const,
    bytes: 105195,
    sha256: "88695b3111fe914de2be5f75d16aaaecccb5a721a1f31d71c80f3ce4ae3d72ae",
  },
  {
    id: "machine-frame-domain-candidates" as const,
    path: "migrations/course-g04-l11-fq-003/audit/machine/swf-frame-domain-candidates.json" as const,
    bytes: 70944,
    sha256: "e7288adf3928c4e875d3292d9b792b4406a7c133495b9d69a8d23ea29fd638fb",
  },
  {
    id: "swfmill-xml-gzip" as const,
    path: "migrations/course-g04-l11-fq-003/audit/machine/swfmill.xml.gz" as const,
    bytes: 186064,
    sha256: "1f530fdec6492e258628f96993eddc796fbf4655108079c50ba0a72a1507584c",
    uncompressed: {
      bytes: 4408786,
      sha256: "e3aaaf76d9fa5428080326f2fc271e8438e53c715cef492abae411cbfc72e159",
    },
  },
  {
    id: "ffdec-scripts-gzip" as const,
    path: "migrations/course-g04-l11-fq-003/audit/machine/ffdec-scripts.txt.gz" as const,
    bytes: 3826,
    sha256: "21ea324d1b2082f8334f2a8bc7868396453dea83f91d814f898afcc1ba76f3cf",
    uncompressed: {
      bytes: 40061,
      sha256: "4335879f1c4b2dd5555bdc1b5f6a9096b70187a2f67fd8ebeece52ff80442c28",
    },
  },
  {
    id: "scenario-inventory" as const,
    path: "migrations/course-g04-l11-fq-003/audit/scenario-inventory.json" as const,
    bytes: 2676520,
    sha256: "9b2f8ad339d7be33b6e541a83cbf86d2cdeabeaffaed77f019dd6cdc66721afa",
  },
  {
    id: "frame-domain-disposition" as const,
    path: "migrations/course-g04-l11-fq-003/audit/frame-domain-disposition.json" as const,
    bytes: 553536,
    sha256: "2ac311836b9aa37ada205d22537c4e843fdf886de73f7cbd7f08d3c6ba4dfa9b",
  },
  {
    id: "runtime-dependency-scope" as const,
    path: "migrations/course-g04-l11-fq-003/audit/runtime-dependency-scope.json" as const,
    bytes: 179753,
    sha256: "c5417b4bdb56a8188588f5eda6a69abb6a6bbd12b2efcee964019672c2211719",
  },
  {
    id: "audio-runtime-evidence" as const,
    path: "migrations/course-g04-l11-fq-003/audit/audio-runtime-evidence.json" as const,
    bytes: 942403,
    sha256: "98d7cb32cf3741677ea6cb28a86aa7ff4eefdf5f59b07dc9d92a57676ffd7283",
  },
  {
    id: "audio-inventory" as const,
    path: "migrations/course-g04-l11-fq-003/audio-inventory.csv" as const,
    bytes: 94912,
    sha256: "41498a2e411eb399a4a1e61e242e2b878ca016c854883f006845cac1ab384cd0",
  },
  {
    id: "lesson-release-catalog" as const,
    path: "catalog/lesson-releases.json" as const,
    bytes: 145216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
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
    bytes: 124789,
    sha256: "092d9a444ecc3e261fb5dd5d74e83b48f7fbab05a486598eebf7a99d968545af",
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

const COURSE_G04_L11_FQ_003_PREDECESSOR_INPUT_SET = deepFreeze({
  bindings: COURSE_G04_L11_FQ_003_PREDECESSOR_INPUT_BINDINGS,
  count: 18,
  encoding: "fixed-order-path-tab-bytes-tab-sha256-newline-v1" as const,
  sha256: "d713f8977e5a62c0044c632a4a1e617e3cef37f140db99839ba65780124b056f",
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_AUTHORITY_BOUNDARY = deepFreeze({
  audioAccepted: false,
  audioModeled: false,
  authoritativeOriginalRuntimeEstablished: false,
  candidateQaCompleted: false,
  currentJavascriptImplemented: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  naturalTraceEstablished: false,
  ownerAccepted: false,
  publicationAuthorized: false,
  quizBehaviorEstablished: false,
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
  visualFidelityEstablished: false,
});

export const COURSE_G04_L11_FQ_003_PREDECESSOR_EVIDENCE_CAVEATS =
  COURSE_G04_L11_FQ_003_PREDECESSOR_AUTHORITY_BOUNDARY;

const COURSE_G04_L11_FQ_003_PREDECESSOR_BLOCKERS = deepFreeze({
  audio: {
    candidateOnlyCount: 260,
    catalogExactCueAssociationCount: 0,
    cueFrameResolved: false,
    cueTriggerResolved: false,
    durationResolved: false,
    embeddedDefineSoundCount: 0,
    embeddedSoundStreamCount: 0,
    languages: {en: 130, es: 130},
    listeningAccepted: false,
    obligationCount: 260,
    runtimeReachabilityVerified: false,
    silenceEstablished: false,
    spokenContentResolved: false,
    timingResolved: false,
  },
  children: {
    currentNestedCandidateCount: 213,
    currentUnresolvedCount: 213,
    otherNestedCandidateCount: 212,
    otherNestedFrameHistogram: {eightFrames: 1, oneFrame: 209, twoFrames: 2},
    runtimeDispositionEstablished: false,
  },
  host: {
    externalBindingCandidateCount: 13,
    hostDefaultsEstablished: false,
    legacySideEffectsExecuted: false,
  },
  quiz: {
    branchOrderEstablished: false,
    buttonDefinitionCount: 7,
    correctHandlerSignalCount: 28,
    dynamicTimelineTargetsResolved: false,
    editTextCount: 277,
    hitGeometryEstablished: false,
    randomBehaviorProven: false,
    routines: ["doGetRandomQuiz", "doGetReview", "doShowReview"],
    sprite910HandlerCount: 105,
    sprite910NonEventScriptCount: 3,
    staticRandomCallCount: 0,
    totalQuestionCount: 26,
    wholeSwfHandlerCount: 109,
    wrongHandlerSignalCount: 80,
  },
  replay: {
    fullStateResetEstablished: false,
    replayCandidateCount: 0,
    replayTargetEstablished: false,
    terminalBehaviorEstablished: false,
    terminalCandidateCount: 217,
  },
  score: {
    reportingHostResolved: false,
    semanticsExecuted: false,
    sourceScript: "DefineSprite_16/frame_2/DoAction.as" as const,
    thresholds: [
      {label: "Unsatisfactory", maximum: 3, minimum: null},
      {label: "Partially Proficient", maximum: 6, minimum: 4},
      {label: "Proficient", maximum: 8, minimum: 7},
      {label: "Advanced", maximum: null, minimum: 9},
    ],
  },
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_PROPOSAL_TARGET = deepFreeze({
  currentDisposition: "unresolved" as const,
  frameCount: 72,
  frameIndexing: "one-indexed" as const,
  labels: {
    firstSection: {frame: 1, label: "FirstSection" as const},
    frameLabelCount: 54,
    questions: {count: 26, firstFrame: 2, labelPattern: "Q{1..26}" as const, lastFrame: 27},
    review: {frame: 29, label: "Review" as const},
    reviewQuestions: {count: 26, firstFrame: 46, labelPattern: "R{1..26}" as const, lastFrame: 71},
  },
  rootPlacement: COURSE_G04_L11_FQ_003_PREDECESSOR_ROOT_PLACEMENT,
  sourceObjectId: "910" as const,
  staticSignals: {controlStateCount: 56, namedChildPlacementCount: 488},
  tagCensus: COURSE_G04_L11_FQ_003_PREDECESSOR_TAG_CENSUS,
  timelineId: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION_ACTION_RECORDS =
  deepFreeze(COURSE_G04_L11_FQ_003_PREDECESSOR_ACTION_RECORDS.map((record) => ({
    bodyBytes: record.bodyBytes,
    bodySha256: record.bodySha256,
    frame: record.frame,
    legacyScenarioEvidenceSpan: record.legacyScenarioEvidenceSpan,
    parserBlockSpanV1: record.parserBlockSpanV1,
    script: record.script,
    semanticsExecuted: false,
  })));

const COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION = deepFreeze({
  acceptedTimelineIds: [COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN],
  actionFrameSequence: {
    count: 3,
    encoding: "one-indexed-decimal-frame-newline-v1" as const,
    ffdecSha256: "7095a44e6932286e17b87b6263eabeb07049991e15a87f567c280dff2c0af849",
    frames: [1, 29, 45],
    swfmillSha256: "7095a44e6932286e17b87b6263eabeb07049991e15a87f567c280dff2c0af849",
  },
  actionRecords: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION_ACTION_RECORDS,
  lineNumberConvention: {
    authority: "parserBlockSpanV1" as const,
    authoritySemantics: "one-based normalized-LF positions emitted by parseFfdecDispositionScripts; lineStart is first nonempty body line and lineEnd is the line immediately before the next heading, including the blank separator in these three blocks",
    joinKey: "script+bodySha256" as const,
    legacyRecord: "legacyScenarioEvidenceSpan" as const,
    legacySemantics: "checked-in scenario-inventory evidence span; begins on the heading line and ends on the last nonempty body line; record-only, not source-proof authority",
  },
  proofEngineFunction: "deriveSourceProvenIndependentRequiredAudit" as const,
  proofType: "multi-frame-local-action-independent-domain" as const,
  rejectedTimelineIds: [],
  remainingTimelineIds: [COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN],
  sourceConclusion: "separate-local-frame-action-domain-required-before-strict-acceptance" as const,
});

/**
 * The accepted planner derives only this prospective proof. It is neither a
 * materialized successor nor a declaration that the local domain is usable.
 */
const COURSE_G04_L11_FQ_003_PREDECESSOR_PROSPECTIVE_PROOF = deepFreeze({
  proofEngineFunction:
    COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.proofEngineFunction,
  proofType: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.proofType,
  sourceConclusion: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.sourceConclusion,
  acceptedTimelineIds: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.acceptedTimelineIds,
  rejectedTimelineIds: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.rejectedTimelineIds,
  remainingTimelineIds: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION.remainingTimelineIds,
  prospective: true,
  materialized: false,
  successorPresent: false,
  sourceDomainDeclared: false,
  strictAcceptanceEffect: "none" as const,
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_INSPECTION_CONTRACT = deepFreeze({
  captureIdentity: null,
  deepFreezeRequired: true,
  entryStateSha256: null,
  failClosedBlockers: [
    "invalid-request",
    "invalid-frame",
    "unsupported-frame-domain",
    "unsupported-language",
    "unsupported-scenario",
    "unsupported-seed",
  ],
  frameRange: {first: 1, last: 72},
  implementationAuthorized: false,
  registryEntryAuthorized: false,
  requirementId: null,
  rootFrame: null,
  sourceDomainDeclared: false,
  status: "proposal-only-no-module-authorized" as const,
  supportedLanguages: ["en", "es"],
  supportedScenario: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
  supportedSeed: 0,
  traceId: null,
  wholeLessonEntryAuthorized: false,
});

const COURSE_G04_L11_FQ_003_PREDECESSOR_WRITE_POLICY = deepFreeze({
  applySupported: false,
  permittedWritePaths: [],
  readOnly: true,
  rendererAuthorized: false,
  sourceStaticModuleIsInput: false,
  sourceStaticTestIsInput: false,
  targetFiles: [],
});

export const COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE = deepFreeze({
  animationId: COURSE_G04_L11_FQ_003_PREDECESSOR_ANIMATION_ID,
  assetId: "swf-d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  releaseMembership: {
    releaseId: "lesson-g04-l11-coordinate-grid" as const,
    releaseRole: "active-xml-referenced-page" as const,
    ordinal: 43,
    xmlOccurrence: 43,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.fla" as const,
    bytes: 3217408,
    sha256: "f69ac59104bf8a05f9920b0dc2e6cb3fa84aa32d2d0da054203e972eb06a5c4c",
    presenceAndHashOnly: true,
  },
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf" as const,
    bytes: 57010,
    sha256: "d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  },
  runtimeHeader: {
    backgroundColor: "#b8d8f7" as const,
    stage: {
      twips: {units: "twips" as const, width: 16000, height: 12000, twipsPerPixel: 20},
      native: {units: "px" as const, width: 800, height: 600},
      captureRaster: {
        units: "px" as const,
        width: 800,
        height: 600,
        rule: "ceil-positive-native-stage-dimensions" as const,
      },
    },
    fps: 12,
    root: {id: "root" as const, frameCount: 10},
  },
  sprite910: {
    id: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "910" as const,
    frameCount: 72,
    frameIndexing: "one-indexed" as const,
    currentDisposition: "unresolved" as const,
    rootPlacement: COURSE_G04_L11_FQ_003_PREDECESSOR_ROOT_PLACEMENT,
    tagCensus: COURSE_G04_L11_FQ_003_PREDECESSOR_TAG_CENSUS,
    frameLabels: COURSE_G04_L11_FQ_003_PREDECESSOR_FRAME_LABELS,
    actionFrames: [1, 29, 45],
    actionFrameSequenceSha256:
      "7095a44e6932286e17b87b6263eabeb07049991e15a87f567c280dff2c0af849",
    actionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1" as const,
    actionRecords: COURSE_G04_L11_FQ_003_PREDECESSOR_ACTION_RECORDS,
    staticSignals: {controlStateCount: 56, namedChildPlacementCount: 488},
  },
  currentFrameDomainState: {
    persistedDeclaredTimelineIds: ["root"],
    declaredFrameDomains: [],
    sprite910Disposition: "unresolved" as const,
    sourceStaticIndependentDomainProven: false,
    successorProofPresent: false,
    sourceDomainDeclared: false,
  },
  sourceStaticPredecessor: {
    path: "packages/demos/src/source-static/g4-l11/course-g04-l11-fq-003-static.ts" as const,
    bytes: 83736,
    sha256: "ebdfde9938730420f7e57752ca24ffeebf78f830854d886b2f56cf604e7b7e60",
    independentDomainProven: false,
  },
  predecessorProposal: {
    planner: {
      path: "scripts/prepare-g4-l11-fq003-sprite910-source-domain-predecessor.mjs" as const,
      bytes: 39264,
      sha256: "4beb69ad559a1cccc07425d62a8375d9455b894c612ed0f3f19e95302b5fae39",
    },
    artifactType: "g4-l11-fq003-sprite910-source-domain-predecessor-proposal" as const,
    schemaVersion: 1,
    stdout: {
      bytes: 14697,
      sha256: "478f8834dd9c1c0261334b270fc2796975d03750e598853de511b2986d811004",
    },
    proposalCoreCanonicalJson: {
      bytes: 13628,
      sha256: "777a7544165e3f25fd453eb62153ebbeb16b953fb2f736a8147ad498b462ee43",
    },
    proposalCoreSha256: "777a7544165e3f25fd453eb62153ebbeb16b953fb2f736a8147ad498b462ee43",
    proposalCore: {
      animationId: COURSE_G04_L11_FQ_003_PREDECESSOR_ANIMATION_ID,
      authorityBoundary: COURSE_G04_L11_FQ_003_PREDECESSOR_AUTHORITY_BOUNDARY,
      blockers: COURSE_G04_L11_FQ_003_PREDECESSOR_BLOCKERS,
      derivation: COURSE_G04_L11_FQ_003_PREDECESSOR_DERIVATION,
      inputSet: COURSE_G04_L11_FQ_003_PREDECESSOR_INPUT_SET,
      prospectiveInspectionContract: COURSE_G04_L11_FQ_003_PREDECESSOR_INSPECTION_CONTRACT,
      releaseId: "lesson-g04-l11-coordinate-grid" as const,
      releaseMembership: {
        ordinal: 43,
        releaseRole: "active-xml-referenced-page" as const,
        xmlOccurrence: 43,
      },
      target: COURSE_G04_L11_FQ_003_PREDECESSOR_PROPOSAL_TARGET,
      writePolicy: COURSE_G04_L11_FQ_003_PREDECESSOR_WRITE_POLICY,
    },
  },
  sourceDomainDeclared: false,
  captureIdentity: null,
});

export type CourseG04L11Fq003PredecessorSourceFrameStructuralMarker =
  | "first-local-frame"
  | "source-frame-label"
  | "record-only-avm1-doaction-frame"
  | "last-local-frame";

export type CourseG04L11Fq003PredecessorSourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Fq003PredecessorSourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11Fq003PredecessorSourceFrameInspection {
  readonly status: "prospective-source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11Fq003PredecessorSourceFrameLanguage;
  readonly seed: 0;
  readonly rootFrame: null;
  readonly sourceDomainDeclared: false;
  readonly rootPlacement: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.rootPlacement;
  readonly frameLabel:
    | (typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameLabels)[number]
    | null;
  readonly structuralMarkers: readonly CourseG04L11Fq003PredecessorSourceFrameStructuralMarker[];
  readonly avm1Action: Readonly<{
    readonly presentAtRequestedFrame: boolean;
    readonly sourceRecord:
      | (typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.actionRecords)[number]
      | null;
    readonly recordOnly: true;
    readonly semanticsExecuted: false;
  }>;
  readonly tagCensus: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.tagCensus;
  readonly blockers: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.predecessorProposal.proposalCore.blockers;
  readonly prospectiveProof: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_PROSPECTIVE_PROOF;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export interface CourseG04L11Fq003PredecessorBlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11Fq003PredecessorSourceFrameInspectionBlocker;
  readonly frame: null;
  readonly frameDomain: null;
  readonly scenario: null;
  readonly lang: null;
  readonly seed: null;
  readonly sourceDomainDeclared: false;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_FQ_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export type CourseG04L11Fq003PredecessorSourceFrameInspectionResult =
  | CourseG04L11Fq003PredecessorSourceFrameInspection
  | CourseG04L11Fq003PredecessorBlockedSourceFrameInspection;

const isSourceFrameLanguage = (
  value: unknown,
): value is CourseG04L11Fq003PredecessorSourceFrameLanguage =>
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES.includes(
    value as CourseG04L11Fq003PredecessorSourceFrameLanguage,
  );

const isSourceFrame = (frame: unknown): frame is number =>
  typeof frame === "number"
  && Number.isSafeInteger(frame)
  && frame >= 1
  && frame <= COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameCount;

type ExactSourceFrameRequestValues = Readonly<{
  readonly frameDomain: unknown;
  readonly scenario: unknown;
  readonly lang: unknown;
  readonly seed: unknown;
}>;

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
      frameDomain: descriptors.frameDomain.value,
      scenario: descriptors.scenario.value,
      lang: descriptors.lang.value,
      seed: descriptors.seed.value,
    };
  } catch {
    return null;
  }
};

const structuralMarkersForSourceFrame = (
  frame: number,
): readonly CourseG04L11Fq003PredecessorSourceFrameStructuralMarker[] => {
  const markers: CourseG04L11Fq003PredecessorSourceFrameStructuralMarker[] = [];
  if (frame === 1) markers.push("first-local-frame");
  if (COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameLabels.some(
    (label) => label.frame === frame,
  )) markers.push("source-frame-label");
  if (COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.actionRecords.some(
    (record) => record.frame === frame,
  )) markers.push("record-only-avm1-doaction-frame");
  if (frame === COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameCount) {
    markers.push("last-local-frame");
  }
  return deepFreeze(markers);
};

const actionRecordForSourceFrame = (
  frame: number,
): (typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.actionRecords)[number] | null =>
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.actionRecords.find(
    (record) => record.frame === frame,
  ) ?? null;

const labelForSourceFrame = (
  frame: number,
): (typeof COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameLabels)[number] | null =>
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.frameLabels.find(
    (label) => label.frame === frame,
  ) ?? null;

const blockedSourceFrameInspection = (
  blocker: CourseG04L11Fq003PredecessorSourceFrameInspectionBlocker,
): CourseG04L11Fq003PredecessorBlockedSourceFrameInspection => deepFreeze({
  status: "blocked" as const,
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  sourceDomainDeclared: false,
  captureIdentity: null,
  requirementId: null,
  traceId: null,
  entryStateSha256: null,
  evidenceCaveats: COURSE_G04_L11_FQ_003_PREDECESSOR_EVIDENCE_CAVEATS,
}) as CourseG04L11Fq003PredecessorBlockedSourceFrameInspection;

/**
 * Inspect one exact one-indexed sprite-910 source frame. The public boundary
 * accepts unknown inputs, reads request descriptors without ordinary property
 * access, and returns no root playhead, capture, or runtime state.
 */
export const inspectCourseG04L11Fq003PredecessorSourceFrame = (
  frame: unknown,
  request: unknown,
): CourseG04L11Fq003PredecessorSourceFrameInspectionResult => {
  let requestValues: ExactSourceFrameRequestValues | null;
  try {
    if (typeof request !== "object" || request === null || Array.isArray(request)) {
      return blockedSourceFrameInspection("invalid-request");
    }
    requestValues = exactRequestValues(request);
  } catch {
    return blockedSourceFrameInspection("invalid-request");
  }
  if (requestValues === null) return blockedSourceFrameInspection("invalid-request");

  const frameDomain = requestValues.frameDomain;
  const language = requestValues.lang;
  const scenario = requestValues.scenario;
  const seed = requestValues.seed;

  if (frameDomain !== COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN) {
    return blockedSourceFrameInspection("unsupported-frame-domain");
  }
  if (!isSourceFrameLanguage(language)) {
    return blockedSourceFrameInspection("unsupported-language");
  }
  if (scenario !== COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO) {
    return blockedSourceFrameInspection("unsupported-scenario");
  }
  if (!Object.is(seed, 0)) return blockedSourceFrameInspection("unsupported-seed");
  if (!isSourceFrame(frame)) return blockedSourceFrameInspection("invalid-frame");

  const sourceRecord = actionRecordForSourceFrame(frame);
  return deepFreeze({
    status: "prospective-source-static" as const,
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: language,
    seed: 0 as const,
    rootFrame: null,
    sourceDomainDeclared: false,
    rootPlacement: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.rootPlacement,
    frameLabel: labelForSourceFrame(frame),
    structuralMarkers: structuralMarkersForSourceFrame(frame),
    avm1Action: {
      presentAtRequestedFrame: sourceRecord !== null,
      sourceRecord,
      recordOnly: true,
      semanticsExecuted: false,
    },
    tagCensus: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910.tagCensus,
    blockers: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.predecessorProposal.proposalCore.blockers,
    prospectiveProof: COURSE_G04_L11_FQ_003_PREDECESSOR_PROSPECTIVE_PROOF,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_FQ_003_PREDECESSOR_EVIDENCE_CAVEATS,
  }) as CourseG04L11Fq003PredecessorSourceFrameInspection;
};
