/**
 * Internal RW004 source-static specification.
 *
 * This file retains immutable observations from the pinned source and audit
 * closure. It deliberately contains no lesson execution or acceptance effect.
 */

export const COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID =
  "course-g04-l11-rw-004" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/RW/L11RW04.swf";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "19477c8b72ecc9ff934395e2924bec0150ec221d421f1db5e5cf0943a1570868";

/** Exactly twenty independently byte-pinned source-static artifacts. */
export const COURSE_G04_L11_RW_004_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 458_226, sha256: SOURCE_SHA256},
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
    path: "migrations/course-g04-l11-rw-004/migration.json",
    bytes: 6_912,
    sha256: "ddd3feb129fb84692e3af45aa67aa54fb725bdca3ae0158e7c49332e5e3332e7",
  },
  machineReport: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/report.json",
    bytes: 13_173,
    sha256: "4296057556323e6645e8037b4a09fee4bff06c16ef8cffcda4c9f4a0da7139f8",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/ffdec-header.txt",
    bytes: 188,
    sha256: "26133945b6a3bf52d5853ad4e80faf31f24f192fd949de470f8b7d9cb695260e",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/ffdec-script-index.txt",
    bytes: 286,
    sha256: "16a3494ee284be86a4af7773e35271c11fe032a5f4ecf5fe2fda29a712274c9c",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/ffdec-scripts.txt.gz",
    bytes: 273,
    sha256: "935239d2d21c184fc67acff19736bf40c32f899a1d86afb5c8565ba91e91baec",
    uncompressedBytes: 760,
    uncompressedSha256: "85e5aa5e71de415e9fd880e92d119d384dfa14db926b34b624e328946460df04",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/ffdec-tags.txt.gz",
    bytes: 43_836,
    sha256: "b6e7f15516b042d64a88d9003b7c2751550be5a46cf1ea41d692d906fdf37ec6",
    uncompressedBytes: 169_106,
    uncompressedSha256: "4ed7b03921e8ade70b229e43914aa1a5c929a171eff3850b2ce586659a02bffc",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_836,
    sha256: "b409456d69eaf4a87f017e914d12f76721b44007cbd49774c90b359173722bcf",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/swfmill-summary.json",
    bytes: 2_712,
    sha256: "058acd9764fe01a11276b51d39c4e2aec36195718ed26c45b60fbfdadbf8cca4",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-rw-004/audit/machine/swfmill.xml.gz",
    bytes: 531_314,
    sha256: "f3b67c7886decc776acaf024716d8301a6a58bb209cce8e8bda2bc76e0eb9abf",
    uncompressedBytes: 1_936_225,
    uncompressedSha256: "cbddc99272e7f29e23d7896a7a9b0f2e2b64e9fb4a2e061130978a886933d9e0",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-rw-004/audit/scenario-inventory.json",
    bytes: 144_948,
    sha256: "ff431d7f4535e307d0b035c5c5b8defd39c91b644ca17e6eb663a47aa5330025",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-rw-004/audit/frame-domain-disposition.json",
    bytes: 15_689,
    sha256: "c4834be63181cdd4c442931863788d6a8b04fa226555ebb383c86462a5bc520d",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-rw-004/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "884a13a2ec880403117e09f0aa824dbb731d5a343c8aeb84b18505ee2ee95e52",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-rw-004/audit/audio-runtime-evidence.json",
    bytes: 9_611,
    sha256: "d11ab729e523be50bf695a57046b9060fa92ef863a0c02f23cdca2ad35c825a9",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-rw-004/audio-inventory.csv",
    bytes: 698,
    sha256: "43adf3d459974f302fdccf9958bffa681b54991df957a8514922fce3b4cf4bfd",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-rw-004/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "cb476d19656bc394aeb76b2d37c878c1b7f4e3cb7d72d8e08b3482f064966e12",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-rw-004/audit/strict-readiness.json",
    bytes: 16_607,
    sha256: "1828edae222efc8dd3444c011aba39754ddcc1215082ad12e1a8bc9b7cf662da",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-rw-004/baseline/ffdec-root-frames.json",
    bytes: 3_569,
    sha256: "112c494f7c7952bcdc99b8bb738a69b9ed116364da96409177e9d74c94175200",
  },
} as const);

