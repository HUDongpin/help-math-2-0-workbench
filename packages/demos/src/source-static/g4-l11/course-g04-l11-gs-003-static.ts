export const COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID =
  "course-g04-l11-gs-003" as const;

export interface SourceArtifactBinding {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly uncompressedBytes?: number;
  readonly uncompressedSha256?: string;
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const SOURCE_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS03.swf";

export const COURSE_G04_L11_GS_003_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_PATH,
    bytes: 891569,
    sha256: "3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  },
  lessonXml: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml",
    bytes: 10085,
    sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
  },
  migrationManifest: {
    path: "migrations/course-g04-l11-gs-003/migration.json",
    bytes: 6812,
    sha256: "62aaf0deec64ecbe64d13fe5e7b1deb6ba84dfc10a4f3d108fe5500536de5e86",
  },
  machineReport: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/report.json",
    bytes: 41106,
    sha256: "c6abc7b5e0e0fc1b44658fca12b710028446d79da2c2926960892d8b4740a0aa",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 22944,
    sha256: "e4cd58496f3c0c2f1f635a44fc03958f7d2d174a498e8d4543c243ac4eeb6663",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/swfmill-summary.json",
    bytes: 6908,
    sha256: "8eb65b4072876212acd54a202c16864bf92dd5afdc96074c67248f198ec9a5e5",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/swfmill.xml.gz",
    bytes: 965557,
    sha256: "8457b427566f14ee8a04a461a239e975657ff5925ee9df564ed1e5a101d52ef9",
    uncompressedBytes: 4072570,
    uncompressedSha256:
      "f12df39f365dff1901fd0ee48b01fb92ec26bd7d659883721e45341c10c3efde",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-gs-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 5017,
    sha256: "12b34e388ea90bb462b0b8154587412b5920c3e73800f86296a92c6e0253c403",
    uncompressedBytes: 135945,
    uncompressedSha256:
      "5410c305b79605b78b900a6de72163e128dd877d73f75ad1209c647990415786",
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
  runtimeDependencyScope: {
    path: "migrations/course-g04-l11-gs-003/audit/runtime-dependency-scope.json",
    bytes: 2714,
    sha256: "71fa16276b7c64dc94c514044042cf697fc7b400a8ddffadce579ed66218e316",
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
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-gs-003/evidence/full-frame-coverage.json",
    bytes: 28474,
    sha256: "3f21ceedfd4a77bc19ed89959f7fcac406f9e86726910e854faff904276fffa8",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-gs-003/audit/strict-readiness.json",
    bytes: 16645,
    sha256: "db6dce20570e114456800ddde2875249e630d336b3b9a9ff85c7e0f8650a7b77",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    bytes: 145216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  wholeLessonRuntimeScope: {
    path: "reports/lesson-release-runtime-dependency-scopes/lesson-g04-l11-coordinate-grid.json",
    bytes: 326290,
    sha256: "a25b087652d01fd36f80f47eddb56f0e914efc74cd3027e3e99d62b191ba25a0",
  },
  sourceDomainPlanner: {
    path: "scripts/materialize-g4-l11-gs003-sprite231-source-proven-domain.mjs",
    bytes: 65541,
    sha256: "722d0170c53010309575169e4e2ed8914fdaa28fe60cc389ed499a9d4dd456ee",
  },
  sourceDomainPlannerTest: {
    path: "scripts/materialize-g4-l11-gs003-sprite231-source-proven-domain.test.mjs",
    bytes: 18469,
    sha256: "b19cdf451b0e669e52b1a3ebf5ebc079c6922c51e84d78e9c8dc56b4382bf045",
  },
} as const);

const SPRITE_231_FRAMES = deepFreeze([
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 1,
    label: null,
    directActionRecordId: "sprite-231-frame-1-do-action",
    status: "structural-only",
  },
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 2,
    label: null,
    directActionRecordId: null,
    status: "structural-only",
  },
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 3,
    label: "Level1",
    directActionRecordId: "sprite-231-frame-3-do-action",
    status: "structural-only",
  },
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 4,
    label: null,
    directActionRecordId: "sprite-231-frame-4-do-action",
    status: "structural-only",
  },
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 5,
    label: "Level2",
    directActionRecordId: "sprite-231-frame-5-do-action",
    status: "structural-only",
  },
  {
    kind: "static-sprite-231-frame-record",
    localFrame: 6,
    label: null,
    directActionRecordId: "sprite-231-frame-6-do-action",
    status: "structural-only",
  },
] as const);

