/**
 * Internal RW003 source-static specification.
 *
 * This file contains immutable observations from the pinned SWF, catalog, and
 * audit artifacts. It has no executable lesson behavior or acceptance effect.
 */

export const COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID =
  "course-g04-l11-rw-003" as const;

export interface SourceArtifactBinding {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly uncompressedBytes?: number;
  readonly uncompressedSha256?: string;
}

export interface BlockedUnverified {
  readonly status: "BLOCKED_UNVERIFIED";
  readonly blocker: string;
  readonly facts: null;
}

const deepFreeze = <T>(value: T, seen = new Set<object>()): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    const record = value as Record<PropertyKey, unknown>;
    if (!seen.has(record)) {
      seen.add(record);
      for (const key of Reflect.ownKeys(record)) deepFreeze(record[key], seen);
      Object.freeze(record);
    }
  }
  return value as Readonly<T>;
};

const blocked = (blocker: string): Readonly<BlockedUnverified> => deepFreeze({
  status: "BLOCKED_UNVERIFIED",
  blocker,
  facts: null,
} as const);

const SOURCE_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/RW/L11RW03.swf";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";

/** Exactly twenty independently byte-pinned source-static artifacts. */
export const COURSE_G04_L11_RW_003_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_SWF_PATH,
    bytes: 727_522,
    sha256: "baf927615b9fdfe405db23441c654f4c24773d3ce1d2e394b6dfa155ee206e2d",
  },
  lessonXml: {
    path: LESSON_XML_PATH,
    bytes: 10_085,
    sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    bytes: 145_216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  migrationManifest: {
    path: "migrations/course-g04-l11-rw-003/migration.json",
    bytes: 6_913,
    sha256: "3e25a06d42b4ffbfbbac18c3da035e98607d5bc97af051892dff46ebceeaa872",
  },
  machineReport: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/report.json",
    bytes: 12_525,
    sha256: "9b2d8746afaf5f0441ece7d76a1463c57e1074d4ece2182738607778f2d601fe",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/ffdec-header.txt",
    bytes: 188,
    sha256: "eceedc26f82b1235069a66f61d08e21527d4757e4a3d0ea42ff65d4f51b047e5",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/ffdec-script-index.txt",
    bytes: 119,
    sha256: "7441175a7931254254cf87e8e55623cc5a922e3b1615891c4e8d3ae9185dab8d",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 143,
    sha256: "2c5aee1021397595757cb7fc2a4d17ce751e01c5cbea3fa1782f9c6cfbaf4355",
    uncompressedBytes: 196,
    uncompressedSha256:
      "372af82236a68febf9ac790866978774773363b7a68c81346fee1a3bf8ea82f8",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/ffdec-tags.txt.gz",
    bytes: 106_569,
    sha256: "85853fddb93ca85b112d093170335480d6a2a215bbac9213500fccb64cd994a0",
    uncompressedBytes: 496_294,
    uncompressedSha256:
      "b752d373b521d0f713edaa972077728cca70047d74c645d1d821f35b71323ee5",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_510,
    sha256: "b749aa83ce98231dff797313723500fa8c4abf2a8189f7368fc5f01a85d7418b",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/swfmill-summary.json",
    bytes: 2_481,
    sha256: "e671d18a7737d376720a8df278529010903f595cd4510ef5db6cc90f5e5b8fab",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-rw-003/audit/machine/swfmill.xml.gz",
    bytes: 766_398,
    sha256: "a3ebef6d525fc42038d54d07d9f0ee57acdd9ac62732b655d1cb83f0f770c3eb",
    uncompressedBytes: 2_168_323,
    uncompressedSha256:
      "e6d12549c1245aee424a11d67fc7accb24aec733f25375dade4cee81354b98c6",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-rw-003/audit/scenario-inventory.json",
    bytes: 100_415,
    sha256: "ec08c9fc8a398f951d0062353e3b3a7c7a6f36e14e4d79e59c863d23aab365cf",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-rw-003/audit/frame-domain-disposition.json",
    bytes: 13_788,
    sha256: "dfb19bd12bb642d828a0a6022278a12a1b57bc06b7757072e36e0423c2b41f1f",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-rw-003/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "7a34728a2ddf02c697d7441f211f8aa4c4a02b92b8864083260f5b647b22a396",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-rw-003/audit/audio-runtime-evidence.json",
    bytes: 9_618,
    sha256: "d2f69fe60166b3d526b2e085ab2ce2ad08383e1de3a6d8e35389db709c39f592",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-rw-003/audio-inventory.csv",
    bytes: 698,
    sha256: "13e5c7d4d615f8fe67c60e28b8b924decfcfe5f61fd550b66fb3a00c0b426cb2",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-rw-003/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "ae23a2fef57ad49f75192206cfcdae568643d04aa8fcbe1f648813c5b8b7d269",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-rw-003/audit/strict-readiness.json",
    bytes: 16_610,
    sha256: "d543f01cd0ca3b62de54ab20098cded9b3e9c7a4751109856330f82fd8e164f8",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-rw-003/baseline/ffdec-root-frames.json",
    bytes: 3_569,
    sha256: "9058450efd9a4f876785097b5d30071d1fed769e1b53451dbaf96d34d884b441",
  },
} as const);

