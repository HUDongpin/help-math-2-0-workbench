/**
 * Internal FQ001 source-static specification.
 *
 * This file exposes immutable, hash-bound observations only. It does not
 * execute legacy scripts, advance any playhead, produce pixels, start sound,
 * or change migration, acceptance, release, or publication state.
 */

export const COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID =
  "course-g04-l11-fq-001" as const;

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

const SOURCE_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.fla";

export const COURSE_G04_L11_FQ_001_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_SWF_PATH,
    bytes: 20_950,
    sha256: "9226553896cda584d9c03f784bc6f104ac4a9a80c3f6128bf14268f9719d7ba7",
  },
  sourceFla: {
    path: SOURCE_FLA_PATH,
    bytes: 345_600,
    sha256: "3a0ce0652238505348f2fba067546b0533149a68b681f9df3fffe4f455be0d73",
  },
  lessonXml: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml",
    bytes: 10_085,
    sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    bytes: 145_216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  migrationManifest: {
    path: "migrations/course-g04-l11-fq-001/migration.json",
    bytes: 6_821,
    sha256: "021a44828f35c8820f68b204dd0a8eb88fa34fe12f4ad7a5a4cce477e41a809d",
  },
  machineReport: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/report.json",
    bytes: 14_874,
    sha256: "0aa0260925a3cfda8b08e1cd71916090c65776520ba2657749b7275d78c8c359",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/ffdec-header.txt",
    bytes: 187,
    sha256: "6e2e1465bddb19ed491a4a4bf3eeadddd828419c6af4eb1e41939c695ff74cee",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/ffdec-script-index.txt",
    bytes: 735,
    sha256: "338c76f8528bc168d4945067cbe16b27e0421d741cdf7f2a351308245d6ad243",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/ffdec-scripts.txt.gz",
    bytes: 4_306,
    sha256: "d3321fb800171e64c372c99b722b92efbc24e775fab1056e9f0a1583f36ee2c5",
    uncompressedBytes: 23_927,
    uncompressedSha256:
      "8ce8e9fdbe7c43d2e264e882d5cc46042131f42a2534377a66bbfb24dad563be",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/ffdec-tags.txt.gz",
    bytes: 8_352,
    sha256: "bc1837d4d30b755450bc38be3508bce53daccd64cb8d8cd2dd0e8ff9ab7d17a4",
    uncompressedBytes: 39_927,
    uncompressedSha256:
      "49aa0122b8c8201eb2ccb2a9a722814feb2121f4eeca84e38a308a9341746a06",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/swf-frame-domain-candidates.json",
    bytes: 3_778,
    sha256: "379a2ddf164ad62ba8853cf7b76d2f0c495eab3fbb2dab0142148c43611de7d6",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/swfmill-summary.json",
    bytes: 3_062,
    sha256: "6cb7d70496531a63b42e4a8ff1158c726901fb02460769910603b4c2217e5613",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/swfmill.xml.gz",
    bytes: 34_847,
    sha256: "ecdd052ea679ef65f78f09ae461a8bbcab280ff8593a534c9eb4b3caf0d5a831",
    uncompressedBytes: 581_322,
    uncompressedSha256:
      "1040829d24f8e743e0c6ff485258982b8b95b39bc53543008803d96d4471b3f0",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-fq-001/audit/scenario-inventory.json",
    bytes: 208_648,
    sha256: "e48ad238ea90d54a1446d2cfe1cc7331f84f284f3c27a0b0a91d8479ffb1d77d",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-fq-001/audit/frame-domain-disposition.json",
    bytes: 11_391,
    sha256: "75d0db571c16d17f853bfb9f647622590e4879725d440a9d5f52b4f0941ebc3c",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-fq-001/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "174ccc7c8f14127e19829dc828ec7a0807e44ead0e60573144cbfc28dc854d4e",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-fq-001/audit/audio-runtime-evidence.json",
    bytes: 485_293,
    sha256: "c10f3759980916322a6ba341c8d30903bb72dcc84105c05aead775133a304f82",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-fq-001/audio-inventory.csv",
    bytes: 154,
    sha256: "bbae8148f1753f228e69c4d86dd415a47d3be7c30f5c49246e58328641ae25d8",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-fq-001/evidence/full-frame-coverage.json",
    bytes: 8_138,
    sha256: "317227ed2b624b86ecf8bcafb4f205c69415275ca66eec4ebc8fd58e03ef3cef",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-fq-001/audit/strict-readiness.json",
    bytes: 17_304,
    sha256: "0a49276127806ca6232f5a5e8e41f59026fdcf6f92ef48638bc19eba78c37fd5",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-fq-001/baseline/ffdec-root-frames.json",
    bytes: 3_564,
    sha256: "b1f26ce7269581ad7ea9868ddfef580dfd0c4274c5e44d8e5e761848abd6a98a",
  },
} as const);

