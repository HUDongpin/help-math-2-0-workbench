/**
 * Internal VB006 source-static Layer A facts.
 *
 * This module is deliberately inert and unregistered. It binds observations
 * to exact source and audit bytes without playback, rendering, host emulation,
 * legacy-script execution, audio output, or any acceptance path.
 */

export const COURSE_G04_L11_VB_006_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-006" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB06.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB06.fla";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "12701c2e3e0edd8fd1bafbb942a8ff237cc931e0ab37e9a4f370df0060eb4a2e";
const SOURCE_FLA_SHA256 =
  "aecd47a8ae6943a51fc7d488628294c0640f13ba219c19165bb90350c590fc81";

/** Exactly the ordered 21-member source-static evidence closure. */
export const COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 183_837, sha256: SOURCE_SHA256},
  sourceFla: {path: SOURCE_FLA_PATH, bytes: 904_704, sha256: SOURCE_FLA_SHA256},
  lessonXml: {path: LESSON_XML_PATH, bytes: 10_085, sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a"},
  lessonReleases: {path: "catalog/lesson-releases.json", bytes: 145_216, sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511"},
  migrationManifest: {path: "migrations/course-g04-l11-vb-006/migration.json", bytes: 7_054, sha256: "da869524d053153a03504c053b0a2aae61699180a56e338daa4074cb38eff1be"},
  machineReport: {path: "migrations/course-g04-l11-vb-006/audit/machine/report.json", bytes: 12_380, sha256: "f7b11018a3fc0b770bb9fbb8a88bc8b3dbba7ca83900c26e825a9821a566a7f5"},
  ffdecHeader: {path: "migrations/course-g04-l11-vb-006/audit/machine/ffdec-header.txt", bytes: 188, sha256: "92904bf28bb032beacaa7ef2b26543ac62aea092937f01387cc4112746e23207"},
  ffdecScriptIndex: {path: "migrations/course-g04-l11-vb-006/audit/machine/ffdec-script-index.txt", bytes: 502, sha256: "2e041a10d80a9b0467af606840efe77370d61676199d7fec582414b99bb0b49a"},
  ffdecScripts: {path: "migrations/course-g04-l11-vb-006/audit/machine/ffdec-scripts.txt.gz", bytes: 305, sha256: "31097c5d3e9c37a2a6e34442c1ee3e0b5789ff3c62848433996373142cc6c72e", uncompressedBytes: 1_456, uncompressedSha256: "bfcd1b72f9563fdcd53bf4842d7fb65519a0a9ade6264b6a8ea55d08797c6589"},
  ffdecTags: {path: "migrations/course-g04-l11-vb-006/audit/machine/ffdec-tags.txt.gz", bytes: 53_075, sha256: "918fa57d3d4d87acc3168c1703ca0bc5535e36482916279f867778ceaa126f7c", uncompressedBytes: 211_163, uncompressedSha256: "29fc62282d6258084b2a6703544ed5e32b7ba731917979f41660546eacad5e21"},
  frameDomainCandidates: {path: "migrations/course-g04-l11-vb-006/audit/machine/swf-frame-domain-candidates.json", bytes: 2_176, sha256: "edc00078dfa3ed314f715f266606ee09cfa09ea4d4e14a287e44d9b13bdd1524"},
  swfmillSummary: {path: "migrations/course-g04-l11-vb-006/audit/machine/swfmill-summary.json", bytes: 2_498, sha256: "247182decd1e36bb636c7614c47e3a62ae21299580f0e8463238a59ffa1e8312"},
  swfmillXml: {path: "migrations/course-g04-l11-vb-006/audit/machine/swfmill.xml.gz", bytes: 197_248, sha256: "d5a7945d06f90c05db5e4ad65d90e21231451988f36f5cd0bcc10fff5d88db55", uncompressedBytes: 675_113, uncompressedSha256: "14e9d3b90e7e687acb3d9e7b98b64006c6193cdcad24ba24d493213c8deaf2b6"},
  scenarioInventory: {path: "migrations/course-g04-l11-vb-006/audit/scenario-inventory.json", bytes: 163_219, sha256: "f7707e8782da0cad783563658deabf8f49590d9d58f96253a2b4bffbd22306b3"},
  frameDomainDisposition: {path: "migrations/course-g04-l11-vb-006/audit/frame-domain-disposition.json", bytes: 11_859, sha256: "32f1d9b5b160b3cf6f0b96a6231e2829c5551d685789bf0c97ac7dbd6e547ac3"},
  dependencyScope: {path: "migrations/course-g04-l11-vb-006/audit/runtime-dependency-scope.json", bytes: 2_714, sha256: "e631a1b735bd333854b22a7303815a304f9439c2740a589fb55d02607e799f5f"},
  audioEvidence: {path: "migrations/course-g04-l11-vb-006/audit/audio-runtime-evidence.json", bytes: 9_873, sha256: "83bbf2fca7c5eeb363f7a08739e652eea11ee1d9dc2e7555bd37cf26bf05f67e"},
  audioInventory: {path: "migrations/course-g04-l11-vb-006/audio-inventory.csv", bytes: 696, sha256: "a62d3affbba7630596ab6a02c4420726dbeb731c114351d81a55e83b277d1f5d"},
  fullFrameCoverage: {path: "migrations/course-g04-l11-vb-006/evidence/full-frame-coverage.json", bytes: 2_039, sha256: "064e025edbc6e67e5c147686305ab7265dbb5df97b7097d5d3f349d35ee39545"},
  strictReadiness: {path: "migrations/course-g04-l11-vb-006/audit/strict-readiness.json", bytes: 17_452, sha256: "236287d73f115b0824b602eb4a028b703e9ee726961123a13a4e670764e808b0"},
  structuralRootFrames: {path: "migrations/course-g04-l11-vb-006/baseline/ffdec-root-frames.json", bytes: 3_559, sha256: "8415c09ea47c4071e21479753dca5847da3d19424a585ae18b23017ff0331fd6"},
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

export const COURSE_G04_L11_VB_006_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_006_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.sourceSwf,
    fla: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.sourceFla,
    pairedFlaStatus: "present", provenance: "owner-provided", aliasOf: null, variantOf: null,
  },
  evidenceLanes: {
    machine: {auditStatus: "partial", sourceHashMatchesBeforeAndAfter: true, flaHashMatchesBeforeAndAfter: true, authoringInspectionStatus: "not-performed-by-this-script"},
    perFileAuthoring: {
      required: true, status: "not-complete-legacy-conversion-dialog", comprehensiveCurrentContract: false,
      strictAcceptanceEffect: false,
      blocker: "Adobe Animate 2021 is installed and its disposable-document JSFL probe passes, but the legacy ActionScript conversion dialog prevents an unattended, hash-bound per-file FLA audit. Tool availability and a blank-document probe do not clear this migration gate.",
    },
    lanesAreDistinct: true,
  },
  lessonXml: {
    activePageCount: 43, subtitleCount: 19, activeOrdinal: 9, sectionLocalOrdinal: 5,
    pageLine: 49, exactPageText: "<Page Title=\"Ordered Pair/Coordinates\" RandomAudio=\"\" BGText=\"\">VB/L11VB06.swf</Page>",
    subtitleLine: 59, exactSubtitleText: "<SubPageTitle EngSubTitleName=\"5. Ordered Pair/Coordinates\" SpanSubTitleName=\"Par ordenado, coordenadas\" SubTitleButtonName=\"L11VB06\">VB/L11VB06.swf</SubPageTitle>",
    englishTitle: "Ordered Pair/Coordinates", spanishSubtitle: "Par ordenado, coordenadas",
    uniqueActivePageOccurrence: true, uniqueSubtitleOccurrence: true,
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid", releaseType: "complete-lesson", publicationMode: "atomic",
    developmentMode: "parallel-shards", expectedCounts: {activeXmlReferencedPages: 43, courseShells: 1, members: 44, shards: 3},
    shards: [
      {shardId: "g04-l11-host-language", batchId: "g04-l11-host-language", ordinal: 1, parallelGroup: "g04-l11-mvp", memberCount: 14, developmentPrerequisites: []},
      {shardId: "g04-l11-instruction", batchId: "g04-l11-instruction", ordinal: 2, parallelGroup: "g04-l11-mvp", memberCount: 12, developmentPrerequisites: []},
      {shardId: "g04-l11-practice-assessment", batchId: "g04-l11-practice-assessment", ordinal: 3, parallelGroup: "g04-l11-mvp", memberCount: 18, developmentPrerequisites: []},
    ],
    orderedAnimationIds: ORDERED_RELEASE_ANIMATION_IDS,
    member: {
      ordinal: 9, animationId: COURSE_G04_L11_VB_006_STATIC_ANIMATION_ID,
      assetId: "swf-" + SOURCE_SHA256, releaseRole: "active-xml-referenced-page",
      batchId: "g04-l11-host-language", shardId: "g04-l11-host-language",
      source: {path: "HELP_COURSES/ELMGR4/L11/VB/L11VB06.swf", sha256: SOURCE_SHA256},
      xmlOccurrence: 9,
    },
  },
  runtimeHeader: {
    signature: "CWS", version: 6, compression: "ZLIB", physicalSourceBytes: 183_837,
    declaredUncompressedBytes: 207_699, inflatedBodyBytes: 207_691, reconstructedUncompressedBytes: 207_699,
    actionScriptVersion: "AS1/2",
    stage: {
      xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000,
      widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20,
      widthPixels: 800, heightPixels: 600, fractionalNativeStage: false,
      roundingApplied: false, exactIntegerConversion: true,
    },
    fps: 12, rootFrameCount: 10, durationMilliseconds: 833.3333333333334,
    backgroundColor: "#b8d8f7",
  },
  migration: {
    status: "preserved", rendering: "undecided", route: "", routeFile: "", component: "",
    registryModule: "", timelineModule: "", testFile: "", standalonePackage: "",
    defaultFrameDomainId: "root", registered: false, currentJavascriptImplementation: false,
  },
} as const);

