/**
 * Internal VB004 source-static Layer A facts.
 *
 * This module is deliberately inert. It binds observations to exact source
 * and audit bytes without providing playback, rendering, host emulation, or
 * any acceptance path.
 */

export const COURSE_G04_L11_VB_004_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-004" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB04.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB04.fla";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "46c6d94e6646a9f799d8f8625c3dec6c1e9fcf8bdcac57cc2d0fdbfa59404608";
const SOURCE_FLA_SHA256 =
  "df23d8626433a8a127afdbfbfbd0773e73997ddd6997fa22d32c60e2c126435c";

/** Exactly the ordered 21-member source-static evidence closure. */
export const COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 65_498, sha256: SOURCE_SHA256},
  sourceFla: {path: SOURCE_FLA_PATH, bytes: 367_616, sha256: SOURCE_FLA_SHA256},
  lessonXml: {path: LESSON_XML_PATH, bytes: 10_085, sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a"},
  lessonReleases: {path: "catalog/lesson-releases.json", bytes: 145_216, sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511"},
  migrationManifest: {path: "migrations/course-g04-l11-vb-004/migration.json", bytes: 7_014, sha256: "c30c696cf3a1f1881333c664deee78b71cead4e517690789538f8ccea77a2610"},
  machineReport: {path: "migrations/course-g04-l11-vb-004/audit/machine/report.json", bytes: 12_252, sha256: "bccd569feded32a69d752afe043b2545a70ff58e32a643e067a2d6f5551cd6de"},
  ffdecHeader: {path: "migrations/course-g04-l11-vb-004/audit/machine/ffdec-header.txt", bytes: 187, sha256: "2efd3936fcfa39d5dd6c8583338551c1a5529cf39adf1ef45935a7d83b150913"},
  ffdecScriptIndex: {path: "migrations/course-g04-l11-vb-004/audit/machine/ffdec-script-index.txt", bytes: 337, sha256: "df75681c0e6706d44918f54f9cdc00742ace1f41c004e251155f1d9d9a215e23"},
  ffdecScripts: {path: "migrations/course-g04-l11-vb-004/audit/machine/ffdec-scripts.txt.gz", bytes: 286, sha256: "72ca1af7fb0b9b4b67746595ba466b402d1bc031af281574efe867d4e1d0cf41", uncompressedBytes: 922, uncompressedSha256: "e065a50b2c0e30ad795266b515bf31381c3816c5bc28f56269bb6dfa2eb92419"},
  ffdecTags: {path: "migrations/course-g04-l11-vb-004/audit/machine/ffdec-tags.txt.gz", bytes: 21_790, sha256: "8686213e5c5921e8bef2c3caad34169c08c46d08df705cf64088a6af4e1df333", uncompressedBytes: 88_521, uncompressedSha256: "176c56e4d88945d61aca6f4c2b0dfefec68e7a62ca37e1dcd197abb8be406023"},
  frameDomainCandidates: {path: "migrations/course-g04-l11-vb-004/audit/machine/swf-frame-domain-candidates.json", bytes: 2_176, sha256: "f063e92aaadb2cc0a00a0588720aa39bd4166e0207a2e097dbd6167c02c18518"},
  swfmillSummary: {path: "migrations/course-g04-l11-vb-004/audit/machine/swfmill-summary.json", bytes: 2_393, sha256: "ebff30792cea1bcedbbdaffaa02d0503fb6a30c2c9ac4a60e775d0c862dd3ac9"},
  swfmillXml: {path: "migrations/course-g04-l11-vb-004/audit/machine/swfmill.xml.gz", bytes: 74_441, sha256: "7fc538132cedbc0f376310c758be921792b1563b74a210b0f459119b6820ff73", uncompressedBytes: 294_973, uncompressedSha256: "016cf78dcc28369de86a0b1579d226a9b428f4517ee157d1f5f5b4e6ab875ba1"},
  scenarioInventory: {path: "migrations/course-g04-l11-vb-004/audit/scenario-inventory.json", bytes: 133_079, sha256: "d6e1b2057c3d0975e2f0352f691955e974b94afab9044dc518ac2ff23978c291"},
  frameDomainDisposition: {path: "migrations/course-g04-l11-vb-004/audit/frame-domain-disposition.json", bytes: 11_859, sha256: "1ab781b186cf915a35db554a9b5b37583ed7ee44dbac0e1174dd2718ad617995"},
  dependencyScope: {path: "migrations/course-g04-l11-vb-004/audit/runtime-dependency-scope.json", bytes: 2_714, sha256: "3d13d99d046c516ece06ebba9ef6446ad95a8adc658991511137b64172366503"},
  audioEvidence: {path: "migrations/course-g04-l11-vb-004/audit/audio-runtime-evidence.json", bytes: 9_843, sha256: "77effe94579a391aa17d367e6e19dc4c57a6bf18d1065346f29ab1863586a4e9"},
  audioInventory: {path: "migrations/course-g04-l11-vb-004/audio-inventory.csv", bytes: 696, sha256: "69c77f3b1f0235b43a1d498c85428cc3622e7fc3bf299e3e095093fcefb03c17"},
  fullFrameCoverage: {path: "migrations/course-g04-l11-vb-004/evidence/full-frame-coverage.json", bytes: 2_039, sha256: "7b8faca0a6422df2a4d3403112157646ed7087362c9ecd43d68309a77fe48e22"},
  strictReadiness: {path: "migrations/course-g04-l11-vb-004/audit/strict-readiness.json", bytes: 17_450, sha256: "178848b36f45cca0d2ace6fb1663a370ae69b24f659609a5894ba0e255000da7"},
  structuralRootFrames: {path: "migrations/course-g04-l11-vb-004/baseline/ffdec-root-frames.json", bytes: 3_563, sha256: "9ebddcfc38d50b0c52c75994eeff2ddec0aab36ea363fcdbc1dc17ac60275d02"},
} as const);

