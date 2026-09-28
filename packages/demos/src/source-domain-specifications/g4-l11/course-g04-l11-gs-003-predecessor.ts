/**
 * This is a predecessor-bound, source-static inspection query. It records
 * structural GS003 facts for the one source-proven sprite-231 local domain.
 * It does not declare that domain, execute AVM1, or provide a playback API.
 */

export const COURSE_G04_L11_GS_003_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-gs-003" as const;
export const COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN =
  "sprite-231" as const;
export const COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_SCENARIO =
  "prospective-source-domain-entry-unresolved" as const;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES = deepFreeze([
  "en",
  "es",
] as const);

export type CourseG04L11Gs003PredecessorSourceFrameLanguage =
  (typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES)[number];

const COURSE_G04_L11_GS_003_PREDECESSOR_ROOT_PLACEMENT = deepFreeze({
  parentTimelineId: "root" as const,
  childTimelineId: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
  sourceObjectId: "231" as const,
  frame: 6,
  depth: "3" as const,
  instanceName: "animation_mc" as const,
  tag: "PlaceObject2" as const,
  replace: "0" as const,
  hasClipActions: false,
  matrixTwips: {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 8248,
    ty: 5666,
  },
});

const COURSE_G04_L11_GS_003_PREDECESSOR_FRAME_LABELS = deepFreeze([
  {frame: 3, label: "Level1" as const},
  {frame: 5, label: "Level2" as const},
] as const);

