/**
 * Internal VB002 source-static Layer A facts.
 *
 * This module is intentionally inert: it preserves hash-bound observations
 * without providing a renderer, playback, host emulation, or acceptance path.
 */

export const COURSE_G04_L11_VB_002_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-002" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB02.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB02.fla";
const EXTERNAL_MP3_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11VB02.mp3";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "ab1a887eb01b71c0591e3ed36e931c56520510b9ab697b5f62cff00b72b8cb62";

/** Exactly the 22 source-static Layer A bindings for this VB002 page. */
export const COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 66_536, sha256: SOURCE_SHA256},
  sourceFla: {
    path: SOURCE_FLA_PATH,
    bytes: 344_576,
    sha256: "40922ad4b6c505d3aa5e116318c7332be0179b8d0f2560505a2f90e5beec8e99",
  },
  externalSpanishMp3: {
    path: EXTERNAL_MP3_PATH,
    bytes: 245_616,
    sha256: "96ded911f573bdfdf125c4910ec0fc434a3eeabe02a55674a6b055bb53febbc0",
  },
  lessonSourceXml: {
    path: LESSON_XML_PATH,
    bytes: 10_085,
    sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
  },
  lessonReleaseCatalog: {
    path: "catalog/lesson-releases.json",
    bytes: 145_216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  migrationManifest: {
    path: "migrations/course-g04-l11-vb-002/migration.json",
    bytes: 8_312,
    sha256: "7a5fc56d0f16599c824a41abd1b8935ff7c7cf74a1b3be67a59cb38fa40d5e50",
  },
  machineReport: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/report.json",
    bytes: 12_266,
    sha256: "837f1837e5994f8d486ee20817c6aaf98ae602e5ce58a86eebc1cf3fb664649f",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/ffdec-header.txt",
    bytes: 187,
    sha256: "db9a33c3ca95a0836e3c7a04f1e0005d1c95049f9b778acfa2704e85f0ae178c",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/ffdec-script-index.txt",
    bytes: 612,
    sha256: "7323db650c0afa2ffae4a4d7d1a0944e4d6478e864b90fdaeec1c6d81b26124b",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/ffdec-scripts.txt.gz",
    bytes: 333,
    sha256: "6a71c0db3378d8e207cd37778e2c4b4e7b81d248d3d6742d9cf1b10c3b9cb699",
    uncompressedBytes: 1_815,
    uncompressedSha256: "44cfdda06d8e7045fc6c62b13a2b4092d0ad97a436f86ab5eb6c161048308e2d",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/ffdec-tags.txt.gz",
    bytes: 24_622,
    sha256: "c4154a78032b8ec6f4b227823aaefa2ae61e794737ccd3433366d0e6213b21b2",
    uncompressedBytes: 113_531,
    uncompressedSha256: "84b9bd042aa3cd937a1ebc13c074fb5c21e9c251f9dbe9f43f8ef2cf98b539c7",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256: "f23021bcbf71f024f44b9775a32894c6ae5156964eb4f3ff8886f05b7a8095f1",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/swfmill-summary.json",
    bytes: 2_404,
    sha256: "41b97601367f07f505fb770d8fb195d16bf400f79475cfb972956773e632f7b8",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-vb-002/audit/machine/swfmill.xml.gz",
    bytes: 77_454,
    sha256: "9696394d42ee37bbd7b252d13a85b0f15ce5c2f8aeec392c0bbf3dfd2ac9ad78",
    uncompressedBytes: 393_975,
    uncompressedSha256: "94a4aa8904386d61fb6a78c0c5f44b52688a1e722d66042c004759cdc5d76589",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-vb-002/audit/scenario-inventory.json",
    bytes: 197_595,
    sha256: "0936dfc89270cb1100696b017de07093042088fe061b39d8cba0cd43f277cd1f",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-vb-002/audit/frame-domain-disposition.json",
    bytes: 11_859,
    sha256: "0b99449acbc3ec354953784c5312b6abd35bc44f77b3636c869f44173486f4c6",
  },
  runtimeDependencyWorkspaceScope: {
    path: "migrations/course-g04-l11-vb-002/audit/runtime-dependency-scope.json",
    bytes: 3_607,
    sha256: "23a317ddcfbf9ad5e31ce393144b467b058653dfd2fa7d9f609ead6377c24d60",
  },
  audioRuntimeEvidence: {
    path: "migrations/course-g04-l11-vb-002/audit/audio-runtime-evidence.json",
    bytes: 15_698,
    sha256: "78053edf0687255c1bb4954debdd12471b4adbf01f66893019a3eb3b37f58e9f",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-vb-002/audio-inventory.csv",
    bytes: 1_690,
    sha256: "5f754ae93eaae7d0e05d5b03f2da47769948d075045cb892b89e04daa0d107a0",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-vb-002/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "6a6e9b42a0c2b242d3909dbc39c9fe538d912f3324d71e0ca0728480592ee68a",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-vb-002/audit/strict-readiness.json",
    bytes: 18_110,
    sha256: "d1650e7595f9e2f517d1d58f1fce28f97a9a841c66cd4c787bba94a2ca797152",
  },
  structuralRootBaseline: {
    path: "migrations/course-g04-l11-vb-002/baseline/ffdec-root-frames.json",
    bytes: 3_559,
    sha256: "80480a6531c6d5163a36ad81a036916c02d81de5126f845907e29936dbcc044d",
  },
} as const);