const ROOT_CONTROL_RECORDS = deepFreeze([
  {
    frame: 1,
    reasons: [
      "exported-action-script",
      "initial-one-indexed-frame",
      "script-stop-state",
      "structural-action:DoAction",
      "structural-action:DoInitAction",
    ],
  },
  {
    frame: 6,
    reasons: [
      "exported-action-script",
      "frame-label:begin",
      "script-stop-state",
      "structural-action:DoAction",
    ],
  },
  {frame: 10, reasons: ["terminal-structural-frame"]},
] as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {
    rootFrame: 6,
    depth: "1",
    instanceName: "Mc_BackText",
    sourceObjectId: "22",
    tag: "PlaceObject2",
    replace: "0",
    hasClipActions: false,
  },
  {
    rootFrame: 6,
    depth: "10",
    instanceName: "animation",
    sourceObjectId: "68",
    tag: "PlaceObject2",
    replace: "0",
    hasClipActions: false,
  },
] as const);

export const COURSE_G04_L11_FQ_001_STATIC_ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    const control = ROOT_CONTROL_RECORDS.find(
      (candidate) => candidate.frame === frame,
    );
    return {
      kind: "source-static-root-frame-fact",
      frameDomainId: "root",
      frame,
      validDeclaredFrame: true,
      controlReasons: control?.reasons ?? [],
      label: frame === 6 ? "begin" : null,
      namedPlacements: frame === 6 ? ROOT_NAMED_PLACEMENTS : [],
      legacyScriptSemanticsExecuted: false,
      naturalEntryProven: false,
      visualAuthorityEstablished: false,
    };
  }),
);

export const COURSE_G04_L11_FQ_001_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
  kind: "source-static-declared-frame-domain",
  frameDomainId: "root",
  sourceTimelineId: "root",
  firstFrame: 1,
  lastFrame: 10,
  frameCount: 10,
  declaredByManifest: true,
  sourceStaticOnly: true,
  naturalEntryProven: false,
  visualAuthorityEstablished: false,
} as const);

export const COURSE_G04_L11_FQ_001_STATIC_NESTED_TIMELINE_INVENTORY = deepFreeze([
  {
    timelineId: "sprite-1",
    sourceObjectId: "1",
    localFrameCount: 1,
    structuralReachability: "not-proven-by-root-placement-graph",
    rootPlacement: null,
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-2",
    sourceObjectId: "2",
    localFrameCount: 3,
    structuralReachability: "not-proven-by-root-placement-graph",
    rootPlacement: null,
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-3",
    sourceObjectId: "3",
    localFrameCount: 1,
    structuralReachability: "not-proven-by-root-placement-graph",
    rootPlacement: null,
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-4",
    sourceObjectId: "4",
    localFrameCount: 3,
    structuralReachability: "not-proven-by-root-placement-graph",
    rootPlacement: null,
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-5",
    sourceObjectId: "5",
    localFrameCount: 1,
    structuralReachability: "not-proven-by-root-placement-graph",
    rootPlacement: null,
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-22",
    sourceObjectId: "22",
    localFrameCount: 1,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: ROOT_NAMED_PLACEMENTS[0],
    independentFrameDomainCandidate: false,
  },
  {
    timelineId: "sprite-68",
    sourceObjectId: "68",
    localFrameCount: 52,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: ROOT_NAMED_PLACEMENTS[1],
    independentFrameDomainCandidate: true,
  },
].map((candidate) => {
  const dispositionRecorded = candidate.structuralReachability ===
    "reachable-from-root-placement-graph";
  return {
    kind: "source-static-nested-timeline-inventory-row",
    ...candidate,
    inventoryStatus: dispositionRecorded
      ? "enumerated-in-frame-domain-disposition"
      : "excluded-not-proven",
    dispositionRecorded,
    disposition: dispositionRecorded ? "unresolved" : null,
    declaredFrameDomain: false,
    runtimeEntryProven: false,
    runtimeReachabilityProven: false,
    compositeWithRootProven: false,
    independentDomainProven: false,
    nonvisualProven: false,
  };
}));