export const COURSE_G04_L11_GS_003_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID,
  assetId: "swf-3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  source: {
    swf: COURSE_G04_L11_GS_003_STATIC_ARTIFACTS.sourceSwf,
    lessonXml: COURSE_G04_L11_GS_003_STATIC_ARTIFACTS.lessonXml,
    pairedFla: {
      expectedPath:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/GS/L11GS03.fla",
      status: "missing",
    },
  },
  confidence: "low-swf-only-static",
  authoringStructureStatus: "missing-source",
  semanticNamesVerified: false,
  intentVerified: false,
  runtimeHeader: {
    signature: "CWS",
    version: 6,
    asVersion: "AS1/2",
    physicalSourceBytes: 891569,
    declaredUncompressedBytes: 1018419,
    stage: {width: 800, height: 600, background: "#b8d8f7"},
    fps: 12,
    rootFrameCount: 10,
  },
  lessonMembership: {
    xmlOccurrence: 33,
    releaseId: "lesson-g04-l11-coordinate-grid",
    releaseOrdinal: 33,
    atomicMemberCount: 44,
    historicalAtomicMemberCountIncludingLegacyShell: 44,
    currentProductAnimationMemberCount: 43,
    legacyCourseShellExcludedByOwnerDirection: true,
  },
} as const);

export const COURSE_G04_L11_GS_003_LEVEL_1_PAIRS = deepFreeze([
  {pairId: "Mc1", pointLabel: "A", coordinate: "(1,7)",
    diagramInstance: "Mc1_1", answerInstance: "Mc1_2",
    diagramObjectId: 72, answerObjectId: 93},
  {pairId: "Mc2", pointLabel: "B", coordinate: "(3,4)",
    diagramInstance: "Mc2_1", answerInstance: "Mc2_2",
    diagramObjectId: 84, answerObjectId: 76},
  {pairId: "Mc3", pointLabel: "C", coordinate: "(5,8)",
    diagramInstance: "Mc3_1", answerInstance: "Mc3_2",
    diagramObjectId: 96, answerObjectId: 98},
  {pairId: "Mc4", pointLabel: "D", coordinate: "(8,6)",
    diagramInstance: "Mc4_1", answerInstance: "Mc4_2",
    diagramObjectId: 101, answerObjectId: 88},
  {pairId: "Mc5", pointLabel: "E", coordinate: "(4,3)",
    diagramInstance: "Mc5_1", answerInstance: "Mc5_2",
    diagramObjectId: 79, answerObjectId: 86},
  {pairId: "Mc6", pointLabel: "F", coordinate: "(6,1)",
    diagramInstance: "Mc6_1", answerInstance: "Mc6_2",
    diagramObjectId: 91, answerObjectId: 81},
] as const);

export const COURSE_G04_L11_GS_003_LEVEL_2_PAIRS = deepFreeze([
  {pairId: "Mc1", distanceUnits: 2, diagramInstance: "Mc1_1",
    answerInstance: "Mc1_2", diagramObjectId: 203, answerObjectId: 205},
  {pairId: "Mc2", distanceUnits: 3, diagramInstance: "Mc2_1",
    answerInstance: "Mc2_2", diagramObjectId: 223, answerObjectId: 209},
  {pairId: "Mc3", distanceUnits: 4, diagramInstance: "Mc3_1",
    answerInstance: "Mc3_2", diagramObjectId: 217, answerObjectId: 213},
  {pairId: "Mc4", distanceUnits: 5, diagramInstance: "Mc4_1",
    answerInstance: "Mc4_2", diagramObjectId: 211, answerObjectId: 215},
  {pairId: "Mc5", distanceUnits: 7, diagramInstance: "Mc5_1",
    answerInstance: "Mc5_2", diagramObjectId: 207, answerObjectId: 225},
  {pairId: "Mc6", distanceUnits: 6, diagramInstance: "Mc6_1",
    answerInstance: "Mc6_2", diagramObjectId: 221, answerObjectId: 219},
] as const);