export const COURSE_G04_L11_VB_006_STATIC_TAG_COUNTS = deepFreeze({
  SetBackgroundColor: 1, DoAction: 3, ShowFrame: 450, FrameLabel: 1,
  DefineFont2: 3, DefineText: 29, PlaceObject2: 476, DefineSprite: 2,
  DefineMorphShape: 8, DefineShape: 17, DefineShape2: 16, DefineShape3: 3,
  DefineButton2: 7, Button: 14, Condition: 7, SoundStreamHead: 1,
  SoundStreamBlock: 436, RemoveObject2: 38, End: 3, EndAction: 10, UnknownTag: 1,
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {depth: "2", frame: 6, hasClipActions: false, name: "Mc_Page_Title", objectId: "5", replace: "0", tag: "PlaceObject2"},
  {depth: "4", frame: 6, hasClipActions: false, name: "animation", objectId: "85", replace: "0", tag: "PlaceObject2"},
] as const);
const ROOT_CONTROL_REASONS = deepFreeze({
  1: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"],
  6: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"],
  10: ["terminal-structural-frame"],
} as const);

export const COURSE_G04_L11_VB_006_STATIC_ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    return {
      kind: "source-static-root-frame-fact", frameDomainId: "root", frame,
      validDeclaredFrame: true,
      controlReasons: frame === 1 ? ROOT_CONTROL_REASONS[1] : frame === 6 ? ROOT_CONTROL_REASONS[6] : frame === 10 ? ROOT_CONTROL_REASONS[10] : [],
      label: frame === 6 ? "begin" : null,
      namedPlacements: frame === 6 ? ROOT_NAMED_PLACEMENTS : [],
      legacyActionSemanticsExecuted: false, naturalEntryProven: false, visualAuthorityEstablished: false,
    } as const;
  }),
);