export const COURSE_G04_L11_RW_004_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: {path: SOURCE_SWF_PATH, bytes: 458_226, sha256: SOURCE_SHA256},
    fla: null,
    flaSha256: null,
    pairedFlaStatus: "missing",
    authoringInspectionStatus: "missing-source",
    strictAuthoringInspectionStatus: "not-applicable-fla-missing",
    authoringConfidence: "unknown",
    authoringStructureRecovered: false,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/RW/L11RW04.swf",
    activeXmlOccurrence: {
      title: "Page 3",
      randomAudio: "",
      backgroundText: "",
      exactText: "<Page Title=\"Page 3\" RandomAudio=\"\" BGText=\"\">RW/L11RW04.swf</Page>",
      xmlOccurrence: 4,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    expectedMemberCount: 44,
    ordinal: 4,
    xmlOccurrence: 4,
    releaseRole: "active-xml-referenced-page",
    batchId: "g04-l11-host-language",
    shardId: "g04-l11-host-language",
    sourcePath: "HELP_COURSES/ELMGR4/L11/RW/L11RW04.swf",
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    compression: "zlib",
    physicalSourceBytes: 458_226,
    declaredUncompressedBytes: 486_996,
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

export const COURSE_G04_L11_RW_004_STATIC_TAG_COUNTS = deepFreeze({
  DefineMorphShape: 6,
  DefineFont2: 2,
  DefineText: 21,
  DefineButton2: 3,
  DefineSprite: 4,
  ShowFrame: 354,
  DoAction: 3,
  FrameLabel: 1,
  PlaceObject2: 347,
  RemoveObject2: 29,
  SoundStreamHead: 1,
  SoundStreamBlock: 302,
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {depth: "1", frame: 6, hasClipActions: false, name: "Animation", objectId: "121", replace: "0", tag: "PlaceObject2"},
  {depth: "134", frame: 6, hasClipActions: false, name: "Mc_Page_Title", objectId: "125", replace: "0", tag: "PlaceObject2"},
] as const);
const ROOT_CONTROL_RECORDS = deepFreeze([
  {frame: 1, reasons: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"]},
  {frame: 6, reasons: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"]},
  {frame: 10, reasons: ["terminal-structural-frame"]},
] as const);

export const COURSE_G04_L11_RW_004_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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

export const COURSE_G04_L11_RW_004_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

const evidence = (timelineId: string) => ({artifactId: "swfmill-xml", timelineId} as const);
const endpoint = (timelineId: string, frame: number, reasons: readonly string[]) => ({
  frame,
  reasons,
  evidence: [evidence(timelineId)],
} as const);
const scriptEndpoint = (
  timelineId: string,
  frame: number,
  reasons: readonly string[],
  script: string,
  lineStart: number,
  lineEnd: number,
) => ({
  frame,
  reasons,
  evidence: [evidence(timelineId), evidence(timelineId), {artifactId: "ffdec-scripts", script, lineStart, lineEnd}, {artifactId: "ffdec-scripts", script, lineStart, lineEnd}],
} as const);

/** Full hash-bound scenario timelineInventory projection. */
export const COURSE_G04_L11_RW_004_STATIC_SCENARIO_TIMELINE_INVENTORY = deepFreeze([
  {
    timelineId: "root", objectId: null, frameCount: 10,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 10, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "root",
    controlStates: [
      scriptEndpoint("root", 1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], "frame_1/DoAction.as", 28, 30),
      scriptEndpoint("root", 6, ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"], "frame_6/DoAction.as", 32, 33),
      endpoint("root", 10, ["terminal-structural-frame"]),
    ],
    frameLabels: [{frame: 6, label: "begin"}], namedPlacements: ROOT_NAMED_PLACEMENTS, evidence: evidence("root"),
  },
  {
    timelineId: "sprite-89", objectId: "89", frameCount: 19,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 19, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [endpoint("sprite-89", 1, ["initial-one-indexed-frame"]), endpoint("sprite-89", 19, ["terminal-structural-frame"])],
    frameLabels: [], namedPlacements: [], evidence: evidence("sprite-89"),
  },
  {
    timelineId: "sprite-102", objectId: "102", frameCount: 22,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 22, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [endpoint("sprite-102", 1, ["initial-one-indexed-frame"]), endpoint("sprite-102", 22, ["terminal-structural-frame"])],
    frameLabels: [], namedPlacements: [], evidence: evidence("sprite-102"),
  },
  {
    timelineId: "sprite-121", objectId: "121", frameCount: 302,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 302, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [
      endpoint("sprite-121", 1, ["initial-one-indexed-frame"]),
      scriptEndpoint("sprite-121", 302, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], "DefineSprite_121/frame_302/DoAction.as", 25, 26),
    ],
    frameLabels: [], namedPlacements: [], evidence: evidence("sprite-121"),
  },
  {
    timelineId: "sprite-125", objectId: "125", frameCount: 1,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 1, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame", "terminal-structural-frame"], evidence: [evidence("sprite-125"), evidence("sprite-125")] }],
    frameLabels: [], namedPlacements: [], evidence: evidence("sprite-125"),
  },
] as const);

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256: "ff431d7f4535e307d0b035c5c5b8defd39c91b644ca17e6eb663a47aa5330025",
  swfmillArtifactId: "swfmill-xml",
  swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256: "f3b67c7886decc776acaf024716d8301a6a58bb209cce8e8bda2bc76e0eb9abf",
} as const);
const ROOT_TO_121 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-121", sourceObjectId: "121", frame: 6, depth: "1", instanceName: "Animation", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const ROOT_TO_125 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-125", sourceObjectId: "125", frame: 6, depth: "134", instanceName: "Mc_Page_Title", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const unresolvedBasis = "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.";
const unresolvedInterpretation = "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent.";

