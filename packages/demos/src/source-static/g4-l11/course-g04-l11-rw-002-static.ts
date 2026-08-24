/**
 * Internal RW002 source-static specification.
 *
 * This module exposes immutable, hash-bound observations only. It does not
 * execute legacy ActionScript, advance a playhead, emit pixels, construct
 * audio, or alter candidate, acceptance, strict-completion, or publication
 * state.
 */

export const COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID =
  "course-g04-l11-rw-002" as const;

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

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const blocked = (blocker: string): Readonly<BlockedUnverified> => deepFreeze({
  status: "BLOCKED_UNVERIFIED",
  blocker,
  facts: null,
} as const);

const SOURCE_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/RW/L11RW02.swf";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";

/** Exactly twenty independently byte-pinned source-static artifacts. */
export const COURSE_G04_L11_RW_002_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_SWF_PATH,
    bytes: 833_868,
    sha256: "a63446478ef07d48bb62919776d54b2a025dc7f881137bf54b833ab75183431b",
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
    path: "migrations/course-g04-l11-rw-002/migration.json",
    bytes: 6_915,
    sha256: "68af1fbefac522b6226bff4ce9434c0f4a48d260e16244aacd4896c00aafb47d",
  },
  machineReport: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/report.json",
    bytes: 12_792,
    sha256: "06fff7e3cf3332780e9abf9c76c47d8d11dbf294e0c8788973dee29be95c5c67",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/ffdec-header.txt",
    bytes: 189,
    sha256: "d5ee22f03a2b1fb100fc7bda5730695dd75a1d8e1509940f3f983807409c307f",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/ffdec-script-index.txt",
    bytes: 729,
    sha256: "b681b9ac2e3688f37901a904a82603067320784ceb06f5dc7d4727de925930a2",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/ffdec-scripts.txt.gz",
    bytes: 363,
    sha256: "1146f4123acb5ed28c72231f4a9799c453327c356381b9a399162b03207e0704",
    uncompressedBytes: 2_261,
    uncompressedSha256:
      "183a039452ee42c37278ea579d22d9e142dd77c166267ab642fbdbd00c66429f",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/ffdec-tags.txt.gz",
    bytes: 138_408,
    sha256: "571be839bf83a930eda5d022c5281ee923da309e4a1e7f931451c5f10ee4b326",
    uncompressedBytes: 669_714,
    uncompressedSha256:
      "5a2c1bb5bdab83c22dccd8f36cfd3b4d724438ce217ee4e10c68b7d4a11a8ec5",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_513,
    sha256: "1ba83f5383ac4f7654937308068d9650131c27ebb0883c88475a5f0d1bac130d",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/swfmill-summary.json",
    bytes: 2_705,
    sha256: "b164f8b1f72dd428d40263665e6b0be9442623de74f196a560fb17a504423e78",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-rw-002/audit/machine/swfmill.xml.gz",
    bytes: 1_336_491,
    sha256: "b1bda3ae190f833315a25f2aa60ea7f5c9618de9c878b2ef8894e801a76b31c8",
    uncompressedBytes: 9_078_338,
    uncompressedSha256:
      "25820971a05b7b325b7eacb1f233584a139b4492488af4a08e8d6b6eaac9ff0f",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-rw-002/audit/scenario-inventory.json",
    bytes: 367_011,
    sha256: "d616e07ab62772e790edd26c18c2aef1d2ec99ffeac0532794edb5642d3714cb",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-rw-002/audit/frame-domain-disposition.json",
    bytes: 13_791,
    sha256: "f97b73097f3fa0336b47870b3e532ef2cefe582365c8f3bce2bf62dbc95c6cdf",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-rw-002/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "55b572d69e2f80ecab581ced1f85b519eb6402be830374e3a644ebccac87920f",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-rw-002/audit/audio-runtime-evidence.json",
    bytes: 9_617,
    sha256: "cae6d3c0ed1008929ce216860b89c771beffb319c1e50330a52e5619460447ff",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-rw-002/audio-inventory.csv",
    bytes: 699,
    sha256: "598a20fb622c24292f7c7b080f0fbb496a0ece355b5e4d104b55281bfbf6077e",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-rw-002/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "4562c38fc7cc9cfe1075bfacaef2582e231a279cd342c963507c7a978be42ee9",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-rw-002/audit/strict-readiness.json",
    bytes: 16_616,
    sha256: "51fbaa59acc0b8d986da270d59d20ef3fcb6a8b8373043f685acdea317cffc5d",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-rw-002/baseline/ffdec-root-frames.json",
    bytes: 3_568,
    sha256: "94bb101dfd7d347c0b36a01f9f398aafd5d9033ed0abbf9adb1aa769147a7434",
  },
} as const);