export const COURSE_G04_L11_VB_006_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
  kind: "source-static-declared-frame-domain", frameDomainId: "root", sourceTimelineId: "root",
  firstFrame: 1, lastFrame: 10, frameCount: 10, declaredByManifest: true,
  sourceStaticOnly: true, naturalEntryProven: false, visualAuthorityEstablished: false,
} as const);

const sourceTimelineEvidence = (timelineId: string) => ({artifactId: "swfmill-xml", timelineId} as const);
const structuralEndpoint = (timelineId: string, frame: number, reasons: readonly string[], duplicate = false) => ({
  frame, reasons,
  evidence: duplicate ? [sourceTimelineEvidence(timelineId), sourceTimelineEvidence(timelineId)] : [sourceTimelineEvidence(timelineId)],
} as const);
const scriptedEndpoint = (timelineId: string, frame: number, reasons: readonly string[], script: string, lineStart: number, lineEnd: number) => ({
  frame, reasons,
  evidence: [sourceTimelineEvidence(timelineId), sourceTimelineEvidence(timelineId), {artifactId: "ffdec-scripts", script, lineStart, lineEnd}, {artifactId: "ffdec-scripts", script, lineStart, lineEnd}],
} as const);

export const COURSE_G04_L11_VB_006_STATIC_SCENARIO_TIMELINE_INVENTORY = deepFreeze([
  {
    timelineId: "root", objectId: null, frameCount: 10,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 10, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "root",
    controlStates: [
      scriptedEndpoint("root", 1, ROOT_CONTROL_REASONS[1], "frame_1/DoAction.as", 53, 55),
      scriptedEndpoint("root", 6, ROOT_CONTROL_REASONS[6], "frame_6/DoAction.as", 57, 58),
      structuralEndpoint("root", 10, ROOT_CONTROL_REASONS[10]),
    ],
    frameLabels: [{frame: 6, label: "begin"}], namedPlacements: ROOT_NAMED_PLACEMENTS,
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
    timelineId: "sprite-85", objectId: "85", frameCount: 439,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 439, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [
      structuralEndpoint("sprite-85", 1, ["initial-one-indexed-frame"]),
      scriptedEndpoint("sprite-85", 439, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], "DefineSprite_85/frame_439/DoAction.as", 50, 51),
    ],
    frameLabels: [], namedPlacements: [], evidence: sourceTimelineEvidence("sprite-85"),
  },
] as const);

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.scenarioInventory.sha256,
  swfmillArtifactId: "swfmill-xml", swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.swfmillXml.sha256,
} as const);
const ROOT_TO_5 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-5", sourceObjectId: "5", frame: 6, depth: "2", instanceName: "Mc_Page_Title", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const ROOT_TO_85 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-85", sourceObjectId: "85", frame: 6, depth: "4", instanceName: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const unresolvedBasis = "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.";