const ORDERED_RELEASE_ANIMATION_IDS = deepFreeze([
  "course-g04-l11-ir-001", "course-g04-l11-rw-002", "course-g04-l11-rw-003", "course-g04-l11-rw-004",
  "course-g04-l11-vb-002", "course-g04-l11-vb-003", "course-g04-l11-vb-004", "course-g04-l11-vb-005",
  "course-g04-l11-vb-006", "course-g04-l11-vb-007", "course-g04-l11-vb-008", "course-g04-l11-vb-009",
  "course-g04-l11-vb-010", "course-g04-l11-in-002", "course-g04-l11-in-003", "course-g04-l11-in-004",
  "course-g04-l11-in-005", "course-g04-l11-in-006", "course-g04-l11-in-007", "course-g04-l11-in-008",
  "course-g04-l11-in-009", "course-g04-l11-in-010", "course-g04-l11-in-011", "course-g04-l11-in-012",
  "course-g04-l11-in-013", "course-g04-l11-ti-002", "course-g04-l11-ti-003", "course-g04-l11-ti-004",
  "course-g04-l11-ti-005", "course-g04-l11-ti-006", "course-g04-l11-ti-007", "course-g04-l11-gs-002",
  "course-g04-l11-gs-003", "course-g04-l11-ts-002", "course-g04-l11-ts-003", "course-g04-l11-ts-004",
  "course-g04-l11-ts-005", "course-g04-l11-ts-006", "course-g04-l11-ts-007", "course-g04-l11-ts-008",
  "course-g04-l11-fq-001", "course-g04-l11-fq-002", "course-g04-l11-fq-003", "shell-course-g04-l11-index-local",
] as const);