export const COURSE_G04_L11_VB_002_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_002_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.sourceSwf,
    fla: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.sourceFla,
    pairedFlaStatus: "present",
    authoringInspectionComplete: false,
    authoringInspectionStatus: "not-complete-legacy-conversion-dialog",
    authoringConfidence: "unknown",
    authoringStructureRecovered: false,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/VB/L11VB02.swf",
    activeXmlOccurrence: {
      title: "Coordinate Grid",
      randomAudio: "",
      backgroundText: "",
      xmlOccurrence: 5,
      exactText: "<Page Title=\"Coordinate Grid\" RandomAudio=\"\" BGText=\"\">VB/L11VB02.swf</Page>",
    },
    activeXmlSubtitle: {
      english: "1. Coordinate Grid",
      spanish: "Cuadrícula de coordenadas",
      subTitleButtonName: "L11VB02",
      xmlLine: 55,
      exactText: "<SubPageTitle EngSubTitleName=\"1. Coordinate Grid\" SpanSubTitleName=\"Cuadrícula de coordenadas\" SubTitleButtonName=\"L11VB02\">VB/L11VB02.swf</SubPageTitle>",
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    expectedMemberCount: 44,
    ordinal: 5,
    releaseRole: "active-xml-referenced-page",
    shardId: "g04-l11-host-language",
    sourcePath: "HELP_COURSES/ELMGR4/L11/VB/L11VB02.swf",
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    compression: "zlib",
    physicalSourceBytes: 66_536,
    declaredUncompressedBytes: 78_476,
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
    sourceStaticLayerABlocked: false,
    registered: false,
    currentJsCandidateExists: false,
    originalRuntimeFidelityEstablished: false,
    visualComparisonEstablished: false,
    audioAcceptanceEstablished: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictAcceptanceReady: false,
    publicationAllowed: false,
  },
  preReviewHistory: {
    failedPreReviewSourceModuleSha256: "1dc5b48e65737c0aa5ee7071c92a9e40b72ccfb33139ce288c638ba7f088b59f",
    disposition: "superseded-before-test-by-closure-and-projection-review",
    authorityEffect: "none",
  },
} as const);