export const COURSE_G04_L11_VB_006_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
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
    timelineId: "sprite-85", sourceTimelineId: "sprite-85", sourceObjectId: "85", frameCount: 439, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_85]}, knownNamedParentPlacements: [ROOT_TO_85], declaredFrameDomains: [],
    disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "high", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"], interpretation: "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent."},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
] as const);

export const COURSE_G04_L11_VB_006_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 3, enumeratedTimelineCount: 3, reachableChildTimelineCount: 2, excludedNotProvenTimelineCount: 0,
  dispositionCounts: {"declared-frame-domain": 1, "composite-child-with-parent": 0, "independent-required": 0, nonvisual: 0, unresolved: 2},
  highRiskIndependentCandidateCount: 1,
  highRiskIndependentCandidates: [{timelineId: "sprite-85", sourceObjectId: "85", frameCount: 439, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"]}],
} as const);

const rootRequirement = (language: "en" | "es", entryStateSha256: string) => ({
  requirementId: "req-default-root-" + language, scenario: "default", frameDomainId: "root", traceId: "default-root-" + language,
  language, seed: "0", requiredRange: {firstFrame: 1, lastFrame: 10}, entryState: {kind: "initial-load", language}, entryStateSha256,
  baselineAuthorityRequirement: "original-runtime-frame-accurate", baselineAuthority: "unresolved", status: "pending", capturedFrameCount: 0,
  missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], baselineCaptureManifest: "", baselineCaptureManifestSha256: "",
  captureManifest: "", captureManifestSha256: "", metricsFile: "", metricsSha256: "",
} as const);

export const COURSE_G04_L11_VB_006_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  rootRequirement("en", "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1"),
  rootRequirement("es", "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067"),
] as const);

const buttonBody = (keyAttribute: string) =>
  "on(release){\n   _global.KeyAttribute = \"" + keyAttribute + "\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}";
const action = (
  id: string, script: string, body: string, bodyBytes: number, bodySha256: string,
  markerLineStart: number, markerLineEnd: number, bodyLineStart: number, bodyLineEnd: number,
  scope: Readonly<{kind: "root" | "sprite" | "button-definition"; objectId: string | null; frame: number | null}>,
  releaseEvent: boolean,
) => ({
  kind: "source-static-action", id, script, body, bodyBytes, bodySha256,
  markerLineStart, markerLineEnd, bodyLineStart, bodyLineEnd,
  exportLineStart: markerLineStart, exportLineEnd: bodyLineEnd, scope,
  event: releaseEvent ? ["release"] : [],
  categories: releaseEvent ? ["glossary", "hyperlink"] : [],
  legacyActionScriptExecuted: false, hostCallsExecuted: false, naturalInteractionProven: false,
} as const);