export const COURSE_G04_L11_VB_004_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_004_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.sourceSwf,
    fla: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.sourceFla,
    pairedFlaStatus: "present",
    provenance: "owner-provided",
    aliasOf: null,
    variantOf: null,
  },
  evidenceLanes: {
    machine: {
      auditStatus: "partial",
      sourceHashMatchesBeforeAndAfter: true,
      flaHashMatchesBeforeAndAfter: true,
      authoringInspectionStatus: "not-performed-by-this-script",
    },
    perFileAuthoring: {
      required: true,
      status: "not-complete-legacy-conversion-dialog",
      comprehensiveCurrentContract: false,
      strictAcceptanceEffect: false,
      blocker: "Adobe Animate 2021 is installed and its disposable-document JSFL probe passes, but the legacy ActionScript conversion dialog prevents an unattended, hash-bound per-file FLA audit. Tool availability and a blank-document probe do not clear this migration gate.",
    },
    lanesAreDistinct: true,
  },
  lessonXml: {
    activePageCount: 43,
    subtitleCount: 19,
    activeOrdinal: 7,
    pageLine: 47,
    exactPageText: "<Page Title=\"Y-axis/Vertical\" RandomAudio=\"\" BGText=\"\">VB/L11VB04.swf</Page>",
    subtitleLine: 57,
    exactSubtitleText: "<SubPageTitle EngSubTitleName=\"3. Y-axis/Vertical\" SpanSubTitleName=\"Eje vertical y\" SubTitleButtonName=\"L11VB04\">VB/L11VB04.swf</SubPageTitle>",
    uniqueActivePageOccurrence: true,
    uniqueSubtitleOccurrence: true,
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    expectedCounts: {activeXmlReferencedPages: 43, courseShells: 1, members: 44, shards: 3},
    shards: [
      {shardId: "g04-l11-host-language", batchId: "g04-l11-host-language", ordinal: 1, parallelGroup: "g04-l11-mvp", memberCount: 14, developmentPrerequisites: []},
      {shardId: "g04-l11-instruction", batchId: "g04-l11-instruction", ordinal: 2, parallelGroup: "g04-l11-mvp", memberCount: 12, developmentPrerequisites: []},
      {shardId: "g04-l11-practice-assessment", batchId: "g04-l11-practice-assessment", ordinal: 3, parallelGroup: "g04-l11-mvp", memberCount: 18, developmentPrerequisites: []},
    ],
    orderedAnimationIds: ORDERED_RELEASE_ANIMATION_IDS,
    member: {
      ordinal: 7,
      animationId: COURSE_G04_L11_VB_004_STATIC_ANIMATION_ID,
      assetId: "swf-" + SOURCE_SHA256,
      releaseRole: "active-xml-referenced-page",
      batchId: "g04-l11-host-language",
      shardId: "g04-l11-host-language",
      source: {path: "HELP_COURSES/ELMGR4/L11/VB/L11VB04.swf", sha256: SOURCE_SHA256},
      xmlOccurrence: 7,
    },
  },
  runtimeHeader: {
    signature: "CWS",
    version: 6,
    compression: "ZLIB",
    physicalSourceBytes: 65_498,
    declaredUncompressedBytes: 75_244,
    inflatedBodyBytes: 75_236,
    reconstructedUncompressedBytes: 75_244,
    actionScriptVersion: "AS1/2",
    stage: {
      xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000,
      widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20,
      widthPixels: 800, heightPixels: 600,
      fractionalNativeStage: false, roundingApplied: false, exactIntegerConversion: true,
    },
    fps: 12,
    rootFrameCount: 10,
    durationMilliseconds: 833.3333333333334,
    backgroundColor: "#b8d8f7",
  },
  migration: {
    status: "preserved",
    rendering: "undecided",
    route: "",
    routeFile: "",
    component: "",
    registryModule: "",
    timelineModule: "",
    testFile: "",
    standalonePackage: "",
    defaultFrameDomainId: "root",
    registered: false,
    currentJavascriptImplementation: false,
  },
} as const);

export const COURSE_G04_L11_VB_004_STATIC_TAG_COUNTS = deepFreeze({
  SetBackgroundColor: 1, DoAction: 3, ShowFrame: 168, FrameLabel: 1,
  DefineFont2: 4, DefineText: 42, PlaceObject2: 241, DefineSprite: 2,
  DefineMorphShape: 5, DefineShape: 11, DefineShape2: 2, DefineShape3: 1,
  DefineButton2: 4, Button: 8, Condition: 4, SoundStreamHead: 1,
  SoundStreamBlock: 150, RemoveObject2: 20, End: 3,
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {depth: "2", frame: 6, hasClipActions: false, name: "Mc_Page_Title", objectId: "5", replace: "0", tag: "PlaceObject2"},
  {depth: "4", frame: 6, hasClipActions: false, name: "animation", objectId: "71", replace: "0", tag: "PlaceObject2"},
] as const);
const ROOT_CONTROL_REASONS = deepFreeze({
  1: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"],
  6: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"],
  10: ["terminal-structural-frame"],
} as const);

export const COURSE_G04_L11_VB_004_STATIC_ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    return {
      kind: "source-static-root-frame-fact",
      frameDomainId: "root",
      frame,
      validDeclaredFrame: true,
      controlReasons: frame === 1 ? ROOT_CONTROL_REASONS[1] : frame === 6 ? ROOT_CONTROL_REASONS[6] : frame === 10 ? ROOT_CONTROL_REASONS[10] : [],
      label: frame === 6 ? "begin" : null,
      namedPlacements: frame === 6 ? ROOT_NAMED_PLACEMENTS : [],
      legacyActionSemanticsExecuted: false,
      naturalEntryProven: false,
      visualAuthorityEstablished: false,
    } as const;
  }),
);

export const COURSE_G04_L11_VB_004_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