export const COURSE_G04_L11_VB_002_STATIC_TAG_COUNTS = deepFreeze({
  SetBackgroundColor: 1,
  Protect: 1,
  DoAction: 3,
  ShowFrame: 158,
  FrameLabel: 1,
  DefineFont2: 3,
  DefineText: 51,
  PlaceObject2: 458,
  DefineSprite: 2,
  DefineMorphShape: 4,
  DefineShape: 7,
  DefineButton2: 9,
  DefineShape3: 2,
  DefineShape2: 2,
  SoundStreamHead: 1,
  SoundStreamBlock: 145,
  RemoveObject2: 75,
  End: 1,
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {depth: "2", frame: 6, hasClipActions: false, name: "Mc_Page_Title", objectId: "5", replace: "0", tag: "PlaceObject2"},
  {depth: "4", frame: 6, hasClipActions: false, name: "animation", objectId: "80", replace: "0", tag: "PlaceObject2"},
] as const);

const ROOT_CONTROL_REASONS = deepFreeze({
  1: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"],
  6: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"],
  10: ["terminal-structural-frame"],
} as const);

export const COURSE_G04_L11_VB_002_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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

export const COURSE_G04_L11_VB_002_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

const sourceTimelineEvidence = (timelineId: string) =>
  ({artifactId: "swfmill-xml", timelineId} as const);
const structuralEndpoint = (timelineId: string, frame: number, reasons: readonly string[]) => ({
  frame,
  reasons,
  evidence: [sourceTimelineEvidence(timelineId)],
} as const);
const scriptedEndpoint = (
  timelineId: string,
  frame: number,
  reasons: readonly string[],
  script: string,
  lineStart: number,
  lineEnd: number,
) => ({
  frame,
  reasons,
  evidence: [
    sourceTimelineEvidence(timelineId),
    sourceTimelineEvidence(timelineId),
    {artifactId: "ffdec-scripts", script, lineStart, lineEnd},
    {artifactId: "ffdec-scripts", script, lineStart, lineEnd},
  ],
} as const);

/** Exact three-row source-static projection of the generated scenario inventory. */
export const COURSE_G04_L11_VB_002_STATIC_SCENARIO_TIMELINE_INVENTORY = deepFreeze([
  {
    timelineId: "root",
    objectId: null,
    frameCount: 10,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 10, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "root",
    controlStates: [
      scriptedEndpoint("root", 1, ROOT_CONTROL_REASONS[1], "frame_1/DoAction.as", 67, 69),
      scriptedEndpoint("root", 6, ROOT_CONTROL_REASONS[6], "frame_6/DoAction.as", 71, 72),
      structuralEndpoint("root", 10, ROOT_CONTROL_REASONS[10]),
    ],
    frameLabels: [{frame: 6, label: "begin"}],
    namedPlacements: ROOT_NAMED_PLACEMENTS,
    evidence: sourceTimelineEvidence("root"),
  },
  {
    timelineId: "sprite-5",
    objectId: "5",
    frameCount: 1,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 1, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame", "terminal-structural-frame"], evidence: [sourceTimelineEvidence("sprite-5"), sourceTimelineEvidence("sprite-5")] }],
    frameLabels: [],
    namedPlacements: [],
    evidence: sourceTimelineEvidence("sprite-5"),
  },
  {
    timelineId: "sprite-80",
    objectId: "80",
    frameCount: 147,
    frameDomain: {indexing: "one-indexed", start: 1, endInclusive: 147, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [
      structuralEndpoint("sprite-80", 1, ["initial-one-indexed-frame"]),
      scriptedEndpoint("sprite-80", 147, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], "DefineSprite_80/frame_147/DoAction.as", 64, 65),
    ],
    frameLabels: [],
    namedPlacements: [],
    evidence: sourceTimelineEvidence("sprite-80"),
  },
] as const);

const DISPOSITION_SOURCE_EVIDENCE = deepFreeze({
  scenarioInventoryPath: "audit/scenario-inventory.json",
  scenarioInventorySha256: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.scenarioInventory.sha256,
  swfmillArtifactId: "swfmill-xml",
  swfmillPath: "audit/machine/swfmill.xml.gz",
  swfmillSha256: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.swfmillXml.sha256,
} as const);