/** All ten exact AVM1 bodies are inert strings and are never executed. */
export const COURSE_G04_L11_VB_006_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_10/BUTTONCONDACTION on(release).as", buttonBody("Ordered pair"), 121, "da2054dafb0df8260f9c1cdd9dcda5c5a44b7050ce078013ee0fc247535df500", 1, 1, 2, 6, {kind: "button-definition", objectId: "10", frame: null}, true),
  action("script-0002", "DefineButton2_11/BUTTONCONDACTION on(release).as", buttonBody("Pair"), 113, "2e5a7b021e4b9e483964bb2554a319b59a778532f82229fc95bd97fcf8eaf030", 8, 8, 9, 13, {kind: "button-definition", objectId: "11", frame: null}, true),
  action("script-0003", "DefineButton2_12/BUTTONCONDACTION on(release).as", buttonBody("Number"), 115, "a8b57202ecdc28db0a1f0ce0b1dff5d369b7e4aa2378e057887211b8d3718da1", 15, 15, 16, 20, {kind: "button-definition", objectId: "12", frame: null}, true),
  action("script-0004", "DefineButton2_13/BUTTONCONDACTION on(release).as", buttonBody("Locate"), 115, "8b4c6cc61ade436ea19efeaebe19d7bbc97297c5fe05b4275d28e31c10fbc3cc", 22, 22, 23, 27, {kind: "button-definition", objectId: "13", frame: null}, true),
  action("script-0005", "DefineButton2_14/BUTTONCONDACTION on(release).as", buttonBody("Point"), 114, "5a58fa6a5c1611281ebe43a7afcb11678fa1be93d874da21a8d35a55a24d2e92", 29, 29, 30, 34, {kind: "button-definition", objectId: "14", frame: null}, true),
  action("script-0006", "DefineButton2_55/BUTTONCONDACTION on(release).as", buttonBody("Coordinate grid"), 124, "89ff000d8f5676a6d549683f1ca696a572d21fbd8cd5308596ddb74fd8b2bdb6", 36, 36, 37, 41, {kind: "button-definition", objectId: "55", frame: null}, true),
  action("script-0007", "DefineButton2_78/BUTTONCONDACTION on(release).as", buttonBody("Coordinate"), 119, "58afc08bfb2ea4fd7af3c213479adfff6c4e617a2a57e5b8fb2b91015652c59a", 43, 43, 44, 48, {kind: "button-definition", objectId: "78", frame: null}, true),
  action("script-0008", "DefineSprite_85/frame_439/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 50, 50, 51, 51, {kind: "sprite", objectId: "85", frame: 439}, false),
  action("script-0009", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 53, 53, 54, 55, {kind: "root", objectId: null, frame: 1}, false),
  action("script-0010", "frame_6/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 57, 57, 58, 58, {kind: "root", objectId: null, frame: 6}, false),
] as const);

const BUTTON_RELEASE_CONDITION = deepFreeze({
  next: "0", menuEnter: "0", pointerReleaseOutside: "0", pointerDragEnter: "0", pointerDragLeave: "0",
  pointerReleaseInside: "1", pointerPush: "0", pointerLeave: "0", pointerEnter: "0", key: "0", menuLeave: "0",
} as const);
const SHARED_BUTTON_GEOMETRY = deepFreeze({
  hitShapeObjectId: "9", hitShapeBounds: {left: -1_128, right: 1_128, top: -310, bottom: 310},
  hitRecord: {hitTest: "1", down: "0", over: "0", up: "0", objectId: "9", depth: "1", transform: {transX: "0", transY: "0"}},
  inertRecord: {hitTest: "0", down: "0", over: "0", up: "0"},
} as const);
const buttonPlacement = (
  objectId: string, frame: number, depth: string, scaleX: string, transX: string, transY: string,
  morph: string | null, alphaFactor: number | null,
) => ({
  scope: "static-initial-or-definition-bearing-placement-only", timelineId: "sprite-85", frame,
  replace: "0", objectId, depth, morph,
  transform: {scaleX, scaleY: "0.7331085205078125", transX, transY},
  colorTransform: alphaFactor === null ? null : {factorRed: 256, factorGreen: 256, factorBlue: 256, factorAlpha: alphaFactor},
  fullLifecycleProven: false, hitRuntimeProven: false,
} as const);
const buttonTarget = (scriptId: string, buttonObjectId: string, keyAttribute: string, placement: ReturnType<typeof buttonPlacement>) => ({
  scriptId, buttonObjectId, menu: "0", buttonsSize: "10", releaseEvent: "pointerReleaseInside", keyAttribute,
  conditions: [BUTTON_RELEASE_CONDITION], geometry: SHARED_BUTTON_GEOMETRY, placements: [placement],
  placementScope: "static-initial-or-definition-bearing-placement-only",
  actionsExecuted: false, fullLifecycleProven: false, hitRuntimeProven: false,
} as const);

export const COURSE_G04_L11_VB_006_STATIC_BUTTON_TARGETS = deepFreeze([
  buttonTarget("script-0001", "10", "Ordered pair", buttonPlacement("10", 1, "4", "1.062393188476562", "-4343", "-2383", null, null)),
  buttonTarget("script-0002", "11", "Pair", buttonPlacement("11", 1, "6", "0.3615112304687500", "-1912", "-2383", null, null)),
  buttonTarget("script-0003", "12", "Number", buttonPlacement("12", 1, "8", "0.7519683837890625", "-133", "-2383", null, null)),
  buttonTarget("script-0004", "13", "Locate", buttonPlacement("13", 1, "10", "0.5301208496093750", "2857", "-2383", null, null)),
  buttonTarget("script-0005", "14", "Point", buttonPlacement("14", 1, "12", "0.4680328369140625", "4387", "-2383", null, null)),
  buttonTarget("script-0006", "55", "Coordinate grid", buttonPlacement("55", 64, "18", "1.284576416015625", "-4343", "-1838", "63", null)),
  buttonTarget("script-0007", "78", "Coordinate", buttonPlacement("78", 425, "70", "0.9028015136718750", "147", "2937", "424", 0)),
] as const);