export const COURSE_G04_L11_RW_003_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID,
  assetId: "swf-baf927615b9fdfe405db23441c654f4c24773d3ce1d2e394b6dfa155ee206e2d",
  source: {
    swf: {
      path: SOURCE_SWF_PATH,
      bytes: 727_522,
      sha256: "baf927615b9fdfe405db23441c654f4c24773d3ce1d2e394b6dfa155ee206e2d",
    },
    fla: null,
    flaSha256: null,
    pairedFlaStatus: "missing",
    authoringInspectionStatus: "missing-source",
    strictAuthoringInspectionStatus: "not-applicable-fla-missing",
    authoringConfidence: "unknown",
    authoringStructureRecovered: false,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/RW/L11RW03.swf",
    activeXmlOccurrence: {
      title: "Page 2",
      randomAudio: "",
      backgroundText: "",
      exactText: "<Page Title=\"Page 2\" RandomAudio=\"\" BGText=\"\">RW/L11RW03.swf</Page>",
      xmlOccurrence: 3,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    expectedMemberCount: 44,
    ordinal: 3,
    xmlOccurrence: 3,
    releaseRole: "active-xml-referenced-page",
    batchId: "g04-l11-host-language",
    shardId: "g04-l11-host-language",
    sourcePath: "HELP_COURSES/ELMGR4/L11/RW/L11RW03.swf",
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    compression: "zlib",
    physicalSourceBytes: 727_522,
    declaredUncompressedBytes: 854_162,
    actionScriptVersion: "AS1/2",
    stage: {
      units: "twips",
      twipsPerPixel: 20,
      xMin: 0,
      xMax: 16_000,
      yMin: 0,
      yMax: 12_000,
      width: 16_000,
      height: 12_000,
      widthPixels: 800,
      heightPixels: 600,
      fractionalNativeStage: false,
      roundingApplied: false,
      exactTwipToPixelDivision: true,
    },
    captureRaster: {
      width: 800,
      height: 600,
      exactNativeIntegerProjection: true,
      roundingApplied: false,
    },
    fps: 12,
    rootFrameCount: 10,
    backgroundColor: "#b8d8f7",
  },
  status: {
    migration: "preserved",
    sourceStaticOnly: true,
    currentJsCandidateExists: false,
    strictAcceptanceReady: false,
    publicationAllowed: false,
  },
} as const);

export const COURSE_G04_L11_RW_003_STATIC_TAG_COUNTS = deepFreeze({
  DefineMorphShape: 10,
  DefineFont2: 3,
  DefineText: 62,
  DefineButton2: 0,
  DefineSprite: 3,
  ShowFrame: 1_059,
  DoAction: 3,
  FrameLabel: 1,
  SoundStreamHead: 1,
  SoundStreamBlock: 936,
} as const);