/** Complete five-timeline frame-domain disposition projection. */
export const COURSE_G04_L11_RW_004_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
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
    timelineId: "sprite-89", sourceTimelineId: "sprite-89", sourceObjectId: "89", frameCount: 19, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "structurally-reachable-but-named-root-path-unresolved", namedPlacementPath: [], limitation: "The scenario inventory proves root reachability from the full placement graph but retains only named placements; no complete named chain to root is present in this artifact."},
    knownNamedParentPlacements: [], declaredFrameDomains: [], disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "review", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], interpretation: unresolvedInterpretation},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-102", sourceTimelineId: "sprite-102", sourceObjectId: "102", frameCount: 22, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "structurally-reachable-but-named-root-path-unresolved", namedPlacementPath: [], limitation: "The scenario inventory proves root reachability from the full placement graph but retains only named placements; no complete named chain to root is present in this artifact."},
    knownNamedParentPlacements: [], declaredFrameDomains: [], disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "review", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], interpretation: unresolvedInterpretation},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-121", sourceTimelineId: "sprite-121", sourceObjectId: "121", frameCount: 302, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_121]}, knownNamedParentPlacements: [ROOT_TO_121], declaredFrameDomains: [], disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "high", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"], interpretation: unresolvedInterpretation},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-125", sourceTimelineId: "sprite-125", sourceObjectId: "125", frameCount: 1, structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_125]}, knownNamedParentPlacements: [ROOT_TO_125], declaredFrameDomains: [], disposition: "unresolved", dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "review", independentFrameDomainCandidate: false, signals: ["undeclared-structurally-root-reachable-timeline", "direct-named-root-placement"], interpretation: "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain."},
    staticSignals: {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0}, sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
] as const);