export const COURSE_G04_L11_GS_003_MATCHING_EVIDENCE = deepFreeze({
  sourceTimelineId: "sprite-231",
  level1LocalFrame: 3,
  level2LocalFrame: 5,
  pairIdentityRule: "exact-source-instance-name-stem-Mc1-through-Mc6",
  pairIdentityEstablished: true,
  level1PairCount: COURSE_G04_L11_GS_003_LEVEL_1_PAIRS.length,
  level2PairCount: COURSE_G04_L11_GS_003_LEVEL_2_PAIRS.length,
  sourceClickScoreRule: {correctDelta: 10, incorrectDelta: -2},
  sourceAllowsNegativeScore: true,
  sourcePairClickOrderSymmetryEstablished: false,
  sourceRepeatedSameCardBehaviorEstablished: false,
  sourceFeedbackTimingEstablished: false,
  sourceAudioCueMappingEstablished: false,
});

export const COURSE_G04_L11_GS_003_STATIC_SPRITE_231 = deepFreeze({
  timelineId: "sprite-231",
  sourceObjectId: 231,
  localFrameCount: 6,
  currentDisposition: "unresolved",
  structuralReachability: "reachable-from-root-placement-graph",
  rootPlacement: {
    rootFrame: 6,
    depth: 3,
    instanceName: "animation_mc",
    tag: "PlaceObject2",
    replace: false,
    hasClipActions: false,
    matrixTwips: {a: 1, b: 0, c: 0, d: 1, tx: 8248, ty: 5666},
  },
  labels: [
    {localFrame: 3, value: "Level1"},
    {localFrame: 5, value: "Level2"},
  ],
  tagCensus: {
    DoAction: 5,
    End: 1,
    FrameLabel: 2,
    PlaceObject2: 71,
    RemoveObject2: 59,
    ShowFrame: 6,
  },
  localFrames: SPRITE_231_FRAMES,
} as const);

export const COURSE_G04_L11_GS_003_STATIC_ACTION_RECORDS = deepFreeze([
  {
    kind: "blocked-record-only",
    id: "sprite-231-frame-1-do-action",
    localFrame: 1,
    sourcePath: "DefineSprite_231/frame_1/DoAction.as",
    bodyBytes: 325,
    bodySha256: "7cf808b10dd9d49a142dc8f74e31c41876882b31245b262c969736fa3878c908",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    kind: "blocked-record-only",
    id: "sprite-231-frame-3-do-action",
    localFrame: 3,
    sourcePath: "DefineSprite_231/frame_3/DoAction.as",
    bodyBytes: 745,
    bodySha256: "d20826f06e178dfd68b429cc6586053efa7edbe6e83f4fe60a899fbd4aeb6321",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    kind: "blocked-record-only",
    id: "sprite-231-frame-4-do-action",
    localFrame: 4,
    sourcePath: "DefineSprite_231/frame_4/DoAction.as",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    kind: "blocked-record-only",
    id: "sprite-231-frame-5-do-action",
    localFrame: 5,
    sourcePath: "DefineSprite_231/frame_5/DoAction.as",
    bodyBytes: 745,
    bodySha256: "c0eb64bd5f6126f0753d690dbeab224fd6b4c19ce0c0f675d3035b64f687f631",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    kind: "blocked-record-only",
    id: "sprite-231-frame-6-do-action",
    localFrame: 6,
    sourcePath: "DefineSprite_231/frame_6/DoAction.as",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    semanticsExecuted: false,
    executableCallables: [],
  },
] as const);

export const COURSE_G04_L11_GS_003_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  kind: "embedded-stream-static-obligation-set",
  manifestRequired: false,
  manifestRequiredDoesNotEstablishSilence: true,
  streams: [
    {
      id: "embedded-stream-0001",
      sourceCharacterId: 15,
      contextDeclaredFrameCount: 5,
      blockCount: 5,
      durationMs: 392,
    },
    {
      id: "embedded-stream-0002",
      sourceCharacterId: 119,
      contextDeclaredFrameCount: 28,
      blockCount: 27,
      durationMs: 2220,
    },
    {
      id: "embedded-stream-0003",
      sourceCharacterId: 131,
      contextDeclaredFrameCount: 27,
      blockCount: 26,
      durationMs: 2142,
    },
    {
      id: "embedded-stream-0004",
      sourceCharacterId: 226,
      contextDeclaredFrameCount: 27,
      blockCount: 26,
      durationMs: 2142,
    },
  ],
  language: "und",
  startSemantics: "interaction-state",
  rootStartFrameProven: false,
  cueMappingResolved: false,
  languageContentVerified: false,
  timingResolved: false,
  listeningAccepted: false,
  synchronizationVerified: false,
  replayAudioVerified: false,
  audioAccepted: false,
  silenceEstablished: false,
} as const);