export const COURSE_G04_L11_VB_006_STATIC_BUTTON_78_ALPHA_LIFECYCLE = deepFreeze([
  {timelineId: "sprite-85", frame: 425, depth: "70", replace: "0", objectId: "78", morph: "424", alphaFactor: 0, sourceEncoding: "explicit-factorAlpha", definitionBearing: true, runtimeVisibilityProven: false},
  {timelineId: "sprite-85", frame: 426, depth: "70", replace: "1", objectId: null, morph: null, alphaFactor: 51, sourceEncoding: "explicit-factorAlpha", definitionBearing: false, runtimeVisibilityProven: false},
  {timelineId: "sprite-85", frame: 427, depth: "70", replace: "1", objectId: null, morph: null, alphaFactor: 102, sourceEncoding: "explicit-factorAlpha", definitionBearing: false, runtimeVisibilityProven: false},
  {timelineId: "sprite-85", frame: 428, depth: "70", replace: "1", objectId: null, morph: null, alphaFactor: 154, sourceEncoding: "explicit-factorAlpha", definitionBearing: false, runtimeVisibilityProven: false},
  {timelineId: "sprite-85", frame: 429, depth: "70", replace: "1", objectId: null, morph: null, alphaFactor: 205, sourceEncoding: "explicit-factorAlpha", definitionBearing: false, runtimeVisibilityProven: false},
  {timelineId: "sprite-85", frame: 430, depth: "70", replace: "1", objectId: null, morph: null, alphaFactor: 256, sourceEncoding: "empty-ColorTransform2-full", definitionBearing: false, runtimeVisibilityProven: false},
] as const);

/** Four and only four observed host-facing dependency groups. */
export const COURSE_G04_L11_VB_006_STATIC_BLOCKED_HOST_DEPENDENCIES = deepFreeze([
  {binding: "_global.KeyAttribute", reference: "write", literalCandidates: ["Ordered pair", "Pair", "Number", "Locate", "Point", "Coordinate grid", "Coordinate"], status: "BLOCKED_UNVERIFIED", blocker: "Seven release handlers write shared KeyAttribute state without a bound host/default or authorized execution evidence.", facts: null},
  {binding: "_level0.InternalPreloader", reference: ".gotoAndPlay", literalCandidates: ["jump_check"], status: "BLOCKED_UNVERIFIED", blocker: "The root preloader handoff has no authorized natural-entry runtime evidence.", facts: null},
  {binding: "_root.DoHyperLinks", reference: "call", literalCandidates: [], status: "BLOCKED_UNVERIFIED", blocker: "The host hyperlink call appears in seven release handlers without authorized natural-entry evidence.", facts: null},
  {binding: "_root.animation_mc", reference: ".animation.stop", literalCandidates: [], status: "BLOCKED_UNVERIFIED", blocker: "The nested host animation stop target lacks an authorized host binding and natural interaction evidence.", facts: null},
] as const);

export const COURSE_G04_L11_VB_006_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 10, buttonReleaseHandlerCount: 7, doActionCount: 3,
  buttonDefinitionCount: 7, externalCallCandidateCount: 0, hostDependencyGroupCount: 4,
  actionScriptExecuted: false, hostCallsExecuted: false, naturalInteractionProven: false,
  sourceControlsRendered: false, pointerEventsEnabled: false, button78RuntimeVisibilityProven: false,
} as const);