const ROOT_TO_5 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-5",
  sourceObjectId: "5",
  frame: 6,
  depth: "2",
  instanceName: "Mc_Page_Title",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);
const ROOT_TO_80 = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-80",
  sourceObjectId: "80",
  frame: 6,
  depth: "4",
  instanceName: "animation",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

const unresolvedBasis =
  "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.";

export const COURSE_G04_L11_VB_002_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
  {
    timelineId: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: 10,
    structuralReachability: "root",
    rootPlacement: {status: "root-timeline", namedPlacementPath: []},
    knownNamedParentPlacements: [],
    declaredFrameDomains: [{frameDomainId: "root", kind: "root", sourceTimelineId: "root", sourceInstanceId: "", parentFrameDomainId: null, parentEntryFrame: null, localEntryFrame: null, frameCount: 10, role: ""}],
    disposition: "declared-frame-domain",
    dispositionBasis: "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains.",
    riskAssessment: {level: "none", independentFrameDomainCandidate: false, signals: ["source-timeline-already-declared-as-frame-domain"], interpretation: "No undeclared-domain triage signal; fidelity still depends on the declared domain's required runtime and visual evidence."},
    staticSignals: {controlStateCount: 3, frameLabelCount: 1, namedChildPlacementCount: 2},
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-5",
    sourceTimelineId: "sprite-5",
    sourceObjectId: "5",
    frameCount: 1,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_5]},
    knownNamedParentPlacements: [ROOT_TO_5],
    declaredFrameDomains: [],
    disposition: "unresolved",
    dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "review", independentFrameDomainCandidate: false, signals: ["undeclared-structurally-root-reachable-timeline", "direct-named-root-placement"], interpretation: "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain."},
    staticSignals: {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0},
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
  {
    timelineId: "sprite-80",
    sourceTimelineId: "sprite-80",
    sourceObjectId: "80",
    frameCount: 147,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: [ROOT_TO_80]},
    knownNamedParentPlacements: [ROOT_TO_80],
    declaredFrameDomains: [],
    disposition: "unresolved",
    dispositionBasis: unresolvedBasis,
    riskAssessment: {level: "high", independentFrameDomainCandidate: true, signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"], interpretation: "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent."},
    staticSignals: {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0},
    sourceEvidence: DISPOSITION_SOURCE_EVIDENCE,
  },
] as const);

export const COURSE_G04_L11_VB_002_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 3,
  enumeratedTimelineCount: 3,
  reachableChildTimelineCount: 2,
  excludedNotProvenTimelineCount: 0,
  dispositionCounts: {"declared-frame-domain": 1, "composite-child-with-parent": 0, "independent-required": 0, nonvisual: 0, unresolved: 2},
  highRiskIndependentCandidateCount: 1,
  highRiskIndependentCandidates: [{timelineId: "sprite-80", sourceObjectId: "80", frameCount: 147, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"]}],
} as const);

const rootRequirement = (language: "en" | "es", entryStateSha256: string) => ({
  requirementId: "req-default-root-" + language,
  scenario: "default",
  frameDomainId: "root",
  traceId: "default-root-" + language,
  language,
  seed: "0",
  requiredRange: {firstFrame: 1, lastFrame: 10},
  entryState: {kind: "initial-load", language},
  entryStateSha256,
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
} as const);

/** Only root EN/ES requirements are declared; nested requirements are not invented. */
export const COURSE_G04_L11_VB_002_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  rootRequirement("en", "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1"),
  rootRequirement("es", "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067"),
] as const);

const buttonBody = (keyAttribute: string) =>
  "on(release){\n   _global.KeyAttribute = \"" + keyAttribute + "\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}";

const action = (
  id: string,
  script: string,
  body: string,
  bodyBytes: number,
  bodySha256: string,
  lineStart: number,
  lineEnd: number,
  scope: Readonly<{kind: "root" | "sprite" | "button-definition"; objectId: string | null; frame: number | null}>,
  releaseEvent: boolean,
) => ({
  kind: "source-static-action",
  id,
  script,
  body,
  bodyBytes,
  bodySha256,
  lineStart,
  lineEnd,
  scope,
  event: releaseEvent ? "release" : null,
  legacyActionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
} as const);