export const COURSE_G04_L11_RW_004_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 5, enumeratedTimelineCount: 5, reachableChildTimelineCount: 4, excludedNotProvenTimelineCount: 0,
  dispositionCounts: {"declared-frame-domain": 1, "composite-child-with-parent": 0, "independent-required": 0, nonvisual: 0, unresolved: 4},
  highRiskIndependentCandidateCount: 1,
  highRiskIndependentCandidates: [{timelineId: "sprite-121", sourceObjectId: "121", frameCount: 302, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"]}],
} as const);

const rootRequirement = (language: "en" | "es", entryStateSha256: string) => ({
  requirementId: "req-default-root-" + language,
  scenario: "default", frameDomainId: "root", traceId: "default-root-" + language, language, seed: "0",
  requiredRange: {firstFrame: 1, lastFrame: 10}, entryState: {kind: "initial-load", language}, entryStateSha256,
  baselineAuthorityRequirement: "original-runtime-frame-accurate", baselineAuthority: "unresolved", status: "pending", capturedFrameCount: 0,
  missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], baselineCaptureManifest: "", baselineCaptureManifestSha256: "", captureManifest: "", captureManifestSha256: "", metricsFile: "", metricsSha256: "",
} as const);
export const COURSE_G04_L11_RW_004_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  rootRequirement("en", "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1"),
  rootRequirement("es", "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067"),
] as const);

const action = (id: string, script: string, body: string, bodyBytes: number, bodySha256: string, lineStart: number, lineEnd: number, scope: Readonly<{kind: "root" | "sprite" | "button-definition"; objectId: string | null; frame: number | null}>) => ({
  kind: "source-static-action", id, script, body, bodyBytes, bodySha256, lineStart, lineEnd, scope,
  legacyActionScriptExecuted: false, hostCallsExecuted: false, naturalInteractionProven: false,
} as const);