const ROOT_CONTROL_RECORDS = deepFreeze([
  {
    frame: 1,
    reasons: [
      "exported-action-script",
      "initial-one-indexed-frame",
      "script-stop-state",
      "structural-action:DoAction",
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
    depth: "1",
    frame: 6,
    hasClipActions: false,
    name: "Animation",
    objectId: "156",
    replace: "0",
    tag: "PlaceObject2",
  },
  {
    depth: "118",
    frame: 6,
    hasClipActions: false,
    name: "Mc_Page_Title",
    objectId: "159",
    replace: "0",
    tag: "PlaceObject2",
  },
] as const);

export const COURSE_G04_L11_RW_003_STATIC_ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    const control = ROOT_CONTROL_RECORDS.find((entry) => entry.frame === frame);
    return {
      kind: "source-static-root-frame-fact",
      frameDomainId: "root",
      frame,
      validDeclaredFrame: true,
      controlReasons: control?.reasons ?? [],
      label: frame === 6 ? "begin" : null,
      namedPlacements: frame === 6 ? ROOT_NAMED_PLACEMENTS : [],
      legacyActionSemanticsExecuted: false,
      naturalEntryProven: false,
      visualAuthorityEstablished: false,
    };
  }),
);

export const COURSE_G04_L11_RW_003_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

/** Full hash-bound scenario timelineInventory projection. */
export const COURSE_G04_L11_RW_003_STATIC_SCENARIO_TIMELINE_INVENTORY =
  deepFreeze([
    {
      timelineId: "root",
      objectId: null,
      frameCount: 10,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: 10,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: "root",
      controlStates: [
        {
          frame: 1,
          reasons: [
            "exported-action-script",
            "initial-one-indexed-frame",
            "script-stop-state",
            "structural-action:DoAction",
          ],
          evidence: [
            {artifactId: "swfmill-xml", timelineId: "root"},
            {artifactId: "swfmill-xml", timelineId: "root"},
            {
              artifactId: "ffdec-scripts",
              script: "frame_1/DoAction.as",
              lineStart: 4,
              lineEnd: 6,
            },
            {
              artifactId: "ffdec-scripts",
              script: "frame_1/DoAction.as",
              lineStart: 4,
              lineEnd: 6,
            },
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
          evidence: [
            {artifactId: "swfmill-xml", timelineId: "root"},
            {artifactId: "swfmill-xml", timelineId: "root"},
            {
              artifactId: "ffdec-scripts",
              script: "frame_6/DoAction.as",
              lineStart: 8,
              lineEnd: 9,
            },
            {
              artifactId: "ffdec-scripts",
              script: "frame_6/DoAction.as",
              lineStart: 8,
              lineEnd: 9,
            },
          ],
        },
        {
          frame: 10,
          reasons: ["terminal-structural-frame"],
          evidence: [{artifactId: "swfmill-xml", timelineId: "root"}],
        },
      ],
      frameLabels: [{frame: 6, label: "begin"}],
      namedPlacements: ROOT_NAMED_PLACEMENTS,
      evidence: {artifactId: "swfmill-xml", timelineId: "root"},
    },
    {
      timelineId: "sprite-11",
      objectId: "11",
      frameCount: 22,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: 22,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: "reachable-from-root-placement-graph",
      controlStates: [
        {
          frame: 1,
          reasons: ["initial-one-indexed-frame"],
          evidence: [{artifactId: "swfmill-xml", timelineId: "sprite-11"}],
        },
        {
          frame: 22,
          reasons: ["terminal-structural-frame"],
          evidence: [{artifactId: "swfmill-xml", timelineId: "sprite-11"}],
        },
      ],
      frameLabels: [],
      namedPlacements: [],
      evidence: {artifactId: "swfmill-xml", timelineId: "sprite-11"},
    },
    {
      timelineId: "sprite-156",
      objectId: "156",
      frameCount: 1_026,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: 1_026,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: "reachable-from-root-placement-graph",
      controlStates: [
        {
          frame: 1,
          reasons: ["initial-one-indexed-frame"],
          evidence: [{artifactId: "swfmill-xml", timelineId: "sprite-156"}],
        },
        {
          frame: 1_026,
          reasons: [
            "exported-action-script",
            "script-stop-state",
            "structural-action:DoAction",
            "terminal-structural-frame",
          ],
          evidence: [
            {artifactId: "swfmill-xml", timelineId: "sprite-156"},
            {artifactId: "swfmill-xml", timelineId: "sprite-156"},
            {
              artifactId: "ffdec-scripts",
              script: "DefineSprite_156/frame_1026/DoAction.as",
              lineStart: 1,
              lineEnd: 2,
            },
            {
              artifactId: "ffdec-scripts",
              script: "DefineSprite_156/frame_1026/DoAction.as",
              lineStart: 1,
              lineEnd: 2,
            },
          ],
        },
      ],
      frameLabels: [],
      namedPlacements: [],
      evidence: {artifactId: "swfmill-xml", timelineId: "sprite-156"},
    },
    {
      timelineId: "sprite-159",
      objectId: "159",
      frameCount: 1,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: 1,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: "reachable-from-root-placement-graph",
      controlStates: [
        {
          frame: 1,
          reasons: ["initial-one-indexed-frame", "terminal-structural-frame"],
          evidence: [
            {artifactId: "swfmill-xml", timelineId: "sprite-159"},
            {artifactId: "swfmill-xml", timelineId: "sprite-159"},
          ],
        },
      ],
      frameLabels: [],
      namedPlacements: [],
      evidence: {artifactId: "swfmill-xml", timelineId: "sprite-159"},
    },
  ] as const);

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256:
    "ec08c9fc8a398f951d0062353e3b3a7c7a6f36e14e4d79e59c863d23aab365cf",
  swfmillArtifactId: "swfmill-xml",
  swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256:
    "a3ebef6d525fc42038d54d07d9f0ee57acdd9ac62732b655d1cb83f0f770c3eb",
} as const);