/** All 12 extracted bodies are retained as inert strings and never evaluated. */
export const COURSE_G04_L11_VB_002_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_10/BUTTONCONDACTION on(release).as", buttonBody("Coordinate grid"), 124, "89ff000d8f5676a6d549683f1ca696a572d21fbd8cd5308596ddb74fd8b2bdb6", 1, 6, {kind: "button-definition", objectId: "10", frame: null}, true),
  action("script-0002", "DefineButton2_11/BUTTONCONDACTION on(release).as", buttonBody("Grid"), 113, "09ad65d3d830ae22d89d331c9a4b088b35ba05bce1c71f47e653519c05e04005", 8, 13, {kind: "button-definition", objectId: "11", frame: null}, true),
  action("script-0003", "DefineButton2_12/BUTTONCONDACTION on(release).as", buttonBody("Form"), 113, "3ea1d23d28e4762cc33e70cd8b7f5abecca86ed531d1b2b611d393f3fd3101e9", 15, 20, {kind: "button-definition", objectId: "12", frame: null}, true),
  action("script-0004", "DefineButton2_13/BUTTONCONDACTION on(release).as", buttonBody("Intersect"), 118, "5617c2f64e0db0e3bb532ca51f489df9b21314fa8d8baa5c6325eeda26c78c11", 22, 27, {kind: "button-definition", objectId: "13", frame: null}, true),
  action("script-0005", "DefineButton2_14/BUTTONCONDACTION on(release).as", buttonBody("Number line"), 120, "9af2b73747b39522e5b0be7156bc4b0939d87fed3e02176af9dd96a20350a86e", 29, 34, {kind: "button-definition", objectId: "14", frame: null}, true),
  action("script-0006", "DefineButton2_67/BUTTONCONDACTION on(release).as", buttonBody("Horizontal"), 119, "9626108d9dec8998b16490646daeb1ecd2f6e051936681ab0817ef64878de586", 36, 41, {kind: "button-definition", objectId: "67", frame: null}, true),
  action("script-0007", "DefineButton2_68/BUTTONCONDACTION on(release).as", buttonBody("X-axis"), 115, "200ad29ed015b519037675133190b59c6774d44f0cd4f44fd5893b530009c944", 43, 48, {kind: "button-definition", objectId: "68", frame: null}, true),
  action("script-0008", "DefineButton2_69/BUTTONCONDACTION on(release).as", buttonBody("Vertical"), 117, "48a3bbc99b9238983028dc1999b187a416ea0eb5a7f95eb20e63e9726f00bfcc", 50, 55, {kind: "button-definition", objectId: "69", frame: null}, true),
  action("script-0009", "DefineButton2_70/BUTTONCONDACTION on(release).as", buttonBody("Y-axis"), 115, "c5598698b7453ddd7fca28b5ec96574bf788312e79731f66de1662cba25db329", 57, 62, {kind: "button-definition", objectId: "70", frame: null}, true),
  action("script-0010", "DefineSprite_80/frame_147/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 64, 65, {kind: "sprite", objectId: "80", frame: 147}, false),
  action("script-0011", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 67, 69, {kind: "root", objectId: null, frame: 1}, false),
  action("script-0012", "frame_6/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 71, 72, {kind: "root", objectId: null, frame: 6}, false),
] as const);

const HIT_RECORDS = deepFreeze([
  {depth: "1", shapeObjectId: "9", transform: {transX: "0", transY: "0"}},
] as const);
const BUTTON_RELEASE_CONDITIONS = deepFreeze([
  {
    key: "0",
    menuEnter: "0",
    menuLeave: "0",
    next: "0",
    pointerDragEnter: "0",
    pointerDragLeave: "0",
    pointerEnter: "0",
    pointerLeave: "0",
    pointerPush: "0",
    pointerReleaseInside: "1",
    pointerReleaseOutside: "0",
  },
] as const);