/** All six exact FFDec script bodies, retained but never evaluated. */
export const COURSE_G04_L11_RW_004_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_112/BUTTONCONDACTION on(release).as", "on(release){\n   q;\n   _global.KeyAttribute = \"Location\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 123, "77a486b076545f198a91c40ac1321eebf6ce503fdb26ebbdea956c762531b7a6", 1, 7, {kind: "button-definition", objectId: "112", frame: null}),
  action("script-0002", "DefineButton2_113/BUTTONCONDACTION on(release).as", "on(release){\n   q;\n   _global.KeyAttribute = \"Point\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 120, "bd8e2f4b26e1a0875b7809265a702b514edbd9f61f40fece1257d3ece4eae5c1", 9, 15, {kind: "button-definition", objectId: "113", frame: null}),
  action("script-0003", "DefineButton2_120/BUTTONCONDACTION on(release).as", "on(release){\n   q;\n   _global.KeyAttribute = \"Coordinate grid\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 130, "1868dd1b747da75c82186cb352987df2f6e6a886272212c80e1ae3592b00599c", 17, 23, {kind: "button-definition", objectId: "120", frame: null}),
  action("script-0004", "DefineSprite_121/frame_302/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 25, 26, {kind: "sprite", objectId: "121", frame: 302}),
  action("script-0005", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 28, 30, {kind: "root", objectId: null, frame: 1}),
  action("script-0006", "frame_6/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 32, 33, {kind: "root", objectId: null, frame: 6}),
] as const);

const hit = [{depth: "1", shapeObjectId: "111", transform: {transX: "0", transY: "0"}}] as const;
const placement = (objectId: "112" | "113" | "120", depth: string, frame: number) => ({depth, frame, hasClipActions: false, name: "", objectId, replace: "0", tag: "PlaceObject2", timelineId: "sprite-121"} as const);
export const COURSE_G04_L11_RW_004_STATIC_BUTTON_TARGETS = deepFreeze([
  {scriptId: "script-0001", buttonObjectId: "112", releaseEvent: "release", keyAttribute: "Location", hitRecords: hit, placements: [placement("112", "120", 226), placement("112", "120", 236), placement("112", "120", 271), placement("112", "120", 274)], exactStageBoundsStatus: "not-derived-from-hit-shape-geometry"},
  {scriptId: "script-0002", buttonObjectId: "113", releaseEvent: "release", keyAttribute: "Point", hitRecords: hit, placements: [placement("113", "122", 226), placement("113", "122", 236), placement("113", "122", 271), placement("113", "122", 274)], exactStageBoundsStatus: "not-derived-from-hit-shape-geometry"},
  {scriptId: "script-0003", buttonObjectId: "120", releaseEvent: "release", keyAttribute: "Coordinate grid", hitRecords: hit, placements: [placement("120", "128", 274), placement("120", "128", 297)], exactStageBoundsStatus: "not-derived-from-hit-shape-geometry"},
] as const);

export const COURSE_G04_L11_RW_004_STATIC_BLOCKED_HOST_DEPENDENCIES = deepFreeze([
  {sourceToken: "q", status: "BLOCKED_UNVERIFIED", blocker: "The bare q reference has no bound definition or authorized execution evidence.", facts: null},
  {sourceToken: "_global.KeyAttribute", status: "BLOCKED_UNVERIFIED", blocker: "The shared KeyAttribute state has three observed assignments but no authorized host/default or execution evidence.", facts: null},
  {sourceToken: "_root.DoHyperLinks", status: "BLOCKED_UNVERIFIED", blocker: "The hyperlink host call appears in three release handlers without authorized natural-entry evidence.", facts: null},
  {sourceToken: "_root.animation_mc.animation.stop", status: "BLOCKED_UNVERIFIED", blocker: "The nested animation stop target lacks an authorized host binding and natural interaction evidence.", facts: null},
  {sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")", status: "BLOCKED_UNVERIFIED", blocker: "The root preloader handoff is a host-dependent legacy operation with no authorized natural-entry runtime evidence.", facts: null},
] as const);

export const COURSE_G04_L11_RW_004_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 6, buttonReleaseHandlerCount: 3, doActionCount: 3, buttonDefinitionCount: 3,
  randomCallCount: 0, evalCallCount: 0, externalCallCandidateCount: 0, machineExternalCallCandidateCount: 0,
  machineExternalCandidatesDoNotEliminateHostDependencies: true, hostDependencyTokenCount: 5,
  actionScriptExecuted: false, naturalInteractionProven: false, exactStageSpaceHitBounds: "not-derived-from-hit-shape-geometry",
} as const);

const AUDIO_PROJECTION = deepFreeze({
  streamIndex: 1, context: {kind: "sprite", characterId: 121}, contextLabel: "sprite:121", contextDeclaredFrames: 302,
  headFrame: 1, firstBlockFrame: 1, lastBlockFrame: 302, syncMode: "stream", stop: false, loops: null,
  compressionCode: 2, format: "mp3", playbackRateCode: 2, playbackSampleRateHz: 22_050, playbackSampleSizeBits: 16, playbackChannels: 1,
  rateCode: 2, sampleRateHz: 22_050, sampleSizeBits: 16, channels: 1, nominalSamplesPerBlock: 1_837,
  blockCount: 302, blocksWithDecodedSampleCount: 302, totalDecodedSamples: 554_112, seekSamplesMin: 0, seekSamplesMax: 1_673,
  durationSeconds: 25.129796, durationMs: 25_130, durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
  evidence: {file: "audit/machine/swfmill.xml.gz", headLine: 29_288},
} as const);
export const COURSE_G04_L11_RW_004_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false, strictNoAudioConclusionForbidden: true,
  manifestAudioRequiredConflict: "migration.audio.required is false, but the audit found 0 exact external track(s) and 1 timed embedded sound asset/stream(s); update only after runtime reachability/listening review.",
  externalExactAssociations: [], externalCandidateOnlyAssociations: [],
  externalExactAssociationCount: 0, externalCandidateOnlyCount: 0, externalPlayable: false,
  embeddedStreams: [{
    id: "embedded-stream-0001", streamIndex: 1, contextKind: "sprite", sourceCharacterId: 121, contextDeclaredFrames: 302,
    headFrame: 1, firstBlockFrame: 1, lastBlockFrame: 302, blockCount: 302, totalDecodedSamples: 554_112,
    format: "mp3", syncMode: "stream", sampleRateHz: 22_050, sampleSizeBits: 16, channels: 1, nominalSamplesPerBlock: 1_837,
    seekSamplesMin: 0, seekSamplesMax: 1_673, durationSeconds: 25.129796, durationMs: 25_130, language: "und", rootCueFrame: null,
    startSemantics: "interaction-state", sourceStaticCueSemantics: "interaction-state", auditProjection: AUDIO_PROJECTION,
    rootCueResolved: false, runtimeReachabilityVerified: false, originalRuntimeListeningAccepted: false, spokenLanguageContentVerified: false,
    synchronizationVerified: false, stopBehaviorVerified: false, replayBehaviorVerified: false, playable: false,
  }],
  strictAudioAcceptance: false,
} as const);