const ROOT_TO_156 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-156",
  sourceObjectId: "156",
  frame: 6,
  depth: "1",
  instanceName: "Animation",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

const ROOT_TO_159 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-159",
  sourceObjectId: "159",
  frame: 6,
  depth: "118",
  instanceName: "Mc_Page_Title",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

/** Complete four-timeline frame-domain disposition projection. */
export const COURSE_G04_L11_RW_003_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
  {
    timelineId: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: 10,
    structuralReachability: "root",
    rootPlacement: {status: "root-timeline", namedPlacementPath: []},
    knownNamedParentPlacements: [],
    declaredFrameDomains: [
      {
        frameDomainId: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "",
        parentFrameDomainId: null,
        parentEntryFrame: null,
        localEntryFrame: null,
        frameCount: 10,
        role: "",
      },
    ],
    disposition: "declared-frame-domain",
    dispositionBasis:
      "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains.",
    riskAssessment: {
      level: "none",
      independentFrameDomainCandidate: false,
      signals: ["source-timeline-already-declared-as-frame-domain"],
      interpretation:
        "No undeclared-domain triage signal; fidelity still depends on the declared domain's required runtime and visual evidence.",
    },
    staticSignals: {
      controlStateCount: 3,
      frameLabelCount: 1,
      namedChildPlacementCount: 2,
    },
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-11",
    sourceTimelineId: "sprite-11",
    sourceObjectId: "11",
    frameCount: 22,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "structurally-reachable-but-named-root-path-unresolved",
      namedPlacementPath: [],
      limitation:
        "The scenario inventory proves root reachability from the full placement graph but retains only named placements; no complete named chain to root is present in this artifact.",
    },
    knownNamedParentPlacements: [],
    declaredFrameDomains: [],
    disposition: "unresolved",
    dispositionBasis:
      "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.",
    riskAssessment: {
      level: "review",
      independentFrameDomainCandidate: true,
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
      ],
      interpretation:
        "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent.",
    },
    staticSignals: {
      controlStateCount: 2,
      frameLabelCount: 0,
      namedChildPlacementCount: 0,
    },
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-156",
    sourceTimelineId: "sprite-156",
    sourceObjectId: "156",
    frameCount: 1_026,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "proven-named-placement-chain",
      namedPlacementPath: [ROOT_TO_156],
    },
    knownNamedParentPlacements: [ROOT_TO_156],
    declaredFrameDomains: [],
    disposition: "unresolved",
    dispositionBasis:
      "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.",
    riskAssessment: {
      level: "high",
      independentFrameDomainCandidate: true,
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
        "direct-named-root-placement",
      ],
      interpretation:
        "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent.",
    },
    staticSignals: {
      controlStateCount: 2,
      frameLabelCount: 0,
      namedChildPlacementCount: 0,
    },
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-159",
    sourceTimelineId: "sprite-159",
    sourceObjectId: "159",
    frameCount: 1,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "proven-named-placement-chain",
      namedPlacementPath: [ROOT_TO_159],
    },
    knownNamedParentPlacements: [ROOT_TO_159],
    declaredFrameDomains: [],
    disposition: "unresolved",
    dispositionBasis:
      "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.",
    riskAssessment: {
      level: "review",
      independentFrameDomainCandidate: false,
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "direct-named-root-placement",
      ],
      interpretation:
        "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain.",
    },
    staticSignals: {
      controlStateCount: 1,
      frameLabelCount: 0,
      namedChildPlacementCount: 0,
    },
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
] as const);