const buttonPlacement = (objectId: string, depth: string, frame: number) => ({
  depth,
  frame,
  hasClipActions: false,
  name: "",
  objectId,
  replace: "0",
  tag: "PlaceObject2",
  timelineId: "sprite-80",
} as const);

const buttonTarget = (scriptId: string, buttonObjectId: string, keyAttribute: string, depth: string, frames: readonly [number, number]) => ({
  scriptId,
  buttonObjectId,
  releaseEvent: "release",
  keyAttribute,
  conditions: BUTTON_RELEASE_CONDITIONS,
  hitRecords: HIT_RECORDS,
  placements: [buttonPlacement(buttonObjectId, depth, frames[0]), buttonPlacement(buttonObjectId, depth, frames[1])],
  exactStageBoundsStatus: "not-derived-from-hit-shape-geometry",
} as const);

export const COURSE_G04_L11_VB_002_STATIC_BUTTON_TARGETS = deepFreeze([
  buttonTarget("script-0001", "10", "Coordinate grid", "4", [4, 64]),
  buttonTarget("script-0002", "11", "Grid", "6", [4, 64]),
  buttonTarget("script-0003", "12", "Form", "8", [4, 64]),
  buttonTarget("script-0004", "13", "Intersect", "10", [4, 64]),
  buttonTarget("script-0005", "14", "Number line", "12", [4, 64]),
  buttonTarget("script-0006", "67", "Horizontal", "57", [65, 133]),
  buttonTarget("script-0007", "68", "X-axis", "59", [65, 133]),
  buttonTarget("script-0008", "69", "Vertical", "61", [65, 133]),
  buttonTarget("script-0009", "70", "Y-axis", "63", [65, 133]),
] as const);

/** Four observed host blockers only; no undefined sibling-page symbol is copied in. */
export const COURSE_G04_L11_VB_002_STATIC_BLOCKED_HOST_DEPENDENCIES = deepFreeze([
  {sourceToken: "_global.KeyAttribute", status: "BLOCKED_UNVERIFIED", blocker: "The shared KeyAttribute state has observed assignments but no authorized host/default or execution evidence.", facts: null},
  {sourceToken: "_root.DoHyperLinks", status: "BLOCKED_UNVERIFIED", blocker: "The hyperlink host call appears in nine release handlers without authorized natural-entry evidence.", facts: null},
  {sourceToken: "_root.animation_mc.animation.stop", status: "BLOCKED_UNVERIFIED", blocker: "The nested animation stop target lacks an authorized host binding and natural interaction evidence.", facts: null},
  {sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")", status: "BLOCKED_UNVERIFIED", blocker: "The root preloader handoff is a host-dependent legacy operation with no authorized natural-entry runtime evidence.", facts: null},
] as const);

export const COURSE_G04_L11_VB_002_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 12,
  buttonReleaseHandlerCount: 9,
  doActionCount: 3,
  buttonDefinitionCount: 9,
  randomCallCount: 0,
  evalCallCount: 0,
  externalCallCandidateCount: 0,
  machineExternalCallCandidateCount: 0,
  hostDependencyTokenCount: 4,
  actionScriptExecuted: false,
  naturalInteractionProven: false,
  exactStageSpaceHitBounds: "not-derived-from-hit-shape-geometry",
} as const);