const sourceTimelineEvidence = (timelineId: string) => ({artifactId: "swfmill-xml", timelineId} as const);
const structuralEndpoint = (timelineId: string, frame: number, reasons: readonly string[], duplicate = false) => ({
  frame,
  reasons,
  evidence: duplicate ? [sourceTimelineEvidence(timelineId), sourceTimelineEvidence(timelineId)] : [sourceTimelineEvidence(timelineId)],
} as const);
const scriptedEndpoint = (timelineId: string, frame: number, reasons: readonly string[], script: string, lineStart: number, lineEnd: number) => ({
  frame,
  reasons,
  evidence: [
    sourceTimelineEvidence(timelineId), sourceTimelineEvidence(timelineId),
    {artifactId: "ffdec-scripts", script, lineStart, lineEnd},
    {artifactId: "ffdec-scripts", script, lineStart, lineEnd},
  ],
} as const);

/** Exact three-row projection of the generated scenario inventory. */
export const COURSE_G04_L11_VB_004_STATIC_SCENARIO_TIMELINE_INVENTORY = deepFreeze([
  {
    timelineId: "root", objectId: null, frameCount: 10,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 10, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "root",
    controlStates: [
      scriptedEndpoint("root", 1, ROOT_CONTROL_REASONS[1], "frame_1/DoAction.as", 32, 34),
      scriptedEndpoint("root", 6, ROOT_CONTROL_REASONS[6], "frame_6/DoAction.as", 36, 37),
      structuralEndpoint("root", 10, ROOT_CONTROL_REASONS[10]),
    ],
    frameLabels: [{frame: 6, label: "begin"}],
    namedPlacements: ROOT_NAMED_PLACEMENTS,
    evidence: sourceTimelineEvidence("root"),
  },
  {
    timelineId: "sprite-5", objectId: "5", frameCount: 1,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 1, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [structuralEndpoint("sprite-5", 1, ["initial-one-indexed-frame", "terminal-structural-frame"], true)],
    frameLabels: [], namedPlacements: [], evidence: sourceTimelineEvidence("sprite-5"),
  },
  {
    timelineId: "sprite-71", objectId: "71", frameCount: 157,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 157, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [
      structuralEndpoint("sprite-71", 1, ["initial-one-indexed-frame"]),
      scriptedEndpoint("sprite-71", 157, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], "DefineSprite_71/frame_157/DoAction.as", 29, 30),
    ],
    frameLabels: [], namedPlacements: [], evidence: sourceTimelineEvidence("sprite-71"),
  },
] as const);

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.scenarioInventory.sha256,
  swfmillArtifactId: "swfmill-xml",
  swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.swfmillXml.sha256,
} as const);
const ROOT_TO_5 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-5", sourceObjectId: "5", frame: 6, depth: "2", instanceName: "Mc_Page_Title", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const ROOT_TO_71 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-71", sourceObjectId: "71", frame: 6, depth: "4", instanceName: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const unresolvedBasis = "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.";

export const COURSE_G04_L11_VB_004_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
  {
    timelineId: "root", sourceTimelineId: "root", sourceObjectId: null, frameCount: 10, structuralReachability: "root",
    rootPlacement: {status: "root-timeline", namedPlacementPath: []}, knownNamedParentPlacements: [],
    declaredFrameDomains: [{frameDomainId: "root", kind: "root", sourceTimelineId: "root", sourceInstanceId: "", parentFrameDomainId: null, parentEntryFrame: null, localEntryFrame: null, frameCount: 10, role: ""}],
    disposition: "declared-frame-domain",
    dispositionBasis: "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains.",
    riskAssessment: {level: "none", independentFrameDomainCandidate: false, signals: ["source-timeline-already-declared-as-frame-domain"], interpretation: "No undeclared-domain triage signal; fidelity still depends on the declared domain's required runtime and visual evidence."},
    staticSignals: {controlStateCount: 3, frameLabelCount: 1, namedChildPlacementCount: 2}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-5", sourceTimelineId: "sprite-5", sourceObjectId: "5", frameCount: 1, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_5]}, knownNamedParentPlacements: [ROOT_TO_5], declaredFrameDomains: [],
    disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "review", independentFrameDomainCandidate: false, signals: ["undeclared-structurally-root-reachable-timeline", "direct-named-root-placement"], interpretation: "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain."},
    staticSignals: {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-71", sourceTimelineId: "sprite-71", sourceObjectId: "71", frameCount: 157, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_71]}, knownNamedParentPlacements: [ROOT_TO_71], declaredFrameDomains: [],
    disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "high", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"], interpretation: "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent."},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
] as const);