export const COURSE_G04_L11_RW_003_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 4,
  enumeratedTimelineCount: 4,
  reachableChildTimelineCount: 3,
  excludedNotProvenTimelineCount: 0,
  dispositionCounts: {
    "declared-frame-domain": 1,
    "composite-child-with-parent": 0,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 3,
  },
  highRiskIndependentCandidateCount: 1,
  highRiskIndependentCandidates: [
    {
      timelineId: "sprite-156",
      sourceObjectId: "156",
      frameCount: 1_026,
      rootPlacementStatus: "proven-named-placement-chain",
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
        "direct-named-root-placement",
      ],
    },
  ],
} as const);

export const COURSE_G04_L11_RW_003_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  {
    requirementId: "req-default-root-en",
    scenario: "default",
    frameDomainId: "root",
    traceId: "default-root-en",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "en"},
    entryStateSha256:
      "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
  {
    requirementId: "req-default-root-es",
    scenario: "default",
    frameDomainId: "root",
    traceId: "default-root-es",
    language: "es",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "es"},
    entryStateSha256:
      "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
] as const);

const DO_ACTION = (
  id: string,
  script: string,
  body: string,
  bodyBytes: number,
  bodySha256: string,
  lineStart: number,
  lineEnd: number,
  scope: Readonly<{kind: "root" | "sprite"; objectId: string | null; frame: number}>,
) => ({
  kind: "source-static-do-action",
  id,
  script,
  body,
  bodyBytes,
  bodySha256,
  lineStart,
  lineEnd,
  scope,
  legacyActionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
} as const);

/** All three exact FFDec script bodies, retained but never evaluated. */
export const COURSE_G04_L11_RW_003_STATIC_ACTION_RECORDS = deepFreeze([
  DO_ACTION(
    "script-0001",
    "DefineSprite_156/frame_1026/DoAction.as",
    "stop();",
    7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    1,
    2,
    {kind: "sprite", objectId: "156", frame: 1_026},
  ),
  DO_ACTION(
    "script-0002",
    "frame_1/DoAction.as",
    "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();",
    60,
    "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3",
    4,
    6,
    {kind: "root", objectId: null, frame: 1},
  ),
  DO_ACTION(
    "script-0003",
    "frame_6/DoAction.as",
    "stop();",
    7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    8,
    9,
    {kind: "root", objectId: null, frame: 6},
  ),
] as const);