export const COURSE_G04_L11_FQ_001_STATIC_TIMELINE_INVENTORY_ROWS = deepFreeze([
  {
    kind: "source-static-root-timeline-inventory-row",
    timelineId: "root",
    sourceObjectId: null,
    localFrameCount: 10,
    structuralReachability: "root",
    rootPlacement: null,
    inventoryStatus: "enumerated-in-frame-domain-disposition",
    dispositionRecorded: true,
    disposition: "declared-frame-domain",
    declaredFrameDomain: true,
  },
  ...COURSE_G04_L11_FQ_001_STATIC_NESTED_TIMELINE_INVENTORY,
]);

export const COURSE_G04_L11_FQ_001_STATIC_FRAME_DOMAIN_DISPOSITIONS = deepFreeze([
  {
    kind: "source-static-frame-domain-disposition-row",
    timelineId: "root",
    sourceObjectId: null,
    frameCount: 10,
    disposition: "declared-frame-domain",
    declaredFrameDomain: true,
    dispositionRecorded: true,
  },
  ...COURSE_G04_L11_FQ_001_STATIC_NESTED_TIMELINE_INVENTORY
    .filter((candidate) => candidate.dispositionRecorded)
    .map((candidate) => ({
      kind: "source-static-frame-domain-disposition-row",
      timelineId: candidate.timelineId,
      sourceObjectId: candidate.sourceObjectId,
      frameCount: candidate.localFrameCount,
      disposition: "unresolved",
      declaredFrameDomain: false,
      dispositionRecorded: true,
      rootPlacement: candidate.rootPlacement,
      runtimeEntryProven: false,
      independentDomainProven: false,
    })),
]);

export const COURSE_G04_L11_FQ_001_STATIC_EXCLUDED_NOT_PROVEN_TIMELINE_IDS =
  deepFreeze(
    COURSE_G04_L11_FQ_001_STATIC_NESTED_TIMELINE_INVENTORY
      .filter((candidate) => !candidate.dispositionRecorded)
      .map((candidate) => candidate.timelineId),
  );

export const COURSE_G04_L11_FQ_001_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryRowCount: 8,
  frameDomainDispositionRowCount: 3,
  declaredRootCount: 1,
  reachableNestedCount: 2,
  excludedNotProvenNestedCount: 5,
  unresolvedDispositionCount: 2,
  evidenceBackedCompositeCount: 0,
  independentlyRequiredCount: 0,
  nonvisualCount: 0,
} as const);