export const COURSE_G04_L11_VB_004_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 3, enumeratedTimelineCount: 3, reachableChildTimelineCount: 2, excludedNotProvenTimelineCount: 0,
  dispositionCounts: {"declared-frame-domain": 1, "composite-child-with-parent": 0, "independent-required": 0, nonvisual: 0, unresolved: 2},
  highRiskIndependentCandidateCount: 1,
  highRiskIndependentCandidates: [{timelineId: "sprite-71", sourceObjectId: "71", frameCount: 157, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"]}],
} as const);

const rootRequirement = (language: "en" | "es", entryStateSha256: string) => ({
  requirementId: "req-default-root-" + language, scenario: "default", frameDomainId: "root", traceId: "default-root-" + language,
  language, seed: "0", requiredRange: {firstFrame: 1, lastFrame: 10}, entryState: {kind: "initial-load", language}, entryStateSha256,
  baselineAuthorityRequirement: "original-runtime-frame-accurate", baselineAuthority: "unresolved", status: "pending", capturedFrameCount: 0,
  missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], baselineCaptureManifest: "", baselineCaptureManifestSha256: "",
  captureManifest: "", captureManifestSha256: "", metricsFile: "", metricsSha256: "",
} as const);

export const COURSE_G04_L11_VB_004_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  rootRequirement("en", "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1"),
  rootRequirement("es", "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067"),
] as const);

const buttonBody = (keyAttribute: string) =>
  "on(release){\n   _global.KeyAttribute = \"" + keyAttribute + "\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}";
const action = (id: string, script: string, body: string, bodyBytes: number, bodySha256: string, lineStart: number, lineEnd: number, scope: Readonly<{kind: "root" | "sprite" | "button-definition"; objectId: string | null; frame: number | null}>, releaseEvent: boolean) => ({
  kind: "source-static-action", id, script, body, bodyBytes, bodySha256, lineStart, lineEnd, scope,
  event: releaseEvent ? "release" : null,
  legacyActionScriptExecuted: false, hostCallsExecuted: false, naturalInteractionProven: false,
} as const);

/** All seven exact AVM1 bodies are inert strings and are never evaluated. */
export const COURSE_G04_L11_VB_004_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_46/BUTTONCONDACTION on(release).as", buttonBody("Y-axis"), 115, "c5598698b7453ddd7fca28b5ec96574bf788312e79731f66de1662cba25db329", 2, 6, {kind: "button-definition", objectId: "46", frame: null}, true),
  action("script-0002", "DefineButton2_47/BUTTONCONDACTION on(release).as", buttonBody("Vertical"), 117, "48a3bbc99b9238983028dc1999b187a416ea0eb5a7f95eb20e63e9726f00bfcc", 9, 13, {kind: "button-definition", objectId: "47", frame: null}, true),
  action("script-0003", "DefineButton2_48/BUTTONCONDACTION on(release).as", buttonBody("Number line"), 120, "9af2b73747b39522e5b0be7156bc4b0939d87fed3e02176af9dd96a20350a86e", 16, 20, {kind: "button-definition", objectId: "48", frame: null}, true),
  action("script-0004", "DefineButton2_49/BUTTONCONDACTION on(release).as", buttonBody("Coordinate grid"), 124, "89ff000d8f5676a6d549683f1ca696a572d21fbd8cd5308596ddb74fd8b2bdb6", 23, 27, {kind: "button-definition", objectId: "49", frame: null}, true),
  action("script-0005", "DefineSprite_71/frame_157/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 30, 30, {kind: "sprite", objectId: "71", frame: 157}, false),
  action("script-0006", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 33, 34, {kind: "root", objectId: null, frame: 1}, false),
  action("script-0007", "frame_6/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 37, 37, {kind: "root", objectId: null, frame: 6}, false),
] as const);