export const COURSE_G04_L11_VB_006_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false,
  manifestReasonNotRequired: "No catalog association was found; manual SWF/FLA timeline audit must confirm that audio is not required.",
  manifestAudioRequiredConflict: "migration.audio.required is false, but the audit found 0 exact external track(s) and 1 timed embedded sound asset/stream(s); update only after runtime reachability/listening review.",
  strictNoAudioConclusionForbidden: true,
  externalExactAssociations: [], externalCandidateOnlyAssociations: [],
  externalExactAssociationCount: 0, externalCandidateOnlyCount: 0, externalMissingExpectedCount: 0,
  embeddedStreams: [{
    id: "embedded-stream-0001", streamIndex: 1, context: {kind: "sprite", characterId: 85},
    contextLabel: "sprite:85", contextDeclaredFrames: 439, headFrame: 1, firstBlockFrame: 4, lastBlockFrame: 439,
    syncMode: "stream", stop: false, loops: null, compressionCode: 2, format: "mp3",
    playbackSampleRateHz: 22_050, playbackSampleSizeBits: 16, playbackChannels: 1,
    sampleRateHz: 22_050, sampleSizeBits: 16, channels: 1,
    nominalSamplesPerBlock: 1_837, blockCount: 436, blocksWithDecodedSampleCount: 436,
    totalDecodedSamples: 800_640, seekSamplesMin: 0, seekSamplesMax: 1_673,
    durationSeconds: 36.310204, durationMs: 36_310,
    durationBasis: "sum-of-mp3-soundstreamblock-sample-counts", language: "und",
    rootCueFrame: null, startSemantics: "interaction-state",
    rootCueResolved: false, runtimeReachabilityVerified: false, originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false, synchronizationVerified: false, stopBehaviorVerified: false,
    replayBehaviorVerified: false, playable: false,
  }],
  inventory: {
    rowCount: 1, exactExternalRows: 0, embeddedRows: 1,
    header: ["cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id", "start_semantics", "duration_ms", "format", "channels", "sample_rate_hz", "source_character_id", "notes"],
    row: ["embedded-stream-0001", "und", SOURCE_SWF_PATH, SOURCE_SHA256, "", "", "interaction-state", "36310", "swf-mp3-stream", "1", "22050", "85", "SoundStream in sprite:85, local head frame 1, first block frame 4, 436 blocks, sync=stream; sum-of-mp3-soundstreamblock-sample-counts; start_semantics=interaction-state; root cue depends on sprite placement/interaction and remains unresolved; no root frame is asserted; spoken language/content requires listening."],
  },
  acceptance: {
    authoritativeListeningComplete: false, hostStateTraversalComplete: false, synchronizationComplete: false,
    cueTriggerResolved: false, timingResolved: false, durationResolved: false,
    runtimeReachabilityVerified: false, originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false, humanAudioReviewComplete: false, ownerAcceptanceComplete: false,
    strictMigrationComplete: false, publicationAuthorized: false, strictAudioAcceptance: false,
  },
} as const);

export const COURSE_G04_L11_VB_006_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  dependencyScope: {
    artifactFingerprintSha256: "c550ed03551f4d614e85bfa1b76c3cb26e42503e600485cadd7a28da80c5e806",
    status: "acceptance-neutral-static-runtime-dependency-scope",
    scopeLimitedToShellForensicQuestion: true, keyTermsStatus: "not-applied-to-this-non-shell-workspace",
    runtimeDependencyClosure: false,
  },
  pageHandlerCount: 7, shellScopeArtifactConflictsWithPageHandlers: true,
  pageHandlerExecutionProven: false, pageDependencyEstablished: false,
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

export const COURSE_G04_L11_VB_006_STATIC_STRUCTURAL_BASELINE_FRAMES = deepFreeze([
  {frame: 1, file: "1.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 2, file: "2.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 3, file: "3.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 4, file: "4.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 5, file: "5.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 6, file: "6.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 7, file: "7.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 8, file: "8.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 9, file: "9.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 10, file: "10.png", sha256: "2aed244262c85ac9d5158adea4cfbad0d0dd07369b38167d16c8870d99829e57", bytes: 8_586, width: 800, height: 600},
] as const);

export const COURSE_G04_L11_VB_006_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
  status: "OPEN_RECORDED", accepted: false, baselineRationaleRejected: true,
  sourceStaticLayerABlocked: false, strictAcceptanceEffect: "blocked-unresolved",
  exactRejectedFractionalRationale: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  affectedArtifacts: [
    {path: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.path, bytes: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.bytes, sha256: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.structuralRootFrames.sha256, field: "runtime.rasterization.rationale"},
    {path: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.strictReadiness.path, bytes: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.strictReadiness.bytes, sha256: COURSE_G04_L11_VB_006_STATIC_EVIDENCE_CLOSURE.strictReadiness.sha256, field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale"},
  ],
  sourceAuthoritativeStage: {xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000, widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20, widthPixels: 800, heightPixels: 600, fractional: false, roundingApplied: false, exactIntegerConversion: true},
  captureRaster: {width: 800, height: 600, matchesAuthoredStageExactly: true, roundingApplied: false},
  structuralFrames: COURSE_G04_L11_VB_006_STATIC_STRUCTURAL_BASELINE_FRAMES,
  originalRuntimeAuthorityEstablished: false, fidelityEstablished: false,
  strictCompletionEstablished: false, publicationEstablished: false,
} as const);