export const COURSE_G04_L11_FQ_001_STATIC_ACTION_RECORDS = deepFreeze([
  ["script-01", "nested-do-action", "DefineSprite_1_FUIComponentSymbol/frame_1/DoAction.as", 0,
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["script-02", "nested-do-action", "DefineSprite_2_UpArrow/frame_1/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-03", "nested-do-action", "DefineSprite_2_UpArrow/frame_2/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-04", "nested-do-action", "DefineSprite_2_UpArrow/frame_3/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-05", "nested-do-action", "DefineSprite_3_ScrollThumb/frame_1/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-06", "nested-do-action", "DefineSprite_4_DownArrow/frame_1/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-07", "nested-do-action", "DefineSprite_4_DownArrow/frame_2/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-08", "nested-do-action", "DefineSprite_4_DownArrow/frame_3/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-09", "nested-do-action", "DefineSprite_5_FScrollBarSymbol/frame_1/DoAction.as", 0,
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["script-10", "nested-do-action", "DefineSprite_68/frame_52/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-11", "root-do-action", "frame_1/DoAction.as", 60,
    "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3"],
  ["script-12", "root-do-action", "frame_6/DoAction.as", 7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db"],
  ["script-13", "do-init-action", "FScrollBarSymbol.as", 13_184,
    "cea42171056b8a7fbd274041fdc51c6c3021465fe247911f9ede21695b61bdb2"],
  ["script-14", "do-init-action", "FUIComponentSymbol.as", 9_888,
    "47897188622e3ec0d4584baca8b36c0c15c2735295d2127392dcc3263946cd64"],
].map(([id, sourceKind, sourcePath, bodyBytes, bodySha256]) => ({
  kind: "blocked-source-script-record",
  id,
  sourceKind,
  sourcePath,
  bodyBytes,
  bodySha256,
  policy: "blocked-record-only",
  semanticsExecuted: false,
  behaviorEstablished: false,
  executableCallables: [],
})));

export const COURSE_G04_L11_FQ_001_STATIC_BLOCKED_HOST_DEPENDENCIES =
  deepFreeze([
    {
      kind: "blocked-host-dependency-record",
      id: "root-preloader-jump-check",
      sourceScript: {
        path: "frame_1/DoAction.as",
        bodyBytes: 60,
        bodySha256:
          "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3",
      },
      target: "_level0.InternalPreloader",
      method: "gotoAndPlay",
      argument: "jump_check",
      callable: false,
      runtimeResolutionEstablished: false,
      semanticsExecuted: false,
    },
  ] as const);

export const COURSE_G04_L11_FQ_001_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  kind: "unresolved-static-audio-obligation-set",
  manifestRequiresAudio: true,
  inventoryRowCount: 0,
  inventoryRowSetSha256:
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  lessonGroupCandidateCount: 260,
  lessonGroupCandidateSummary: {
    count: 260,
    languages: {en: 130, es: 130},
    candidateOnly: true,
    cuePromoted: false,
  },
  lessonGroupCandidatesExcludedFromInventory: true,
  catalogExactAssociationCount: 0,
  resolvedCueCount: 0,
  embeddedDefineSoundCount: 0,
  embeddedSoundStreamCount: 0,
  embeddedStartSoundCount: 0,
  promotedSourceCount: 0,
  obligations: [
    {
      id: "resolve-exact-original-host-audio-branch",
      status: "unresolved",
      evidenceKind: "static-obligation-only",
      sourcePath: null,
      language: null,
      startFrame: null,
      durationMs: null,
      runtimeReachabilityVerified: false,
      originalRuntimeListeningAccepted: false,
    },
  ],
  exactHostBranchResolved: false,
  timingResolved: false,
  spokenContentResolved: false,
  synchronizationResolved: false,
  silenceEstablished: false,
  acceptanceEstablished: false,
} as const);

export const COURSE_G04_L11_FQ_001_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  {
    requirementId: "req-default-root-en",
    scenario: "default",
    traceId: "default-root-en",
    language: "en",
    seed: "0",
    frameDomainId: "root",
    frameIndexing: "one-indexed",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "en"},
    entryStateSha256:
      "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    sourceStatus: "blocked",
    sourceCapturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineManifestPath: "",
    baselineManifestSha256: "",
    implementationManifestPath: "",
    implementationManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
  {
    requirementId: "req-default-root-es",
    scenario: "default",
    traceId: "default-root-es",
    language: "es",
    seed: "0",
    frameDomainId: "root",
    frameIndexing: "one-indexed",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "es"},
    entryStateSha256:
      "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    sourceStatus: "blocked",
    sourceCapturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineManifestPath: "",
    baselineManifestSha256: "",
    implementationManifestPath: "",
    implementationManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
] as const);

export const COURSE_G04_L11_FQ_001_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  migrationStatus: "preserved",
  authoringInspectionStatus: "not-performed-by-this-script",
  legacyScriptSemanticsExecuted: false,
  nestedRuntimeEntryEstablished: false,
  naturalTraceEstablished: false,
  branchOrderEstablished: false,
  hostDefaultsEstablished: false,
  terminalBehaviorEstablished: false,
  replayBehaviorEstablished: false,
  currentJavascriptImplemented: false,
  originalRuntimeEvidenceEstablished: false,
  browserEvidenceEstablished: false,
  visualComparisonEstablished: false,
  visualMetricEstablished: false,
  audioAcceptanceEstablished: false,
  humanReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseAuthorized: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "none",
} as const);