const BUTTON_RELEASE_CONDITION = deepFreeze({
  next: "0", menuEnter: "0", pointerReleaseOutside: "0", pointerDragEnter: "0", pointerDragLeave: "0",
  pointerReleaseInside: "1", pointerPush: "0", pointerLeave: "0", pointerEnter: "0", key: "0", menuLeave: "0",
} as const);
const SHARED_BUTTON_GEOMETRY = deepFreeze({
  hitShapeObjectId: "45",
  hitShapeBounds: {left: -1_128, right: 1_128, top: -310, bottom: 310},
  hitRecord: {hitTest: "1", down: "0", over: "0", up: "0", objectId: "45", depth: "1", transform: {transX: "0", transY: "0"}},
  inertRecord: {hitTest: "0", down: "0", over: "0", up: "0"},
} as const);
const buttonPlacement = (objectId: string, depth: string, scaleX: string, transX: string, frame: 9 | 64, morph: "8" | "63") => ({
  timelineId: "sprite-71", frame, replace: "0", objectId, depth, morph,
  transform: {scaleX, scaleY: "0.6674957275390625", transX, transY: "-2143"},
} as const);
const buttonTarget = (scriptId: string, buttonObjectId: string, keyAttribute: string, depth: string, scaleX: string, transX: string) => ({
  scriptId, buttonObjectId, menu: "0", buttonsSize: "10", releaseEvent: "pointerReleaseInside", keyAttribute,
  conditions: [BUTTON_RELEASE_CONDITION], geometry: SHARED_BUTTON_GEOMETRY,
  placements: [buttonPlacement(buttonObjectId, depth, scaleX, transX, 9, "8"), buttonPlacement(buttonObjectId, depth, scaleX, transX, 64, "63")],
  actionsExecuted: false,
} as const);

export const COURSE_G04_L11_VB_004_STATIC_BUTTON_TARGETS = deepFreeze([
  buttonTarget("script-0001", "46", "Y-axis", "53", "0.5299682617187500", "-4144"),
  buttonTarget("script-0002", "47", "Vertical", "55", "0.6185607910156250", "-1684"),
  buttonTarget("script-0003", "48", "Number line", "57", "1.000183105468750", "205"),
  buttonTarget("script-0004", "49", "Coordinate grid", "59", "1.284423828125000", "3785"),
] as const);

/** Four and only four observed host-facing blockers. */
export const COURSE_G04_L11_VB_004_STATIC_BLOCKED_HOST_DEPENDENCIES = deepFreeze([
  {sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")", status: "BLOCKED_UNVERIFIED", blocker: "The root preloader handoff has no authorized natural-entry runtime evidence.", facts: null},
  {sourceToken: "_global.KeyAttribute", status: "BLOCKED_UNVERIFIED", blocker: "Four release handlers write shared KeyAttribute state without a bound host/default or authorized execution evidence.", facts: null},
  {sourceToken: "_root.DoHyperLinks", status: "BLOCKED_UNVERIFIED", blocker: "The host hyperlink call appears in four release handlers without authorized natural-entry evidence.", facts: null},
  {sourceToken: "_root.animation_mc.animation.stop", status: "BLOCKED_UNVERIFIED", blocker: "The nested host animation stop target lacks an authorized host binding and natural interaction evidence.", facts: null},
] as const);

export const COURSE_G04_L11_VB_004_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 7, buttonReleaseHandlerCount: 4, doActionCount: 3,
  buttonDefinitionCount: 4, externalCallCandidateCount: 0, hostDependencyTokenCount: 4,
  actionScriptExecuted: false, hostCallsExecuted: false, naturalInteractionProven: false,
  sourceControlsRendered: false, pointerEventsEnabled: false,
} as const);

export const COURSE_G04_L11_VB_004_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false,
  manifestReasonNotRequired: "No catalog association was found; manual SWF/FLA timeline audit must confirm that audio is not required.",
  manifestAudioRequiredConflict: "migration.audio.required is false, but the audit found 0 exact external track(s) and 1 timed embedded sound asset/stream(s); update only after runtime reachability/listening review.",
  strictNoAudioConclusionForbidden: true,
  externalExactAssociations: [], externalCandidateOnlyAssociations: [],
  externalExactAssociationCount: 0, externalCandidateOnlyCount: 0, externalMissingExpectedCount: 0,
  embeddedStreams: [{
    id: "embedded-stream-0001", streamIndex: 1, context: {kind: "sprite", characterId: 71},
    contextLabel: "sprite:71", contextDeclaredFrames: 157, headFrame: 1, firstBlockFrame: 8, lastBlockFrame: 157,
    syncMode: "stream", stop: false, loops: null, compressionCode: 2, format: "mp3",
    playbackSampleRateHz: 22_050, sampleRateHz: 22_050, sampleSizeBits: 16, channels: 1,
    nominalSamplesPerBlock: 1_837, blockCount: 150, blocksWithDecodedSampleCount: 150,
    totalDecodedSamples: 275_328, seekSamplesMin: 0, seekSamplesMax: 1_673,
    durationSeconds: 12.486531, durationMs: 12_487,
    durationBasis: "sum-of-mp3-soundstreamblock-sample-counts", language: "und",
    rootCueFrame: null, startSemantics: "interaction-state",
    rootCueResolved: false, runtimeReachabilityVerified: false, originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false, synchronizationVerified: false, stopBehaviorVerified: false,
    replayBehaviorVerified: false, playable: false,
  }],
  inventory: {
    rowCount: 1, exactExternalRows: 0, embeddedRows: 1,
    header: ["cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id", "start_semantics", "duration_ms", "format", "channels", "sample_rate_hz", "source_character_id", "notes"],
    row: ["embedded-stream-0001", "und", SOURCE_SWF_PATH, SOURCE_SHA256, "", "", "interaction-state", "12487", "swf-mp3-stream", "1", "22050", "71", "SoundStream in sprite:71, local head frame 1, first block frame 8, 150 blocks, sync=stream; sum-of-mp3-soundstreamblock-sample-counts; start_semantics=interaction-state; root cue depends on sprite placement/interaction and remains unresolved; no root frame is asserted; spoken language/content requires listening."],
  },
  acceptance: {
    authoritativeListeningComplete: false, hostStateTraversalComplete: false, synchronizationComplete: false,
    cueTriggerResolved: false, timingResolved: false, durationResolved: false,
    runtimeReachabilityVerified: false, originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false, humanAudioReviewComplete: false, ownerAcceptanceComplete: false,
    strictMigrationComplete: false, publicationAuthorized: false, strictAudioAcceptance: false,
  },
} as const);