export const COURSE_G04_L11_RW_003_STATIC_BLOCKED_HOST_DEPENDENCIES =
  deepFreeze([
    {
      sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "The root preloader handoff is a host-dependent legacy operation with no authorized natural-entry runtime evidence.",
      facts: null,
    },
  ] as const);

export const COURSE_G04_L11_RW_003_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 3,
  buttonReleaseHandlerCount: 0,
  doActionCount: 3,
  randomCallCount: 0,
  evalCallCount: 0,
  externalCallCandidateCount: 0,
  machineExternalCallCandidateCount: 0,
  machineExternalCandidatesDoNotEliminateHostDependencies: true,
  hostDependencyTokenCount: 1,
  actionScriptExecuted: false,
  naturalInteractionProven: false,
  exactStageSpaceHitBounds: "not-derived-from-hit-shape-geometry",
} as const);

export const COURSE_G04_L11_RW_003_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false,
  strictNoAudioConclusionForbidden: true,
  manifestAudioRequiredConflict:
    "migration.audio.required is false, but the audit found 0 exact external track(s) and 1 timed embedded sound asset/stream(s); update only after runtime reachability/listening review.",
  externalExactAssociationCount: 0,
  externalCandidateOnlyCount: 0,
  externalPlayable: false,
  embeddedStreams: [
    {
      id: "embedded-stream-0001",
      streamIndex: 1,
      contextKind: "sprite",
      sourceCharacterId: 156,
      contextDeclaredFrames: 1_026,
      headFrame: 1,
      firstBlockFrame: 1,
      lastBlockFrame: 1_026,
      blockCount: 936,
      totalDecodedSamples: 1_716_480,
      format: "mp3",
      syncMode: "stream",
      sampleRateHz: 22_050,
      sampleSizeBits: 16,
      channels: 1,
      nominalSamplesPerBlock: 1_837,
      seekSamplesMin: -2_315,
      seekSamplesMax: 1_673,
      durationSeconds: 77.844898,
      durationMs: 77_845,
      language: "und",
      rootCueFrame: null,
      startSemantics: "interaction-state",
      sourceStaticCueSemantics: "interaction-state",
      auditProjection: {
        streamIndex: 1,
        context: {kind: "sprite", characterId: 156},
        contextLabel: "sprite:156",
        contextDeclaredFrames: 1_026,
        headFrame: 1,
        firstBlockFrame: 1,
        lastBlockFrame: 1_026,
        syncMode: "stream",
        stop: false,
        loops: null,
        compressionCode: 2,
        format: "mp3",
        playbackRateCode: 2,
        playbackSampleRateHz: 22_050,
        playbackSampleSizeBits: 16,
        playbackChannels: 1,
        rateCode: 2,
        sampleRateHz: 22_050,
        sampleSizeBits: 16,
        channels: 1,
        nominalSamplesPerBlock: 1_837,
        blockCount: 936,
        blocksWithDecodedSampleCount: 936,
        totalDecodedSamples: 1_716_480,
        seekSamplesMin: -2_315,
        seekSamplesMax: 1_673,
        durationSeconds: 77.844898,
        durationMs: 77_845,
        durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
        evidence: {
          file: "audit/machine/swfmill.xml.gz",
          headLine: 16_449,
        },
      },
      rootCueResolved: false,
      runtimeReachabilityVerified: false,
      originalRuntimeListeningAccepted: false,
      spokenLanguageContentVerified: false,
      synchronizationVerified: false,
      stopBehaviorVerified: false,
      replayBehaviorVerified: false,
      playable: false,
    },
  ],
  strictAudioAcceptance: false,
} as const);