export const COURSE_G04_L11_FQ_001_STATIC_SOURCE_FACTS = deepFreeze({
  kind: "internal-source-static-specification",
  animationId: COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID,
  assetId:
    "swf-9226553896cda584d9c03f784bc6f104ac4a9a80c3f6128bf14268f9719d7ba7",
  source: {
    swf: {
      ...COURSE_G04_L11_FQ_001_STATIC_ARTIFACTS.sourceSwf,
      signature: "CWS",
      compression: "zlib",
      version: 6,
      declaredUncompressedBytes: 33_984,
    },
    fla: {
      ...COURSE_G04_L11_FQ_001_STATIC_ARTIFACTS.sourceFla,
      pairedFlaStatus: "present",
      presenceAndHashOnly: true,
    },
    lessonXml: {
      ...COURSE_G04_L11_FQ_001_STATIC_ARTIFACTS.lessonXml,
      activeXmlOccurrence: 41,
    },
  },
  stage: {
    width: 800,
    height: 600,
    background: "#b8d8f7",
    fps: 12,
    rootFrameCount: 10,
    actionScriptVersion: "AS1/2",
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    memberOrdinal: 41,
    memberCount: 44,
    releaseRole: "active-xml-referenced-page",
    shardId: "g04-l11-practice-assessment",
  },
  authoringInspection: {
    machineAuditStatus: "not-performed-by-this-script",
    perFileFlaAuditStatus: "not-complete-legacy-conversion-dialog",
    applicationInstalled: true,
    blankDocumentProbeStatus: "passed",
    readinessScope: "tool-and-blank-document-only",
    structuralSemanticsEstablished: false,
  },
  artifacts: COURSE_G04_L11_FQ_001_STATIC_ARTIFACTS,
  rootDomain: COURSE_G04_L11_FQ_001_STATIC_DECLARED_ROOT_DOMAIN,
  timelineInventory: COURSE_G04_L11_FQ_001_STATIC_TIMELINE_INVENTORY_ROWS,
  frameDomainDispositions:
    COURSE_G04_L11_FQ_001_STATIC_FRAME_DOMAIN_DISPOSITIONS,
  rootRequirements: COURSE_G04_L11_FQ_001_STATIC_ROOT_REQUIREMENTS,
  audioObligations: COURSE_G04_L11_FQ_001_STATIC_AUDIO_OBLIGATIONS,
  evidenceBoundary: COURSE_G04_L11_FQ_001_STATIC_EVIDENCE_BOUNDARY,
} as const);

type Blocker =
  | "invalid-animation-id"
  | "invalid-frame-domain-id"
  | "invalid-timeline-id"
  | "timeline-disposition-not-recorded"
  | "invalid-root-frame";

const requestedScalar = (value: unknown): string | number | null =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value))
    ? value
    : null;

const blocked = (
  blocker: Blocker,
  animationId: unknown,
  requestedValue: unknown,
) => deepFreeze({
  kind: "blocked-static-source-query",
  status: "BLOCKED_UNVERIFIED",
  blocker,
  requestedAnimationId:
    typeof animationId === "string" ? animationId : null,
  requestedValue: requestedScalar(requestedValue),
  facts: null,
} as const);

export const getStaticSourceFacts = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_001_STATIC_SOURCE_FACTS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticDeclaredFrameDomain = (
  animationId: unknown,
  frameDomainId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frameDomainId);
  }
  return frameDomainId === "root"
    ? COURSE_G04_L11_FQ_001_STATIC_DECLARED_ROOT_DOMAIN
    : blocked("invalid-frame-domain-id", animationId, frameDomainId);
};

export const getStaticRootFrameFact = (
  animationId: unknown,
  frame: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frame);
  }
  if (!Number.isSafeInteger(frame) || (frame as number) < 1 || (frame as number) > 10) {
    return blocked("invalid-root-frame", animationId, frame);
  }
  return COURSE_G04_L11_FQ_001_STATIC_ROOT_FRAME_FACTS[(frame as number) - 1];
};

export const getStaticTimelineDisposition = (
  animationId: unknown,
  timelineId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, timelineId);
  }
  const disposition = COURSE_G04_L11_FQ_001_STATIC_FRAME_DOMAIN_DISPOSITIONS.find(
    (candidate) => candidate.timelineId === timelineId,
  );
  if (disposition) return disposition;
  const inventoryRow = COURSE_G04_L11_FQ_001_STATIC_TIMELINE_INVENTORY_ROWS.find(
    (candidate) => candidate.timelineId === timelineId,
  );
  if (inventoryRow) {
    return blocked("timeline-disposition-not-recorded", animationId, timelineId);
  }
  return blocked("invalid-timeline-id", animationId, timelineId);
};

export const getStaticTimelineInventoryRow = (
  animationId: unknown,
  timelineId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, timelineId);
  }
  const row = COURSE_G04_L11_FQ_001_STATIC_TIMELINE_INVENTORY_ROWS.find(
    (candidate) => candidate.timelineId === timelineId,
  );
  return row ?? blocked("invalid-timeline-id", animationId, timelineId);
};

export const getStaticActionRecords = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_001_STATIC_ACTION_RECORDS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_001_STATIC_BLOCKED_HOST_DEPENDENCIES
    : blocked("invalid-animation-id", animationId, null);

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_001_STATIC_AUDIO_OBLIGATIONS
    : blocked("invalid-animation-id", animationId, null);