export const COURSE_G04_L11_GS_003_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  current: {
    declaredRootDomainCount: 1,
    reachableUnresolvedTimelineCount: 60,
    staticReachabilityUnprovenExcludedCount: 6,
    canonicalSprite231DomainDeclared: false,
    sourceProvenEvidencePath:
      "migrations/course-g04-l11-gs-003/audit/source-proven-independent-frame-domain-evidence.json",
    beforeSourceProvenEvidencePresent: false,
    afterSourceProvenEvidencePresent: false,
    predecessorArtifactHashes: {
      migration: COURSE_G04_L11_GS_003_STATIC_ARTIFACTS.migrationManifest.sha256,
      scenario: COURSE_G04_L11_GS_003_STATIC_ARTIFACTS.scenarioInventory.sha256,
      disposition:
        COURSE_G04_L11_GS_003_STATIC_ARTIFACTS.frameDomainDisposition.sha256,
    },
  },
  prospective: {
    status: "prospective-not-materialized",
    canonicalSuccessorPresent: false,
    canonicalSprite231DomainDeclared: false,
    liveApplyAuthorized: false,
    acceptanceEffect: "none",
    selectedDomainCount: 1,
    remainingIndependentRequiredCount: 32,
    unresolvedCount: 27,
    staticReachabilityUnprovenExcludedCount: 6,
    outputFilesPresent: false,
    exactPairSets: {
      accepted: {
        count: 33,
        sha256: "8edc2f44156203fc94529a604e597b0f67e95b109dead6f07608d446fb8a8fbf",
      },
      selected: {
        count: 1,
        sha256: "6c61c753efd236aace3ee8439e6634d325d5c0875b5674d0d95254ac030a98b7",
      },
      remainingIndependentRequired: {
        count: 32,
        sha256: "8a6868c715f0d87c62509fc1d83adf99673a994bdaae4b09be79c6927524a732",
      },
      unresolved: {
        count: 27,
        sha256: "c685e2e70c9086af2657cb4db4211f72902bad691c80601c2445706d210e08f5",
      },
      excluded: {
        count: 6,
        sha256: "1ead753605c833b551c4a5fd4041bbcac43b8cfe77271670b509da216b73705a",
      },
    },
  },
  unresolved: {
    randomBehavior: false,
    determinism: false,
    naturalTrace: false,
    branchOrder: false,
    replay: false,
    fullReset: false,
    terminal: false,
    originalRuntimeBaseline: false,
    strictCompletion: false,
    publication: false,
    status: "BLOCKED_UNVERIFIED",
    keyTerms: "not-applied-to-this-non-shell-workspace",
  },
  scenarioCounts: {
    handlers: 43,
    nonEventScripts: 60,
    behaviorGroups: 12,
    buttonTargets: 7,
    conditionalBranches: 45,
    dependencyFixtures: 27,
    glossaryAndHyperlinks: 2,
    courseNavigation: 1,
    randomObligations: 0,
    replayCandidates: 34,
    terminalCandidates: 71,
    replayAndTerminalObligations: 2,
  },
} as const);

const blocked = (
  blocker: "invalid-animation-id" | "invalid-local-frame",
  requestedAnimationId: string,
  requestedLocalFrame: number | null,
) => deepFreeze({
  kind: "blocked-static-source-query",
  status: "BLOCKED_UNVERIFIED",
  blocker,
  requestedAnimationId,
  requestedLocalFrame,
});

export const getStaticSourceFacts = (animationId: string) => (
  animationId === COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_GS_003_STATIC_SOURCE_FACTS
    : blocked("invalid-animation-id", animationId, null)
);

export const getStaticSprite231Record = (animationId: string) => (
  animationId === COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_GS_003_STATIC_SPRITE_231
    : blocked("invalid-animation-id", animationId, null)
);

export const getStaticSprite231FrameRecord = (
  animationId: string,
  localFrame: number,
) => {
  if (animationId !== COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, localFrame);
  }
  const record = SPRITE_231_FRAMES.find(
    (candidate) => candidate.localFrame === localFrame,
  );
  return record ?? blocked("invalid-local-frame", animationId, localFrame);
};

export const getStaticActionRecords = (animationId: string) => (
  animationId === COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_GS_003_STATIC_ACTION_RECORDS
    : blocked("invalid-animation-id", animationId, null)
);

export const getStaticAudioObligations = (animationId: string) => (
  animationId === COURSE_G04_L11_GS_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_GS_003_STATIC_AUDIO_OBLIGATIONS
    : blocked("invalid-animation-id", animationId, null)
);