export const COURSE_G04_L11_RW_002_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID,
  assetId: "swf-a63446478ef07d48bb62919776d54b2a025dc7f881137bf54b833ab75183431b",
  source: {
    swf: {
      path: SOURCE_SWF_PATH,
      bytes: 833_868,
      sha256: "a63446478ef07d48bb62919776d54b2a025dc7f881137bf54b833ab75183431b",
    },
    fla: null,
    flaSha256: null,
    pairedFlaStatus: "missing",
    authoringInspectionStatus: "missing-source",
    strictAuthoringInspectionStatus: "not-applicable-fla-missing",
    authoringConfidence: "unknown",
    authoringStructureRecovered: false,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/RW/L11RW02.swf",
    activeXmlOccurrence: {
      title: "Page 1",
      randomAudio: "",
      backgroundText: "",
      exactText: "<Page Title=\"Page 1\" RandomAudio=\"\" BGText=\"\">RW/L11RW02.swf</Page>",
      xmlOccurrence: 2,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    expectedMemberCount: 44,
    ordinal: 2,
    xmlOccurrence: 2,
    releaseRole: "active-xml-referenced-page",
    batchId: "g04-l11-host-language",
    shardId: "g04-l11-host-language",
    sourcePath: "HELP_COURSES/ELMGR4/L11/RW/L11RW02.swf",
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    compression: "zlib",
    physicalSourceBytes: 833_868,
    declaredUncompressedBytes: 1_173_304,
    actionScriptVersion: "AS1/2",
    stageTwips: {
      xMin: 0,
      xMax: 16_000,
      yMin: 0,
      yMax: 12_000,
      width: 16_000,
      height: 12_000,
    },
    captureRaster: {
      width: 800,
      height: 600,
      rule: "ceil-positive-native-stage-dimensions",
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

export const COURSE_G04_L11_RW_002_STATIC_TAG_COUNTS = deepFreeze({
  DefineMorphShape: 12,
  DefineFont2: 2,
  DefineText: 49,
  DefineButton2: 11,
  DefineSprite: 3,
  ShowFrame: 1_189,
  DoAction: 3,
  FrameLabel: 1,
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
    objectId: "408",
    replace: "0",
    tag: "PlaceObject2",
  },
  {
    depth: "178",
    frame: 6,
    hasClipActions: false,
    name: "Mc_Page_Title",
    objectId: "412",
    replace: "0",
    tag: "PlaceObject2",
  },
] as const);

export const COURSE_G04_L11_RW_002_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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

export const COURSE_G04_L11_RW_002_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256:
    "d616e07ab62772e790edd26c18c2aef1d2ec99ffeac0532794edb5642d3714cb",
  swfmillArtifactId: "swfmill-xml",
  swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256:
    "b1bda3ae190f833315a25f2aa60ea7f5c9618de9c878b2ef8894e801a76b31c8",
} as const);

const ROOT_TO_408 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-408",
  sourceObjectId: "408",
  frame: 6,
  depth: "1",
  instanceName: "Animation",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

const ROOT_TO_412 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-412",
  sourceObjectId: "412",
  frame: 6,
  depth: "178",
  instanceName: "Mc_Page_Title",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

/** Complete, generated four-timeline source-static disposition projection. */
export const COURSE_G04_L11_RW_002_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
  {
    timelineId: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: 10,
    structuralReachability: "root",
    rootPlacement: {
      status: "root-timeline",
      namedPlacementPath: [],
    },
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
    timelineId: "sprite-206",
    sourceTimelineId: "sprite-206",
    sourceObjectId: "206",
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
    timelineId: "sprite-408",
    sourceTimelineId: "sprite-408",
    sourceObjectId: "408",
    frameCount: 1_156,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "proven-named-placement-chain",
      namedPlacementPath: [ROOT_TO_408],
    },
    knownNamedParentPlacements: [ROOT_TO_408],
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
    timelineId: "sprite-412",
    sourceTimelineId: "sprite-412",
    sourceObjectId: "412",
    frameCount: 1,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "proven-named-placement-chain",
      namedPlacementPath: [ROOT_TO_412],
    },
    knownNamedParentPlacements: [ROOT_TO_412],
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