export const COURSE_G04_L11_RW_003_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  workspaceScope: "non-shell",
  runtimeScopeClassification:
    "shell-only-forensic-question-not-applied-to-this-page-workspace",
  runtimeDependencyScopeStatus: "not-applied-to-this-non-shell-workspace",
  pageScriptReachabilityObserved: false,
  pageScriptReferenceObserved: false,
  pageDependencyEstablished: false,
  wholeLessonAndShellKeyTermsUnresolved: true,
  canonicalDependencies: [
    {
      path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml",
      status: "BLOCKED_UNVERIFIED",
      sourceBytes: null,
      bytes: null,
      sha256: null,
      successorReceipt: null,
      replacementAccepted: false,
      facts: null,
    },
    {
      path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml",
      status: "BLOCKED_UNVERIFIED",
      sourceBytes: null,
      bytes: null,
      sha256: null,
      successorReceipt: null,
      replacementAccepted: false,
      facts: null,
    },
  ],
  gradeWideRetrievalLeads: [
    {
      path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
      replacementAccepted: false,
      disposition: "retrieval-lead-only-not-a-substitute",
    },
    {
      path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
      replacementAccepted: false,
      disposition: "retrieval-lead-only-not-a-substitute",
    },
  ],
} as const);

export const COURSE_G04_L11_RW_003_STATIC_BASELINE_RATIONALE_CONFLICT =
  deepFreeze({
    id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
    status: "OPEN_RECORDED",
    severityForSourceStaticLayerA: "nonblocking-if-explicitly-contained",
    scope: "stage-rasterization-rationale-only",
    accepted: false,
    conflictingClaimAccepted: false,
    fractionalNativeStageClaimAccepted: false,
    affectedArtifacts: [
      {
        path: "migrations/course-g04-l11-rw-003/baseline/ffdec-root-frames.json",
        bytes: 3_569,
        sha256:
          "9058450efd9a4f876785097b5d30071d1fed769e1b53451dbaf96d34d884b441",
        field: "runtime.rasterization.rationale",
      },
      {
        path: "migrations/course-g04-l11-rw-003/audit/strict-readiness.json",
        bytes: 16_610,
        sha256:
          "d543f01cd0ca3b62de54ab20098cded9b3e9c7a4751109856330f82fd8e164f8",
        field:
          "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale",
      },
    ],
    exactObservedConflictingText:
      "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
    sourceAuthoritativeStage: {
      xMinTwips: 0,
      xMaxTwips: 16_000,
      yMinTwips: 0,
      yMaxTwips: 12_000,
      widthTwips: 16_000,
      heightTwips: 12_000,
      twipsPerPixel: 20,
      widthPixels: 800,
      heightPixels: 600,
      widthPx: 800,
      heightPx: 600,
      fractional: false,
      fractionalNativeStage: false,
      roundingApplied: false,
      exactIntegerConversion: true,
    },
    captureRaster: {
      width: 800,
      height: 600,
      matchesAuthoredStageExactly: true,
      roundingApplied: false,
    },
    baselineFrameManifestHashBound: true,
    baselinePngDimensionsInvalidated: false,
    baselineRationaleRejected: true,
    baselineRationaleAccepted: false,
    scenarioGenerationBlocked: false,
    frameDispositionGenerationBlocked: false,
    sourceStaticLayerABlocked: false,
    originalRuntimeAuthorityEstablished: false,
    fidelityEstablished: false,
    strictCompletionEstablished: false,
    publicationEstablished: false,
    strictAcceptanceEffect: "blocked-unresolved",
    publicationEffect: "none",
  } as const);

export const COURSE_G04_L11_RW_003_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  javascriptRenderer: false,
  registryEntry: false,
  currentJavascriptCoverage: false,
  naturalEntryProven: false,
  originalRuntimeAuthority: false,
  visualAuthority: false,
  audioAccepted: false,
  renderer: false,
  registry: false,
  currentJs: false,
  actionScriptExecuted: false,
  naturalRuntime: false,
  originalRuntime: false,
  visualAcceptance: false,
  audioAcceptance: false,
  keyTermsResolved: false,
  humanReview: false,
  engineeringReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  publication: false,
} as const);