const COURSE_G04_L11_GS_003_PREDECESSOR_ACTION_RECORDS = deepFreeze([
  {
    frame: 1,
    script: "DefineSprite_231/frame_1/DoAction.as" as const,
    bodyBytes: 325,
    bodySha256:
      "7cf808b10dd9d49a142dc8f74e31c41876882b31245b262c969736fa3878c908",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  },
  {
    frame: 3,
    script: "DefineSprite_231/frame_3/DoAction.as" as const,
    bodyBytes: 745,
    bodySha256:
      "d20826f06e178dfd68b429cc6586053efa7edbe6e83f4fe60a899fbd4aeb6321",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  },
  {
    frame: 4,
    script: "DefineSprite_231/frame_4/DoAction.as" as const,
    bodyBytes: 7,
    bodySha256:
      "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  },
  {
    frame: 5,
    script: "DefineSprite_231/frame_5/DoAction.as" as const,
    bodyBytes: 745,
    bodySha256:
      "c0eb64bd5f6126f0753d690dbeab224fd6b4c19ce0c0f675d3035b64f687f631",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  },
  {
    frame: 6,
    script: "DefineSprite_231/frame_6/DoAction.as" as const,
    bodyBytes: 7,
    bodySha256:
      "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  },
] as const);

const COURSE_G04_L11_GS_003_PREDECESSOR_TAG_CENSUS = deepFreeze({
  DoAction: 5,
  End: 1,
  FrameLabel: 2,
  PlaceObject2: 71,
  RemoveObject2: 59,
  ShowFrame: 6,
});

const COURSE_G04_L11_GS_003_PREDECESSOR_PARTITIONS = deepFreeze({
  accepted: {
    prospective: true,
    materialized: false,
    successorPresent: false,
    strictAcceptanceEffect: "none" as const,
    count: 33,
    sha256: "8edc2f44156203fc94529a604e597b0f67e95b109dead6f07608d446fb8a8fbf",
    timelineIds: [
      "sprite-72", "sprite-76", "sprite-79", "sprite-81", "sprite-84",
      "sprite-86", "sprite-88", "sprite-91", "sprite-93", "sprite-96",
      "sprite-98", "sprite-101", "sprite-119", "sprite-131", "sprite-150",
      "sprite-159", "sprite-172", "sprite-175", "sprite-203", "sprite-205",
      "sprite-207", "sprite-209", "sprite-211", "sprite-213", "sprite-215",
      "sprite-217", "sprite-219", "sprite-221", "sprite-223", "sprite-225",
      "sprite-226", "sprite-230", "sprite-231",
    ],
  },
  selected: {
    prospective: true,
    materialized: false,
    successorPresent: false,
    strictAcceptanceEffect: "none" as const,
    count: 1,
    sha256: "6c61c753efd236aace3ee8439e6634d325d5c0875b5674d0d95254ac030a98b7",
    timelineIds: ["sprite-231"],
  },
  remainingIndependentRequired: {
    prospective: true,
    materialized: false,
    successorPresent: false,
    strictAcceptanceEffect: "none" as const,
    count: 32,
    sha256: "8a6868c715f0d87c62509fc1d83adf99673a994bdaae4b09be79c6927524a732",
    timelineIds: [
      "sprite-72", "sprite-76", "sprite-79", "sprite-81", "sprite-84",
      "sprite-86", "sprite-88", "sprite-91", "sprite-93", "sprite-96",
      "sprite-98", "sprite-101", "sprite-119", "sprite-131", "sprite-150",
      "sprite-159", "sprite-172", "sprite-175", "sprite-203", "sprite-205",
      "sprite-207", "sprite-209", "sprite-211", "sprite-213", "sprite-215",
      "sprite-217", "sprite-219", "sprite-221", "sprite-223", "sprite-225",
      "sprite-226", "sprite-230",
    ],
  },
  rejected: {
    prospective: true,
    materialized: false,
    successorPresent: false,
    strictAcceptanceEffect: "none" as const,
    count: 27,
    sha256: "c685e2e70c9086af2657cb4db4211f72902bad691c80601c2445706d210e08f5",
    timelineIds: [
      "sprite-24", "sprite-27", "sprite-34", "sprite-36", "sprite-38",
      "sprite-40", "sprite-42", "sprite-44", "sprite-46", "sprite-48",
      "sprite-50", "sprite-52", "sprite-54", "sprite-56", "sprite-170",
      "sprite-179", "sprite-181", "sprite-183", "sprite-185", "sprite-187",
      "sprite-189", "sprite-191", "sprite-193", "sprite-195", "sprite-197",
      "sprite-199", "sprite-201",
    ],
  },
  staticReachabilityUnprovenExcluded: {
    prospective: true,
    materialized: false,
    successorPresent: false,
    strictAcceptanceEffect: "none" as const,
    count: 6,
    sha256: "1ead753605c833b551c4a5fd4041bbcac43b8cfe77271670b509da216b73705a",
    timelineIds: [
      "sprite-1", "sprite-2", "sprite-3", "sprite-4", "sprite-5", "sprite-15",
    ],
  },
});

const COURSE_G04_L11_GS_003_PREDECESSOR_EMBEDDED_STREAMS = deepFreeze([
  {
    streamIndex: 1,
    sourceCharacterId: 15,
    contextDeclaredFrameCount: 5,
    firstBlockFrame: 1,
    lastBlockFrame: 5,
    totalDecodedSamples: 8640,
    blockCount: 5,
    durationMs: 392,
    syncMode: "stream" as const,
    format: "mp3" as const,
    sampleRateHz: 22050,
    sampleSizeBits: 16,
    channels: 1,
  },
  {
    streamIndex: 2,
    sourceCharacterId: 119,
    contextDeclaredFrameCount: 28,
    firstBlockFrame: 2,
    lastBlockFrame: 28,
    totalDecodedSamples: 48960,
    blockCount: 27,
    durationMs: 2220,
    syncMode: "stream" as const,
    format: "mp3" as const,
    sampleRateHz: 22050,
    sampleSizeBits: 16,
    channels: 1,
  },
  {
    streamIndex: 3,
    sourceCharacterId: 131,
    contextDeclaredFrameCount: 27,
    firstBlockFrame: 2,
    lastBlockFrame: 27,
    totalDecodedSamples: 47232,
    blockCount: 26,
    durationMs: 2142,
    syncMode: "stream" as const,
    format: "mp3" as const,
    sampleRateHz: 22050,
    sampleSizeBits: 16,
    channels: 1,
  },
  {
    streamIndex: 4,
    sourceCharacterId: 226,
    contextDeclaredFrameCount: 27,
    firstBlockFrame: 2,
    lastBlockFrame: 27,
    totalDecodedSamples: 47232,
    blockCount: 26,
    durationMs: 2142,
    syncMode: "stream" as const,
    format: "mp3" as const,
    sampleRateHz: 22050,
    sampleSizeBits: 16,
    channels: 1,
  },
] as const);

/**
 * Every binding below is predecessor input only. No generated source-domain
 * proof, trace, capture, or declaration is bound here because none exists.
 */
const COURSE_G04_L11_GS_003_PREDECESSOR_INPUTS = deepFreeze({
  migrationManifest: {
    path: "migrations/course-g04-l11-gs-003/migration.json",
    bytes: 6812,
    sha256: "62aaf0deec64ecbe64d13fe5e7b1deb6ba84dfc10a4f3d108fe5500536de5e86",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-gs-003/audit/scenario-inventory.json",
    bytes: 2134197,
    sha256: "a43bbbe52bc23a6a1911c7bffa374649c0485de400b2e35e00340db60b3d61b6",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-gs-003/audit/frame-domain-disposition.json",
    bytes: 162109,
    sha256: "016a3b1cc4998079778460e3d6dfc74e4771da6862dbf04eea14b91f74614453",
  },
  machineReport: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/report.json",
    bytes: 41106,
    sha256: "c6abc7b5e0e0fc1b44658fca12b710028446d79da2c2926960892d8b4740a0aa",
  },
  machineFrameDomainCandidates: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 22944,
    sha256: "e4cd58496f3c0c2f1f635a44fc03958f7d2d174a498e8d4543c243ac4eeb6663",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/swfmill.xml.gz",
    bytes: 965557,
    sha256: "8457b427566f14ee8a04a461a239e975657ff5925ee9df564ed1e5a101d52ef9",
    uncompressedBytes: 4072570,
    uncompressedSha256: "f12df39f365dff1901fd0ee48b01fb92ec26bd7d659883721e45341c10c3efde",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 5017,
    sha256: "12b34e388ea90bb462b0b8154587412b5920c3e73800f86296a92c6e0253c403",
    uncompressedBytes: 135945,
    uncompressedSha256: "5410c305b79605b78b900a6de72163e128dd877d73f75ad1209c647990415786",
  },
  audioRuntimeEvidence: {
    path: "migrations/course-g04-l11-gs-003/audit/audio-runtime-evidence.json",
    bytes: 12964,
    sha256: "afe97008032b4891af5fd443981c2f40a789ce33e33a08ef61dd079db19dd38d",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-gs-003/audio-inventory.csv",
    bytes: 2318,
    sha256: "571077f23c5c9d96dc8e42849858b4e84210c7c5584564a754fcabff4d867ccd",
  },
  prospectivePlanner: {
    path: "scripts/materialize-g4-l11-gs003-sprite231-source-proven-domain.mjs",
    bytes: 65541,
    sha256: "722d0170c53010309575169e4e2ed8914fdaa28fe60cc389ed499a9d4dd456ee",
  },
});