export const COURSE_G04_L11_RW_002_STATIC_TIMELINE_SUMMARY = deepFreeze({
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
      timelineId: "sprite-408",
      sourceObjectId: "408",
      frameCount: 1_156,
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

export const COURSE_G04_L11_RW_002_STATIC_ROOT_REQUIREMENTS = deepFreeze([
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

const BUTTON_ACTION = (
  id: string,
  script: string,
  body: string,
  bodyBytes: number,
  bodySha256: string,
  lineStart: number,
  lineEnd: number,
  objectId: string,
  keyAttribute: string,
  hasBareQ: boolean,
) => ({
  kind: "source-static-button-release-action",
  id,
  script,
  body,
  bodyBytes,
  bodySha256,
  lineStart,
  lineEnd,
  scope: {kind: "button-definition", objectId, frame: null},
  event: "release",
  keyAttribute,
  hasBareQ,
  sourceTokens: [
    "_global.KeyAttribute",
    "_root.DoHyperLinks",
    "_root.animation_mc.animation.stop",
  ],
  legacyActionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
} as const);

const STOP_ACTION = (
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

/** All fourteen exact FFDec exported bodies, retained but never evaluated. */
export const COURSE_G04_L11_RW_002_STATIC_ACTION_RECORDS = deepFreeze([
  BUTTON_ACTION(
    "script-0001",
    "DefineButton2_110/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Ordered pair\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    127,
    "3ea2b1595cb3bb71fccb7d1765cefde462257b2e603b57ae94c9743de73584dd",
    1,
    7,
    "110",
    "Ordered pair",
    true,
  ),
  BUTTON_ACTION(
    "script-0002",
    "DefineButton2_396/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Pair\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    119,
    "a586e4004ebbbf006ebbed14db0ce196d51bd95d054a15130bf481990b5ecb24",
    9,
    15,
    "396",
    "Pair",
    true,
  ),
  BUTTON_ACTION(
    "script-0003",
    "DefineButton2_397/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Number\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    121,
    "8d2433ca31096b55f75f40e6ced548e6cd960172f864da8c6bba56c241d18661",
    17,
    23,
    "397",
    "Number",
    true,
  ),
  BUTTON_ACTION(
    "script-0004",
    "DefineButton2_398/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Locate\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    121,
    "a9d0f575060a1fd8b3e746722c9e75d7a1d23c7d55b974e52deb08ae0dadbad9",
    25,
    31,
    "398",
    "Locate",
    true,
  ),
  BUTTON_ACTION(
    "script-0005",
    "DefineButton2_399/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Point\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    120,
    "bd8e2f4b26e1a0875b7809265a702b514edbd9f61f40fece1257d3ece4eae5c1",
    33,
    39,
    "399",
    "Point",
    true,
  ),
  BUTTON_ACTION(
    "script-0006",
    "DefineButton2_90/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Grid\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    119,
    "fe915953ae8c60592cda1ab52710e2229649abc4c114540f58f4eebf50185839",
    41,
    47,
    "90",
    "Grid",
    true,
  ),
  BUTTON_ACTION(
    "script-0007",
    "DefineButton2_91/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Form\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    119,
    "af662cf2e34da115f5922d0ca7f1be3ea0a2aabadf06320ae1d09fcbc22a20ab",
    49,
    55,
    "91",
    "Form",
    true,
  ),
  BUTTON_ACTION(
    "script-0008",
    "DefineButton2_92/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Intersect\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    124,
    "2afd59f3b84d8c22d7e832297d2bc2e947b96e2e4b6319a48de760ee36c570ce",
    57,
    63,
    "92",
    "Intersect",
    true,
  ),
  BUTTON_ACTION(
    "script-0009",
    "DefineButton2_93/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Number line\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    126,
    "98e3ddb9a8192231926a1864675e669299222209c6bcff1a4b51ad5e48235c9d",
    65,
    71,
    "93",
    "Number line",
    true,
  ),
  BUTTON_ACTION(
    "script-0010",
    "DefineButton2_94/BUTTONCONDACTION on(release).as",
    "on(release){\n   q;\n   _global.KeyAttribute = \"Coordinate grid\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    130,
    "1868dd1b747da75c82186cb352987df2f6e6a886272212c80e1ae3592b00599c",
    73,
    79,
    "94",
    "Coordinate grid",
    true,
  ),
  BUTTON_ACTION(
    "script-0011",
    "DefineButton2_95/BUTTONCONDACTION on(release).as",
    "on(release){\n   _global.KeyAttribute = \"Coordinate plane/Cartesian Plane\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}",
    141,
    "23b2de354719e518dbda0bbb59cd1547b0f7b561a04fe6d69698ed655204327d",
    81,
    86,
    "95",
    "Coordinate plane/Cartesian Plane",
    false,
  ),
  STOP_ACTION(
    "script-0012",
    "DefineSprite_408/frame_1156/DoAction.as",
    "stop();",
    7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    88,
    89,
    {kind: "sprite", objectId: "408", frame: 1_156},
  ),
  STOP_ACTION(
    "script-0013",
    "frame_1/DoAction.as",
    "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();",
    60,
    "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3",
    91,
    93,
    {kind: "root", objectId: null, frame: 1},
  ),
  STOP_ACTION(
    "script-0014",
    "frame_6/DoAction.as",
    "stop();",
    7,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    95,
    96,
    {kind: "root", objectId: null, frame: 6},
  ),
] as const);

export const COURSE_G04_L11_RW_002_STATIC_BLOCKED_HOST_DEPENDENCIES =
  deepFreeze([
    {
      sourceToken: "_global.KeyAttribute",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "Eleven button handlers write a host/global value; the parent runtime value, resulting hyperlink behavior, and language state are not source-static facts.",
      facts: null,
    },
    {
      sourceToken: "q;",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "The first ten button bodies contain the bare q expression; its declaration and runtime semantics are unresolved and are not evaluated.",
      facts: null,
    },
    {
      sourceToken: "_root.DoHyperLinks",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "The host method is referenced by all eleven button release handlers, but no authorized natural host execution is bound.",
      facts: null,
    },
    {
      sourceToken: "_root.animation_mc.animation.stop",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "The target animation instance, stop effect, terminal behavior, and Replay reset are not executed or proven.",
      facts: null,
    },
    {
      sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")",
      status: "BLOCKED_UNVERIFIED",
      blocker:
        "The root preloader handoff is a host-dependent legacy operation with no authorized natural-entry runtime evidence.",
      facts: null,
    },
  ] as const);

export const COURSE_G04_L11_RW_002_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 14,
  buttonReleaseHandlerCount: 11,
  doActionCount: 3,
  randomCallCount: 0,
  evalCallCount: 0,
  externalCallCandidateCount: 0,
  machineExternalCallCandidateCount: 0,
  machineExternalCandidatesDoNotEliminateHostDependencies: true,
  hostDependencyTokenCount: 5,
  actionScriptExecuted: false,
  naturalInteractionProven: false,
  exactStageSpaceHitBounds: "not-derived-from-hit-shape-geometry",
} as const);

export const COURSE_G04_L11_RW_002_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false,
  strictNoAudioConclusionForbidden: true,
  manifestAudioRequiredConflict:
    "migration.audio.required is false, but source-static audit found one timed embedded SoundStream; runtime reachability and listening are required before any accepted no-audio conclusion.",
  externalExactAssociationCount: 0,
  externalCandidateOnlyCount: 0,
  externalPlayable: false,
  embeddedStreams: [
    {
      id: "embedded-stream-0001",
      streamIndex: 1,
      contextKind: "sprite",
      sourceCharacterId: 408,
      contextDeclaredFrames: 1_156,
      headFrame: 1,
      firstBlockFrame: 9,
      lastBlockFrame: 1_156,
      blockCount: 1_148,
      totalDecodedSamples: 2_108_160,
      format: "mp3",
      syncMode: "stream",
      sampleRateHz: 22_050,
      sampleSizeBits: 16,
      channels: 1,
      durationSeconds: 95.608163,
      durationMs: 95_608,
      language: "und",
      rootCueFrame: null,
      startSemantics: "interaction-state",
      sourceStaticCueSemantics: "interaction-state",
      auditProjection: {
        streamIndex: 1,
        context: {kind: "sprite", characterId: 408},
        contextLabel: "sprite:408",
        contextDeclaredFrames: 1_156,
        headFrame: 1,
        firstBlockFrame: 9,
        lastBlockFrame: 1_156,
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
        blockCount: 1_148,
        blocksWithDecodedSampleCount: 1_148,
        totalDecodedSamples: 2_108_160,
        seekSamplesMin: 0,
        seekSamplesMax: 1_673,
        durationSeconds: 95.608163,
        durationMs: 95_608,
        durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
        evidence: {
          file: "audit/machine/swfmill.xml.gz",
          headLine: 175_669,
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

export const COURSE_G04_L11_RW_002_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  workspaceScope: "non-shell",
  runtimeScopeClassification:
    "shell-only-forensic-question-not-applied-to-this-page-workspace",
  runtimeDependencyScopeStatus: "not-applied-to-this-non-shell-workspace",
  pageScriptEvidence: {
    buttonReleaseHandlerCount: 11,
    hostMethod: "_root.DoHyperLinks",
    executionProven: false,
  },
  runtimeScopeAndPageBehaviorTension:
    "The dependency-scope audit classifies the missing XML question as shell-only for this non-shell workspace, while all eleven RW002 button handlers call _root.DoHyperLinks; source-static evidence does not prove whether those page calls reach Key Terms, so page behavior remains unresolved.",
  pageBehaviorUnresolved: true,
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

export const COURSE_G04_L11_RW_002_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
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

export const getStaticSourceFacts = (
  animationId: unknown,
) => animationId === COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? COURSE_G04_L11_RW_002_STATIC_SOURCE_FACTS
  : blocked("animation-id-must-match-rw002-source-static-contract");

export const getStaticDeclaredFrameDomain = (
  animationId: unknown,
  frameDomainId: unknown,
) => animationId !== COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw002-source-static-contract")
  : frameDomainId === "root"
  ? COURSE_G04_L11_RW_002_STATIC_DECLARED_ROOT_DOMAIN
  : blocked("only-the-declared-root-frame-domain-is-source-static");

export const getStaticRootFrameFact = (
  animationId: unknown,
  frame: unknown,
) => animationId !== COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw002-source-static-contract")
  : typeof frame === "number" &&
  Number.isInteger(frame) &&
  frame >= 1 &&
  frame <= 10
  ? COURSE_G04_L11_RW_002_STATIC_ROOT_FRAME_FACTS[frame - 1] ??
    blocked("root-frame-index-is-not-bound")
  : blocked("root-frame-must-be-a-finite-one-indexed-integer-in-1-through-10");

export const getStaticTimelineDisposition = (
  animationId: unknown,
  timelineId: unknown,
) => animationId !== COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw002-source-static-contract")
  : typeof timelineId === "string"
  ? COURSE_G04_L11_RW_002_STATIC_TIMELINE_DISPOSITIONS.find(
    (row) => row.timelineId === timelineId,
  ) ?? blocked("timeline-id-is-not-in-the-hash-bound-rw002-inventory")
  : blocked("timeline-id-must-be-a-string");

export const getStaticActionRecord = (
  animationId: unknown,
  scriptId: unknown,
) => animationId !== COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw002-source-static-contract")
  : typeof scriptId === "string"
  ? COURSE_G04_L11_RW_002_STATIC_ACTION_RECORDS.find(
    (row) => row.id === scriptId,
  ) ?? blocked("script-id-is-not-in-the-hash-bound-rw002-bundle")
  : blocked("script-id-must-be-a-string");

export const getStaticRootRequirement = (
  animationId: unknown,
  requirementId: unknown,
  language: unknown,
  scenario: unknown,
) => animationId !== COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
  ? blocked("animation-id-must-match-rw002-source-static-contract")
  : typeof requirementId === "string" &&
  typeof language === "string" &&
  typeof scenario === "string"
  ? COURSE_G04_L11_RW_002_STATIC_ROOT_REQUIREMENTS.find(
    (row) =>
      row.requirementId === requirementId &&
      row.language === language &&
      row.scenario === scenario,
  ) ?? blocked("requirement-language-scenario-combination-is-not-bound")
  : blocked("requirement-id-language-and-scenario-must-all-be-strings");

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_002_STATIC_AUDIO_OBLIGATIONS
    : blocked("animation-id-must-match-rw002-source-static-contract");

export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_002_STATIC_BLOCKED_HOST_DEPENDENCIES
    : blocked("animation-id-must-match-rw002-source-static-contract");

export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_RW_002_STATIC_KEY_TERMS_BOUNDARY
    : blocked("animation-id-must-match-rw002-source-static-contract");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");

export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");

export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");

export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