export const COURSE_G04_L11_VB_004_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  dependencyScope: {
    artifactFingerprintSha256: "8067af6673c3f124cd23d266fd65aaa5d79348e300a22daf12d328060bb224f9",
    status: "acceptance-neutral-static-runtime-dependency-scope",
    scopeLimitedToShellForensicQuestion: true,
    keyTermsStatus: "not-applied-to-this-non-shell-workspace",
    runtimeDependencyClosure: false,
  },
  pageHandlerCount: 4,
  shellScopeArtifactConflictsWithPageHandlers: true,
  pageHandlerExecutionProven: false,
  pageDependencyEstablished: false,
  exactMissingDependencies: [
    {canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml", path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml", language: "en", status: "BLOCKED_NO_EXACT_SOURCE_BYTES", present: false, sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
    {canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml", path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml", language: "es", status: "BLOCKED_NO_EXACT_SOURCE_BYTES", present: false, sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
  ],
  gradeWideRetrievalLeads: [
    {canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", bytes: 378_783, sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
    {canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml", path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml", bytes: 374_466, sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
  ],
  leadsAreReplacement: false, runtimeResolutionVerified: false, ownerAccepted: false,
  strictCompletion: false, publication: false,
} as const);

export const COURSE_G04_L11_VB_004_STATIC_STRUCTURAL_BASELINE_FRAMES = deepFreeze([
  {frame: 1, file: "1.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 2, file: "2.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 3, file: "3.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 4, file: "4.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 5, file: "5.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 6, file: "6.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 7, file: "7.png", sha256: "0b63392399ba15cce6e30733d4c3e5387433f5b84fe06e36cec49a02bc4fb397", bytes: 12_002, width: 800, height: 600},
  {frame: 8, file: "8.png", sha256: "aac4462d5e4226d4cda75eead8dee26cec5f9e069221875952f44dbb133cac9e", bytes: 12_278, width: 800, height: 600},
  {frame: 9, file: "9.png", sha256: "c99e36e947acb72b8394a340da92adcc00762bc82d4f3b44ca9b51d502072c59", bytes: 11_650, width: 800, height: 600},
  {frame: 10, file: "10.png", sha256: "48afe5deb690afefd7fc2500b01423a62b392e1c47cda94ed21db3f9a9140290", bytes: 12_557, width: 800, height: 600},
] as const);

export const COURSE_G04_L11_VB_004_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
  status: "OPEN_RECORDED", accepted: false, baselineRationaleRejected: true,
  sourceStaticLayerABlocked: false, strictAcceptanceEffect: "blocked-unresolved",
  exactRejectedFractionalRationale: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  affectedArtifacts: [
    {path: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.path, bytes: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.bytes, sha256: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.sha256, field: "runtime.rasterization.rationale"},
    {path: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.strictReadiness.path, bytes: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.strictReadiness.bytes, sha256: COURSE_G04_L11_VB_004_STATIC_EVIDENCE_CLOSURE.strictReadiness.sha256, field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale"},
  ],
  sourceAuthoritativeStage: {xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000, widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20, widthPixels: 800, heightPixels: 600, fractional: false, roundingApplied: false, exactIntegerConversion: true},
  captureRaster: {width: 800, height: 600, matchesAuthoredStageExactly: true, roundingApplied: false},
  structuralFrames: COURSE_G04_L11_VB_004_STATIC_STRUCTURAL_BASELINE_FRAMES,
  originalRuntimeAuthorityEstablished: false, fidelityEstablished: false,
  strictCompletionEstablished: false, publicationEstablished: false,
} as const);

export const COURSE_G04_L11_VB_004_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true, sourceBytesRehashed: true, sourceStaticLayerABlocked: false,
  registered: false, javascriptImplementation: false, rendererExists: false,
  runtimeDependencyClosure: false, originalRuntimeFidelity: false, pixelComparison: false,
  audioCorrectnessOrSynchronizationAccepted: false, humanVisualAccepted: false,
  ownerAccepted: false, strictCompletion: false, releaseAuthorized: false, publication: false,
  strictAcceptanceEffect: "blocked-unresolved",
} as const);