export const COURSE_G04_L11_VB_002_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  required: true,
  acceptanceEstablished: false,
  externalExactAssociations: [{
    kind: "catalog-exact-association",
    path: EXTERNAL_MP3_PATH,
    bytes: 245_616,
    sha256: "96ded911f573bdfdf125c4910ec0fc434a3eeabe02a55674a6b055bb53febbc0",
    language: "es",
    languageRouting: "legacy-host-routing-only",
    spokenLanguageContentVerified: false,
    format: "mp3",
    channels: 1,
    sampleRateHz: 48_000,
    durationMs: 17_544,
    startFrame: null,
    startSemantics: "host-user-activated",
    runtimeReachabilityVerified: false,
    originalRuntimeListeningAccepted: false,
    synchronizationVerified: false,
    stopBehaviorVerified: false,
    replayBehaviorVerified: false,
  }],
  embeddedStreams: [{
    id: "embedded-stream-0001",
    streamIndex: 1,
    contextKind: "sprite",
    sourceCharacterId: 80,
    timelineId: "sprite-80",
    contextDeclaredFrames: 147,
    headFrame: 1,
    firstBlockFrame: 3,
    lastBlockFrame: 147,
    blockCount: 145,
    totalDecodedSamples: 266_112,
    format: "mp3",
    syncMode: "stream",
    sampleRateHz: 22_050,
    sampleSizeBits: 16,
    channels: 1,
    durationExactMilliseconds: 12_068.571,
    durationRoundedMilliseconds: 12_069,
    rootCueFrame: null,
    rootCueResolved: false,
    runtimeReachabilityVerified: false,
    originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false,
    synchronizationVerified: false,
    stopBehaviorVerified: false,
    replayBehaviorVerified: false,
  }],
  strictAudioAcceptance: false,
} as const);

export const COURSE_G04_L11_VB_002_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  workspaceScope: "non-shell",
  runtimeScopeClassification: "shell-only-forensic-question",
  pageHandlerCount: 9,
  classificationTension: true,
  tension: "This non-shell page has nine source-static KeyAttribute handlers; a shell-only workspace classification cannot resolve, erase, or accept their host behavior.",
  exactMissingDependencies: [
    {
      canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml",
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml",
      status: "BLOCKED_NO_EXACT_SOURCE_BYTES",
      present: false,
      sourceBytes: null,
      bytes: null,
      sha256: null,
      successorReceipt: null,
      replacementAccepted: false,
      facts: null,
    },
    {
      canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml",
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml",
      status: "BLOCKED_NO_EXACT_SOURCE_BYTES",
      present: false,
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
      canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
      bytes: 378_783,
      sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
      replacementAccepted: false,
      disposition: "retrieval-lead-only-not-a-substitute",
    },
    {
      canonicalRelativePath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
      bytes: 374_466,
      sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
      replacementAccepted: false,
      disposition: "retrieval-lead-only-not-a-substitute",
    },
  ],
  leadsAreReplacement: false,
  pageHandlerExecutionProven: false,
  pageHandlerReachabilityProven: false,
  pageDependencyEstablished: false,
  runtimeResolutionVerified: false,
  ownerAccepted: false,
  strictCompletion: false,
  publication: false,
} as const);

export const COURSE_G04_L11_VB_002_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
  status: "OPEN_RECORDED",
  accepted: false,
  baselineRationaleRejected: true,
  sourceStaticLayerABlocked: false,
  strictAcceptanceEffect: "blocked-unresolved",
  exactRejectedFractionalRationale: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  affectedArtifacts: [
    {
      path: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.path,
      bytes: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.bytes,
      sha256: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.sha256,
      field: "runtime.rasterization.rationale",
    },
    {
      path: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.strictReadiness.path,
      bytes: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.strictReadiness.bytes,
      sha256: COURSE_G04_L11_VB_002_STATIC_EVIDENCE_CLOSURE.strictReadiness.sha256,
      field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale",
    },
  ],
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
    fractional: false,
    roundingApplied: false,
    exactIntegerConversion: true,
  },
  captureFacts: {
    widthPixels: 800,
    heightPixels: 600,
    structuralPngHashesBound: true,
    structuralPngDimensionsBound: true,
    structuralOnly: true,
  },
  originalRuntimeAuthorityEstablished: false,
  fidelityEstablished: false,
  strictCompletionEstablished: false,
  publicationEstablished: false,
} as const);