export const COURSE_G04_L11_VB_006_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true, sourceBytesRehashed: true, sourceStaticLayerABlocked: false,
  registered: false, javascriptImplementation: false, rendererExists: false,
  runtimeDependencyClosure: false, originalRuntimeFidelity: false, pixelComparison: false,
  audioCorrectnessOrSynchronizationAccepted: false, humanVisualAccepted: false,
  ownerAccepted: false, strictCompletion: false, releaseAuthorized: false, publication: false,
  strictAcceptanceEffect: "blocked-unresolved",
} as const);

const validAnimation = (animationId: unknown): boolean =>
  animationId === COURSE_G04_L11_VB_006_STATIC_ANIMATION_ID;

export const getStaticSourceFacts = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_006_STATIC_SOURCE_FACTS : blocked("animation-id-must-match-vb006-source-static-contract");
export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  validAnimation(animationId) && frameDomainId === "root" ? COURSE_G04_L11_VB_006_STATIC_DECLARED_ROOT_DOMAIN : blocked("animation-id-and-frame-domain-must-match-vb006-source-static-contract");
export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  validAnimation(animationId) && typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
    ? COURSE_G04_L11_VB_006_STATIC_ROOT_FRAME_FACTS[frame - 1]!
    : blocked("animation-id-and-one-indexed-root-frame-must-match-vb006-source-static-contract");
export const getStaticScenarioTimeline = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_SCENARIO_TIMELINE_INVENTORY.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb006-source-static-contract");
};
export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_TIMELINE_DISPOSITIONS.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb006-source-static-contract");
};
export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) => {
  if (!validAnimation(animationId) || typeof scriptId !== "string") return blocked("animation-id-and-script-id-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_ACTION_RECORDS.find((entry) => entry.id === scriptId)
    ?? blocked("animation-id-and-script-id-must-match-vb006-source-static-contract");
};
export const getStaticButtonTarget = (animationId: unknown, buttonObjectId: unknown) => {
  if (!validAnimation(animationId) || typeof buttonObjectId !== "string") return blocked("animation-id-and-button-object-id-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_BUTTON_TARGETS.find((entry) => entry.buttonObjectId === buttonObjectId)
    ?? blocked("animation-id-and-button-object-id-must-match-vb006-source-static-contract");
};
export const getStaticButton78AlphaLifecycleFrame = (animationId: unknown, frame: unknown) => {
  if (!validAnimation(animationId) || typeof frame !== "number" || !Number.isInteger(frame)) return blocked("animation-id-and-button78-alpha-frame-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_BUTTON_78_ALPHA_LIFECYCLE.find((entry) => entry.frame === frame)
    ?? blocked("animation-id-and-button78-alpha-frame-must-match-vb006-source-static-contract");
};
export const getStaticHostDependency = (animationId: unknown, binding: unknown) => {
  if (!validAnimation(animationId) || typeof binding !== "string") return blocked("animation-id-and-host-binding-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_BLOCKED_HOST_DEPENDENCIES.find((entry) => entry.binding === binding)
    ?? blocked("animation-id-and-host-binding-must-match-vb006-source-static-contract");
};
export const getStaticRootRequirement = (animationId: unknown, requirementId: unknown, language: unknown, scenario: unknown) => {
  if (!validAnimation(animationId) || typeof requirementId !== "string" || typeof language !== "string" || scenario !== "default") return blocked("animation-id-requirement-language-and-scenario-must-match-vb006-source-static-contract");
  return COURSE_G04_L11_VB_006_STATIC_ROOT_REQUIREMENTS.find((entry) => entry.requirementId === requirementId && entry.language === language)
    ?? blocked("animation-id-requirement-language-and-scenario-must-match-vb006-source-static-contract");
};
export const getStaticAudioObligations = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_006_STATIC_AUDIO_OBLIGATIONS : blocked("animation-id-must-match-vb006-source-static-contract");
export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_006_STATIC_BLOCKED_HOST_DEPENDENCIES : blocked("animation-id-must-match-vb006-source-static-contract");
export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_006_STATIC_KEY_TERMS_BOUNDARY : blocked("animation-id-must-match-vb006-source-static-contract");
export const getStaticEvidenceBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_006_STATIC_EVIDENCE_BOUNDARY : blocked("animation-id-must-match-vb006-source-static-contract");
export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  validAnimation(animationId) && conflictId === COURSE_G04_L11_VB_006_STATIC_BASELINE_RATIONALE_CONFLICT.id
    ? COURSE_G04_L11_VB_006_STATIC_BASELINE_RATIONALE_CONFLICT
    : blocked("animation-id-and-conflict-id-must-match-vb006-source-static-contract");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");
export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");
export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");
export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