export const COURSE_G04_L11_RW_004_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  workspaceScope: "non-shell", runtimeScopeClassification: "shell-only-forensic-question-not-applied-to-this-page-workspace",
  runtimeDependencyScopeStatus: "not-applied-to-this-non-shell-workspace", shellScopeArtifactConflictsWithPageHandlers: true,
  pageHandlerCount: 3, pageHandlerExecutionProven: false, pageHandlerReachabilityProven: false, pageDependencyEstablished: false,
  wholeLessonAndShellKeyTermsUnresolved: true,
  canonicalDependencies: [
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml", status: "BLOCKED_UNVERIFIED", sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml", status: "BLOCKED_UNVERIFIED", sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
  ],
  gradeWideRetrievalLeads: [
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", bytes: 378_783, sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml", bytes: 374_466, sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
  ],
} as const);

export const COURSE_G04_L11_RW_004_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT", status: "OPEN_RECORDED", severityForSourceStaticLayerA: "nonblocking-if-explicitly-contained", scope: "stage-rasterization-rationale-only",
  accepted: false, conflictingClaimAccepted: false, fractionalNativeStageClaimAccepted: false,
  affectedArtifacts: [
    {path: "migrations/course-g04-l11-rw-004/baseline/ffdec-root-frames.json", bytes: 3_569, sha256: "112c494f7c7952bcdc99b8bb738a69b9ed116364da96409177e9d74c94175200", field: "runtime.rasterization.rationale"},
    {path: "migrations/course-g04-l11-rw-004/audit/strict-readiness.json", bytes: 16_607, sha256: "1828edae222efc8dd3444c011aba39754ddcc1215082ad12e1a8bc9b7cf662da", field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale"},
  ],
  exactObservedConflictingText: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  sourceAuthoritativeStage: {xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000, widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20, widthPixels: 800, heightPixels: 600, widthPx: 800, heightPx: 600, fractional: false, fractionalNativeStage: false, roundingApplied: false, exactIntegerConversion: true},
  captureRaster: {width: 800, height: 600, matchesAuthoredStageExactly: true, roundingApplied: false},
  baselineFrameManifestHashBound: true, baselinePngDimensionsInvalidated: false, baselineRationaleRejected: true, baselineRationaleAccepted: false,
  scenarioGenerationBlocked: false, frameDispositionGenerationBlocked: false, sourceStaticLayerABlocked: false,
  originalRuntimeAuthorityEstablished: false, fidelityEstablished: false, strictCompletionEstablished: false, publicationEstablished: false,
  strictAcceptanceEffect: "blocked-unresolved", publicationEffect: "none",
} as const);