const validAnimation = (animationId: unknown): boolean =>
  animationId === COURSE_G04_L11_VB_004_STATIC_ANIMATION_ID;

export const getStaticSourceFacts = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_004_STATIC_SOURCE_FACTS : blocked("animation-id-must-match-vb004-source-static-contract");
export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  validAnimation(animationId) && frameDomainId === "root" ? COURSE_G04_L11_VB_004_STATIC_DECLARED_ROOT_DOMAIN : blocked("animation-id-and-frame-domain-must-match-vb004-source-static-contract");
export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  validAnimation(animationId) && typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
    ? COURSE_G04_L11_VB_004_STATIC_ROOT_FRAME_FACTS[frame - 1]!
    : blocked("animation-id-and-one-indexed-root-frame-must-match-vb004-source-static-contract");
export const getStaticScenarioTimeline = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb004-source-static-contract");
  return COURSE_G04_L11_VB_004_STATIC_SCENARIO_TIMELINE_INVENTORY.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb004-source-static-contract");
};
export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb004-source-static-contract");
  return COURSE_G04_L11_VB_004_STATIC_TIMELINE_DISPOSITIONS.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb004-source-static-contract");
};
export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) => {
  if (!validAnimation(animationId) || typeof scriptId !== "string") return blocked("animation-id-and-script-id-must-match-vb004-source-static-contract");
  return COURSE_G04_L11_VB_004_STATIC_ACTION_RECORDS.find((entry) => entry.id === scriptId)
    ?? blocked("animation-id-and-script-id-must-match-vb004-source-static-contract");
};
export const getStaticButtonTarget = (animationId: unknown, buttonObjectId: unknown) => {
  if (!validAnimation(animationId) || typeof buttonObjectId !== "string") return blocked("animation-id-and-button-object-id-must-match-vb004-source-static-contract");
  return COURSE_G04_L11_VB_004_STATIC_BUTTON_TARGETS.find((entry) => entry.buttonObjectId === buttonObjectId)
    ?? blocked("animation-id-and-button-object-id-must-match-vb004-source-static-contract");
};
export const getStaticRootRequirement = (animationId: unknown, requirementId: unknown, language: unknown, scenario: unknown) => {
  if (!validAnimation(animationId) || typeof requirementId !== "string" || typeof language !== "string" || scenario !== "default") return blocked("animation-id-requirement-language-and-scenario-must-match-vb004-source-static-contract");
  return COURSE_G04_L11_VB_004_STATIC_ROOT_REQUIREMENTS.find((entry) => entry.requirementId === requirementId && entry.language === language)
    ?? blocked("animation-id-requirement-language-and-scenario-must-match-vb004-source-static-contract");
};
export const getStaticAudioObligations = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_004_STATIC_AUDIO_OBLIGATIONS : blocked("animation-id-must-match-vb004-source-static-contract");
export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_004_STATIC_BLOCKED_HOST_DEPENDENCIES : blocked("animation-id-must-match-vb004-source-static-contract");
export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_004_STATIC_KEY_TERMS_BOUNDARY : blocked("animation-id-must-match-vb004-source-static-contract");
export const getStaticEvidenceBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_004_STATIC_EVIDENCE_BOUNDARY : blocked("animation-id-must-match-vb004-source-static-contract");
export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  validAnimation(animationId) && conflictId === COURSE_G04_L11_VB_004_STATIC_BASELINE_RATIONALE_CONFLICT.id
    ? COURSE_G04_L11_VB_004_STATIC_BASELINE_RATIONALE_CONFLICT
    : blocked("animation-id-and-conflict-id-must-match-vb004-source-static-contract");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");
export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");
export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");
export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