export const COURSE_G04_L11_VB_002_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  sourceBytesRehashed: true,
  sourceStaticLayerABlocked: false,
  javascriptImplementation: false,
  runtimeDependencyClosure: false,
  originalRuntimeFidelity: false,
  pixelComparison: false,
  audioCorrectnessOrSynchronizationAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictCompletion: false,
  publication: false,
  strictAcceptanceEffect: "blocked-unresolved",
} as const);

const validAnimation = (animationId: unknown): boolean =>
  animationId === COURSE_G04_L11_VB_002_STATIC_ANIMATION_ID;

export const getStaticSourceFacts = (animationId: unknown) =>
  validAnimation(animationId)
    ? COURSE_G04_L11_VB_002_STATIC_SOURCE_FACTS
    : blocked("animation-id-must-match-vb002-source-static-contract");

export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  validAnimation(animationId) && frameDomainId === "root"
    ? COURSE_G04_L11_VB_002_STATIC_DECLARED_ROOT_DOMAIN
    : blocked("animation-id-and-frame-domain-must-match-vb002-source-static-contract");

export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  validAnimation(animationId) && typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
    ? COURSE_G04_L11_VB_002_STATIC_ROOT_FRAME_FACTS[frame - 1]!
    : blocked("animation-id-and-one-indexed-root-frame-must-match-vb002-source-static-contract");

export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") {
    return blocked("animation-id-and-timeline-id-must-match-vb002-source-static-contract");
  }
  return COURSE_G04_L11_VB_002_STATIC_TIMELINE_DISPOSITIONS.find(
    (entry) => entry.timelineId === timelineId,
  ) ?? blocked("animation-id-and-timeline-id-must-match-vb002-source-static-contract");
};

export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) => {
  if (!validAnimation(animationId) || typeof scriptId !== "string") {
    return blocked("animation-id-and-script-id-must-match-vb002-source-static-contract");
  }
  return COURSE_G04_L11_VB_002_STATIC_ACTION_RECORDS.find((entry) => entry.id === scriptId)
    ?? blocked("animation-id-and-script-id-must-match-vb002-source-static-contract");
};

export const getStaticRootRequirement = (
  animationId: unknown,
  requirementId: unknown,
  language: unknown,
  scenario: unknown,
) => {
  if (!validAnimation(animationId) || typeof requirementId !== "string" || typeof language !== "string" || scenario !== "default") {
    return blocked("animation-id-requirement-language-and-scenario-must-match-vb002-source-static-contract");
  }
  return COURSE_G04_L11_VB_002_STATIC_ROOT_REQUIREMENTS.find(
    (entry) => entry.requirementId === requirementId && entry.language === language,
  ) ?? blocked("animation-id-requirement-language-and-scenario-must-match-vb002-source-static-contract");
};

export const getStaticAudioObligations = (animationId: unknown) =>
  validAnimation(animationId)
    ? COURSE_G04_L11_VB_002_STATIC_AUDIO_OBLIGATIONS
    : blocked("animation-id-must-match-vb002-source-static-contract");

export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  validAnimation(animationId)
    ? COURSE_G04_L11_VB_002_STATIC_BLOCKED_HOST_DEPENDENCIES
    : blocked("animation-id-must-match-vb002-source-static-contract");

export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  validAnimation(animationId)
    ? COURSE_G04_L11_VB_002_STATIC_KEY_TERMS_BOUNDARY
    : blocked("animation-id-must-match-vb002-source-static-contract");

export const getStaticEvidenceBoundary = (animationId: unknown) =>
  validAnimation(animationId)
    ? COURSE_G04_L11_VB_002_STATIC_EVIDENCE_BOUNDARY
    : blocked("animation-id-must-match-vb002-source-static-contract");

export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  validAnimation(animationId) && conflictId === COURSE_G04_L11_VB_002_STATIC_BASELINE_RATIONALE_CONFLICT.id
    ? COURSE_G04_L11_VB_002_STATIC_BASELINE_RATIONALE_CONFLICT
    : blocked("animation-id-and-conflict-id-must-match-vb002-source-static-contract");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");

export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");

export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");

export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