export const COURSE_G04_L11_RW_004_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true, javascriptRenderer: false, registryEntry: false, currentJavascriptCoverage: false,
  naturalEntryProven: false, originalRuntimeAuthority: false, visualAuthority: false, audioAccepted: false,
  renderer: false, registry: false, currentJs: false, actionScriptExecuted: false, naturalRuntime: false, originalRuntime: false,
  visualAcceptance: false, audioAcceptance: false, keyTermsResolved: false, humanReview: false, engineeringReview: false,
  ownerAcceptance: false, strictCompletion: false, publication: false,
} as const);

export const getStaticSourceFacts = (animationId: unknown) =>
  animationId === COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? COURSE_G04_L11_RW_004_STATIC_SOURCE_FACTS : blocked("animation-id-must-match-rw004-source-static-contract");
export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : frameDomainId === "root" ? COURSE_G04_L11_RW_004_STATIC_DECLARED_ROOT_DOMAIN : typeof frameDomainId === "string" ? blocked("only-the-declared-root-frame-domain-is-source-static") : blocked("frame-domain-id-must-be-a-string");
export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10 ? COURSE_G04_L11_RW_004_STATIC_ROOT_FRAME_FACTS[frame - 1] ?? blocked("root-frame-index-is-not-bound") : blocked("root-frame-must-be-a-finite-one-indexed-integer-in-1-through-10");
export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : typeof timelineId === "string" ? COURSE_G04_L11_RW_004_STATIC_TIMELINE_DISPOSITIONS.find((row) => row.timelineId === timelineId) ?? blocked("timeline-id-is-not-in-the-hash-bound-rw004-inventory") : blocked("timeline-id-must-be-a-string");
export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : typeof scriptId === "string" ? COURSE_G04_L11_RW_004_STATIC_ACTION_RECORDS.find((row) => row.id === scriptId) ?? blocked("script-id-is-not-in-the-hash-bound-rw004-bundle") : blocked("script-id-must-be-a-string");
export const getStaticRootRequirement = (animationId: unknown, requirementId: unknown, language: unknown, scenario: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : typeof requirementId === "string" && typeof language === "string" && typeof scenario === "string" ? COURSE_G04_L11_RW_004_STATIC_ROOT_REQUIREMENTS.find((row) => row.requirementId === requirementId && row.language === language && row.scenario === scenario) ?? blocked("requirement-language-scenario-combination-is-not-bound") : blocked("requirement-id-language-and-scenario-must-all-be-strings");
export const getStaticAudioObligations = (animationId: unknown) => animationId === COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? COURSE_G04_L11_RW_004_STATIC_AUDIO_OBLIGATIONS : blocked("animation-id-must-match-rw004-source-static-contract");
export const getStaticBlockedHostDependencies = (animationId: unknown) => animationId === COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? COURSE_G04_L11_RW_004_STATIC_BLOCKED_HOST_DEPENDENCIES : blocked("animation-id-must-match-rw004-source-static-contract");
export const getStaticKeyTermsBoundary = (animationId: unknown) => animationId === COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? COURSE_G04_L11_RW_004_STATIC_KEY_TERMS_BOUNDARY : blocked("animation-id-must-match-rw004-source-static-contract");
export const getStaticEvidenceBoundary = (animationId: unknown) => animationId === COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? COURSE_G04_L11_RW_004_STATIC_EVIDENCE_BOUNDARY : blocked("animation-id-must-match-rw004-source-static-contract");
export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  animationId !== COURSE_G04_L11_RW_004_STATIC_ANIMATION_ID ? blocked("animation-id-must-match-rw004-source-static-contract") : typeof conflictId !== "string" ? blocked("conflict-id-must-be-a-string") : conflictId === COURSE_G04_L11_RW_004_STATIC_BASELINE_RATIONALE_CONFLICT.id ? COURSE_G04_L11_RW_004_STATIC_BASELINE_RATIONALE_CONFLICT : blocked("conflict-id-is-not-in-the-hash-bound-rw004-inventory");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> => blocked("authorized-natural-or-original-runtime-evidence-is-not-present");
export const requestStaticPixels = (): Readonly<BlockedUnverified> => blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");
export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> => blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");
export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> => blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