export const COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE = deepFreeze({
  animationId: COURSE_G04_L11_GS_003_PREDECESSOR_ANIMATION_ID,
  assetId: "swf-3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  confidence: "low-swf-only-static" as const,
  intentVerified: false,
  semanticNamesVerified: false,
  authoringSource: {
    expectedFlaPath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS03.fla",
    pairedFlaStatus: "missing" as const,
    authoringStructureStatus: "missing-source" as const,
  },
  swf: {
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS03.swf",
    bytes: 891569,
    sha256: "3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  },
  runtimeHeader: {
    signature: "CWS" as const,
    version: 6,
    actionScriptVersion: "AS1/2" as const,
    background: "#b8d8f7" as const,
    declaredUncompressedBytes: 1018419,
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
    root: {
      id: "root" as const,
      frameCount: 10,
      labels: [{frame: 6, label: "begin" as const}],
    },
  },
  sprite231: {
    id: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "231" as const,
    frameCount: 6,
    frameIndexing: "one-indexed" as const,
    rootPlacement: COURSE_G04_L11_GS_003_PREDECESSOR_ROOT_PLACEMENT,
    labels: COURSE_G04_L11_GS_003_PREDECESSOR_FRAME_LABELS,
    tagCensus: COURSE_G04_L11_GS_003_PREDECESSOR_TAG_CENSUS,
    actionFrames: [1, 3, 4, 5, 6],
    actionFrameSequenceSha256:
      "1c1ec43ea6978f5819112a77b0f0df44f04afdd3743016870c416f630564cce2",
    actionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1" as const,
    actionRecords: COURSE_G04_L11_GS_003_PREDECESSOR_ACTION_RECORDS,
    structuralReachability: "reachable-from-root-placement-graph" as const,
  },
  currentFrameDomainState: {
    persistedDeclaredTimelineIds: ["root"],
    reachableUnresolvedTimelineCount: 60,
    staticReachabilityUnprovenExcludedCount: 6,
    sourceDomainDeclared: false,
  },
  prospectivePartition: {
    status: "prospective-not-materialized" as const,
    canonicalSuccessorPresent: false,
    liveApplyAuthorized: false,
    strictAcceptanceEffect: "none" as const,
    partitions: COURSE_G04_L11_GS_003_PREDECESSOR_PARTITIONS,
  },
  embeddedAudio: {
    streams: COURSE_G04_L11_GS_003_PREDECESSOR_EMBEDDED_STREAMS,
    language: "und" as const,
    cueMappingResolved: false,
    timingResolved: false,
    listeningAccepted: false,
    replayAudioVerified: false,
    audioAccepted: false,
  },
  gameComplexity: {
    handlerCount: 43,
    nonEventScriptCount: 60,
    conditionalBranchCount: 45,
    replayCandidateCount: 34,
    terminalCandidateCount: 71,
    randomObligationCount: 0,
    randomObligationAbsenceEstablished: false,
  },
  predecessorInputs: COURSE_G04_L11_GS_003_PREDECESSOR_INPUTS,
  sourceDomainDeclared: false,
  captureIdentity: null,
});

/**
 * A successful inspection remains structural source evidence only. These
 * booleans are deliberately all false for game, random, Replay, audio, and
 * runtime/acceptance authority; structural inspection cannot upgrade them.
 */
export const COURSE_G04_L11_GS_003_PREDECESSOR_EVIDENCE_CAVEATS = deepFreeze({
  structuralSourceEvidenceOnly: true,
  sourceDomainDeclared: false,
  authority: {
    authoritativeOriginalRuntimeEstablished: false,
    runtimeEntryEstablished: false,
    sourceActionSemanticsExecuted: false,
    naturalTraceEstablished: false,
    gameStateModeled: false,
    gameLevelSelectionResolved: false,
    scoreSemanticsResolved: false,
    answerAttemptSemanticsResolved: false,
    branchOrderResolved: false,
    randomBehaviorResolved: false,
    randomAbsenceEstablished: false,
    seedContractEstablished: false,
    replaySemanticsResolved: false,
    fullResetEstablished: false,
    terminalStateResolved: false,
    interactionImplemented: false,
    replayParityEstablished: false,
    gameStateEstablished: false,
    randomBehaviorEstablished: false,
    randomSeedEstablished: false,
    deterministicReplayEstablished: false,
    scoreBehaviorEstablished: false,
    retryBehaviorEstablished: false,
    terminalBehaviorEstablished: false,
    replayBehaviorEstablished: false,
    replayFullResetEstablished: false,
    audioModeled: false,
    audioReachabilityEstablished: false,
    audioAccepted: false,
    visualFidelityEstablished: false,
    behaviorParityEstablished: false,
    candidateQaCompleted: false,
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  },
  strictAcceptanceEffect: "none" as const,
});

export type CourseG04L11Gs003PredecessorSourceFrameStructuralMarker =
  | "first-local-frame"
  | "source-frame-label"
  | "record-only-avm1-doaction-frame"
  | "last-local-frame";

export type CourseG04L11Gs003PredecessorSourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Gs003PredecessorSourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11Gs003PredecessorSourceFrameInspection {
  readonly status: "prospective-source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11Gs003PredecessorSourceFrameLanguage;
  readonly seed: 0;
  /** A structural placement cannot establish a root playhead position. */
  readonly rootFrame: null;
  readonly sourceDomainDeclared: false;
  readonly rootPlacement: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.rootPlacement;
  readonly frameLabel:
    | (typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.labels)[number]
    | null;
  readonly structuralMarkers: readonly CourseG04L11Gs003PredecessorSourceFrameStructuralMarker[];
  readonly avm1Action: Readonly<{
    readonly presentAtRequestedFrame: boolean;
    readonly sourceRecord:
      | (typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.actionRecords)[number]
      | null;
    readonly recordOnly: true;
    readonly semanticsExecuted: false;
  }>;
  readonly tagCensus: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.tagCensus;
  readonly prospectivePartition: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.prospectivePartition;
  readonly embeddedAudio: typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.embeddedAudio;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_GS_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export interface CourseG04L11Gs003PredecessorBlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11Gs003PredecessorSourceFrameInspectionBlocker;
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
  readonly evidenceCaveats: typeof COURSE_G04_L11_GS_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export type CourseG04L11Gs003PredecessorSourceFrameInspectionResult =
  | CourseG04L11Gs003PredecessorSourceFrameInspection
  | CourseG04L11Gs003PredecessorBlockedSourceFrameInspection;

const isSourceFrameLanguage = (
  value: unknown,
): value is CourseG04L11Gs003PredecessorSourceFrameLanguage =>
  COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES.includes(
    value as CourseG04L11Gs003PredecessorSourceFrameLanguage,
  );

const isSourceFrame = (frame: unknown): frame is number =>
  typeof frame === "number"
  && Number.isSafeInteger(frame)
  && frame >= 1
  && frame <= COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.frameCount;

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
): readonly CourseG04L11Gs003PredecessorSourceFrameStructuralMarker[] => {
  const markers: CourseG04L11Gs003PredecessorSourceFrameStructuralMarker[] = [];
  if (frame === 1) markers.push("first-local-frame");
  if (COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.labels.some(
    (label) => label.frame === frame,
  )) markers.push("source-frame-label");
  if (COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.actionRecords.some(
    (record) => record.frame === frame,
  )) markers.push("record-only-avm1-doaction-frame");
  if (frame === COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.frameCount) {
    markers.push("last-local-frame");
  }
  return deepFreeze(markers);
};

const actionRecordForSourceFrame = (
  frame: number,
): (typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.actionRecords)[number] | null =>
  COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.actionRecords.find(
    (record) => record.frame === frame,
  ) ?? null;

const labelForSourceFrame = (
  frame: number,
): (typeof COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.labels)[number] | null =>
  COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.labels.find(
    (label) => label.frame === frame,
  ) ?? null;

const blockedSourceFrameInspection = (
  blocker: CourseG04L11Gs003PredecessorSourceFrameInspectionBlocker,
): CourseG04L11Gs003PredecessorBlockedSourceFrameInspection => deepFreeze({
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
  evidenceCaveats: COURSE_G04_L11_GS_003_PREDECESSOR_EVIDENCE_CAVEATS,
}) as CourseG04L11Gs003PredecessorBlockedSourceFrameInspection;

/**
 * Inspect one exact one-indexed sprite-231 source frame. The public boundary
 * accepts unknown values, rejects malformed objects and unsupported fields
 * without coercion, and returns no root-frame, capture, or runtime state.
 */
export const inspectCourseG04L11Gs003PredecessorSourceFrame = (
  frame: unknown,
  request: unknown,
): CourseG04L11Gs003PredecessorSourceFrameInspectionResult => {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    return blockedSourceFrameInspection("invalid-request");
  }
  const requestValues = exactRequestValues(request);
  if (requestValues === null) {
    return blockedSourceFrameInspection("invalid-request");
  }

  const frameDomain = requestValues.frameDomain;
  const language = requestValues.lang;
  const scenario = requestValues.scenario;
  const seed = requestValues.seed;

  if (frameDomain !== COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN) {
    return blockedSourceFrameInspection("unsupported-frame-domain");
  }
  if (!isSourceFrameLanguage(language)) {
    return blockedSourceFrameInspection("unsupported-language");
  }
  if (scenario !== COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_SCENARIO) {
    return blockedSourceFrameInspection("unsupported-scenario");
  }
  if (!Object.is(seed, 0)) return blockedSourceFrameInspection("unsupported-seed");
  if (!isSourceFrame(frame)) return blockedSourceFrameInspection("invalid-frame");

  const sourceRecord = actionRecordForSourceFrame(frame);
  return deepFreeze({
    status: "prospective-source-static" as const,
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: language,
    seed: 0 as const,
    rootFrame: null,
    sourceDomainDeclared: false,
    rootPlacement: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.rootPlacement,
    frameLabel: labelForSourceFrame(frame),
    structuralMarkers: structuralMarkersForSourceFrame(frame),
    avm1Action: {
      presentAtRequestedFrame: sourceRecord !== null,
      sourceRecord,
      recordOnly: true,
      semanticsExecuted: false,
    },
    tagCensus: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.sprite231.tagCensus,
    prospectivePartition: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.prospectivePartition,
    embeddedAudio: COURSE_G04_L11_GS_003_PREDECESSOR_SOURCE.embeddedAudio,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_GS_003_PREDECESSOR_EVIDENCE_CAVEATS,
  }) as CourseG04L11Gs003PredecessorSourceFrameInspection;
};