export const getStaticSourceFacts = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_003_STATIC_SOURCE_FACTS
    : blocked("animation-id-must-match-rw003-source-static-contract");

export const getStaticDeclaredFrameDomain = (
  animationId: unknown,
  frameDomainId: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : frameDomainId === "root"
  ? COURSE_G04_L11_RW_003_STATIC_DECLARED_ROOT_DOMAIN
  : typeof frameDomainId === "string"
  ? blocked("only-the-declared-root-frame-domain-is-source-static")
  : blocked("frame-domain-id-must-be-a-string");

export const getStaticRootFrameFact = (
  animationId: unknown,
  frame: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : typeof frame === "number" &&
    Number.isInteger(frame) &&
    frame >= 1 &&
    frame <= 10
  ? COURSE_G04_L11_RW_003_STATIC_ROOT_FRAME_FACTS[frame - 1] ??
    blocked("root-frame-index-is-not-bound")
  : blocked("root-frame-must-be-a-finite-one-indexed-integer-in-1-through-10");

export const getStaticTimelineDisposition = (
  animationId: unknown,
  timelineId: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : typeof timelineId === "string"
  ? COURSE_G04_L11_RW_003_STATIC_TIMELINE_DISPOSITIONS.find(
    (row) => row.timelineId === timelineId,
  ) ?? blocked("timeline-id-is-not-in-the-hash-bound-rw003-inventory")
  : blocked("timeline-id-must-be-a-string");

export const getStaticActionRecord = (
  animationId: unknown,
  scriptId: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : typeof scriptId === "string"
  ? COURSE_G04_L11_RW_003_STATIC_ACTION_RECORDS.find(
    (row) => row.id === scriptId,
  ) ?? blocked("script-id-is-not-in-the-hash-bound-rw003-bundle")
  : blocked("script-id-must-be-a-string");

export const getStaticRootRequirement = (
  animationId: unknown,
  requirementId: unknown,
  language: unknown,
  scenario: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : typeof requirementId === "string" &&
    typeof language === "string" &&
    typeof scenario === "string"
  ? COURSE_G04_L11_RW_003_STATIC_ROOT_REQUIREMENTS.find(
    (row) =>
      row.requirementId === requirementId &&
      row.language === language &&
      row.scenario === scenario,
  ) ?? blocked("requirement-language-scenario-combination-is-not-bound")
  : blocked("requirement-id-language-and-scenario-must-all-be-strings");

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_003_STATIC_AUDIO_OBLIGATIONS
    : blocked("animation-id-must-match-rw003-source-static-contract");

export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_003_STATIC_BLOCKED_HOST_DEPENDENCIES
    : blocked("animation-id-must-match-rw003-source-static-contract");

export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_003_STATIC_KEY_TERMS_BOUNDARY
    : blocked("animation-id-must-match-rw003-source-static-contract");

export const getStaticEvidenceBoundary = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_003_STATIC_EVIDENCE_BOUNDARY
    : blocked("animation-id-must-match-rw003-source-static-contract");

export const getStaticBaselineRationaleConflict = (
  animationId: unknown,
  conflictId: unknown,
) => animationId !== COURSE_G04_L11_RW_003_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw003-source-static-contract")
  : typeof conflictId !== "string"
  ? blocked("conflict-id-must-be-a-string")
  : conflictId === COURSE_G04_L11_RW_003_STATIC_BASELINE_RATIONALE_CONFLICT.id
  ? COURSE_G04_L11_RW_003_STATIC_BASELINE_RATIONALE_CONFLICT
  : blocked("conflict-id-is-not-in-the-hash-bound-rw003-inventory");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");

export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");

export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");

export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
