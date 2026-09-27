/**
 * Internal VB005 source-static Layer A facts.
 *
 * This module is deliberately inert and unregistered. It binds exact source
 * observations without providing playback, rendering, host emulation, audio
 * output, or any acceptance path. Legacy AVM1 bodies are retained only as
 * frozen text and are never evaluated.
 */

export const COURSE_G04_L11_VB_005_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-005" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB05.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB05.fla";
const EXTERNAL_SPANISH_MP3_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/SA/L11VB05.mp3";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "0999c1fcec2bc839f0f3fdf266c71f3b12c18b835af6fdf9c0c9f55921c75a92";
const SOURCE_FLA_SHA256 =
  "904bc403a20d6f3a8907f747bc5259ddd00429c9ec80cc83f3ee65b0059eb0dc";
const EXTERNAL_SPANISH_MP3_SHA256 =
  "c9e81b3b81bbf2be5b17bd386e79fdfc4791e90ac014bc7389eee4f5b80aae09";

/** Exactly the ordered 22-member source-static evidence closure. */
export const COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 91_321, sha256: SOURCE_SHA256},
  sourceFla: {path: SOURCE_FLA_PATH, bytes: 482_816, sha256: SOURCE_FLA_SHA256},
  externalSpanishMp3: {path: EXTERNAL_SPANISH_MP3_PATH, bytes: 230_160, sha256: EXTERNAL_SPANISH_MP3_SHA256},
  lessonSourceXml: {path: LESSON_XML_PATH, bytes: 10_085, sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a"},
  lessonReleaseCatalog: {path: "catalog/lesson-releases.json", bytes: 145_216, sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511"},
  migrationManifest: {path: "migrations/course-g04-l11-vb-005/migration.json", bytes: 8_166, sha256: "f21cacdcb68dff113a95f923a963387138313ec38a1025c18621ba6a6a80939c"},
  machineReport: {path: "migrations/course-g04-l11-vb-005/audit/machine/report.json", bytes: 17_187, sha256: "f589f56fcb65de879bb1b6e861b8e07d0058667c687f6cbb72a6eca8d8ef8b1a"},
  ffdecHeader: {path: "migrations/course-g04-l11-vb-005/audit/machine/ffdec-header.txt", bytes: 188, sha256: "c88a215fa8c48046d776538dd7facc1a3f9ba87a996142bd84ac8c31b4a50e9d"},
  ffdecScriptIndex: {path: "migrations/course-g04-l11-vb-005/audit/machine/ffdec-script-index.txt", bytes: 2_091, sha256: "71236ae2b01539967540b71af9af044d78cda885656551c9c6da232c501b98b2"},
  ffdecScripts: {path: "migrations/course-g04-l11-vb-005/audit/machine/ffdec-scripts.txt.gz", bytes: 1_017, sha256: "dce7393751c0cb37a44500b4938cd47fa02e1dd2fdb1a03dd30d3a18e513c374", uncompressedBytes: 5_590, uncompressedSha256: "4c9b5393ebedca288db74b05da54c305a7f014d9b9eb23cd586651569ffe34ae"},
  ffdecTags: {path: "migrations/course-g04-l11-vb-005/audit/machine/ffdec-tags.txt.gz", bytes: 38_263, sha256: "6602835a901676e180b1c624097127fc9545e16b0066f4b3aee043f7274cd8e8", uncompressedBytes: 216_399, uncompressedSha256: "75d222deeca3e79330ebd39071d94adf3cbcfb25a5462ef93934333aa0ac38ad"},
  frameDomainCandidates: {path: "migrations/course-g04-l11-vb-005/audit/machine/swf-frame-domain-candidates.json", bytes: 5_419, sha256: "dc16957e4a014ba06ca6a6ed4861e897aa004e2433086926a75249785ec611ba"},
  swfmillSummary: {path: "migrations/course-g04-l11-vb-005/audit/machine/swfmill-summary.json", bytes: 3_430, sha256: "3f6d8ced2cea17300f9999d394fc36a535c39542d421bee357b4a7b234a96ea9"},
  swfmillXml: {path: "migrations/course-g04-l11-vb-005/audit/machine/swfmill.xml.gz", bytes: 119_786, sha256: "12703f6df9724d5cdd16279ec326316b41397eb4eaa2e007ae014c5d9edefbae", uncompressedBytes: 760_625, uncompressedSha256: "16724815043d36ac8113e1345ddc2db5c1d6382e864fa23d0df090e92ee95310"},
  scenarioInventory: {path: "migrations/course-g04-l11-vb-005/audit/scenario-inventory.json", bytes: 364_840, sha256: "35ca7064371194c1e122c9f245cbd3abc4fbf28c7b7a0065baac4815bb83b79b"},
  frameDomainDisposition: {path: "migrations/course-g04-l11-vb-005/audit/frame-domain-disposition.json", bytes: 36_208, sha256: "0b4925c73e10171abba1398a95ff8bb2e5270861ed471c8ec8ce4eddfa50e56c"},
  runtimeDependencyWorkspaceScope: {path: "migrations/course-g04-l11-vb-005/audit/runtime-dependency-scope.json", bytes: 3_607, sha256: "d9aeb166c56a16e3b8b60ed4a9e36c38356276f44ce3de590674b7e566133b11"},
  audioRuntimeEvidence: {path: "migrations/course-g04-l11-vb-005/audit/audio-runtime-evidence.json", bytes: 22_395, sha256: "4fabc3f963e1261ce5589b3465f9faa89d429a6f8c2d7f6bf634546a89d58dae"},
  audioInventory: {path: "migrations/course-g04-l11-vb-005/audio-inventory.csv", bytes: 4_932, sha256: "ef487eea70e9f284ff1075630d102f1f08aee5cd4bc76596044183e0f9fb0185"},
  fullFrameCoverage: {path: "migrations/course-g04-l11-vb-005/evidence/full-frame-coverage.json", bytes: 2_039, sha256: "8ff63dd13a33787a8c5fe161b3799c64fadf1375d4164683094b9e279ab00773"},
  strictReadiness: {path: "migrations/course-g04-l11-vb-005/audit/strict-readiness.json", bytes: 18_113, sha256: "1e6f98dc62180ab85becda03bdc9d90c8d84d22796df4a97332a9b84ebe5eeca"},
  structuralRootBaseline: {path: "migrations/course-g04-l11-vb-005/baseline/ffdec-root-frames.json", bytes: 3_563, sha256: "7d23da4292dcab5927c9d64492ddad943c8d61fb9e273bc2afaa79f05d5fe5c5"},
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

export const COURSE_G04_L11_VB_005_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_005_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.sourceSwf,
    fla: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.sourceFla,
    pairedFlaStatus: "present",
    provenance: "owner-provided",
    aliasOf: null,
    variantOf: null,
  },
  evidenceLanes: {
    machine: {auditStatus: "partial", sourceHashMatchesBeforeAndAfter: true, flaHashMatchesBeforeAndAfter: true},
    perFileAuthoring: {
      required: true,
      status: "not-complete-legacy-conversion-dialog",
      comprehensiveCurrentContract: false,
      strictAcceptanceEffect: false,
      blocker: "Adobe Animate 2021 is installed and its disposable-document JSFL probe passes, but the legacy ActionScript conversion dialog prevents an unattended, hash-bound per-file FLA audit.",
    },
    lanesAreDistinct: true,
  },
  lessonXml: {
    activePageCount: 43,
    subtitleCount: 19,
    activeOrdinal: 8,
    releaseOrdinal: 8,
    sectionLocalPageOrdinal: 5,
    activeVisualBuilderSubordinal: 4,
    pageLine: 48,
    exactPageText: "<Page Title=\"Axis Practice\" RandomAudio=\"\" BGText=\"\">VB/L11VB05.swf</Page>",
    subtitleLine: 58,
    exactSubtitleText: "<SubPageTitle EngSubTitleName=\"4. Axis Practice\" SpanSubTitleName=\"Práctica de ejes\" SubTitleButtonName=\"L11VB05\">VB/L11VB05.swf</SubPageTitle>",
    title: "Axis Practice",
    spanishSubtitle: "Práctica de ejes",
    uniqueActivePageOccurrence: true,
    uniqueSubtitleOccurrence: true,
    commentedVisualBuilderOneExcludedFromActiveOrdinal: true,
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
      ordinal: 8,
      animationId: COURSE_G04_L11_VB_005_STATIC_ANIMATION_ID,
      assetId: "swf-" + SOURCE_SHA256,
      releaseRole: "active-xml-referenced-page",
      batchId: "g04-l11-host-language",
      shardId: "g04-l11-host-language",
      source: {path: "HELP_COURSES/ELMGR4/L11/VB/L11VB05.swf", sha256: SOURCE_SHA256},
      xmlOccurrence: 8,
    },
  },
  runtimeHeader: {
    signature: "CWS",
    version: 6,
    compression: "ZLIB",
    physicalSourceBytes: 91_321,
    declaredUncompressedBytes: 143_483,
    inflatedBodyBytes: 143_475,
    reconstructedUncompressedBytes: 143_483,
    actionScriptVersion: "AS1/2",
    stage: {
      rectNBits: 15,
      xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000,
      widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20,
      widthPixels: 800, heightPixels: 600,
      fractionalNativeStage: false, roundingApplied: false, exactIntegerConversion: true,
    },
    rawFrameRateField: 3_072,
    fps: 12,
    rootFrameCount: 10,
    durationMilliseconds: 10 / 12 * 1_000,
    backgroundColor: "#b8d8f7",
  },
  migration: {
    status: "preserved",
    rendering: "undecided",
    route: "", routeFile: "", component: "", registryModule: "",
    timelineModule: "", testFile: "", standalonePackage: "",
    defaultFrameDomainId: "root",
    registered: false,
    currentJavascriptImplementation: false,
  },
} as const);

export const COURSE_G04_L11_VB_005_STATIC_TAG_COUNTS = deepFreeze({
  DefineButton2: 6, DefineFont2: 4, DefineShape: 10, DefineShape2: 4,
  DefineShape3: 2, DefineSprite: 12, DefineText: 63, DoAction: 24,
  FrameLabel: 5, PlaceObject2: 938, RemoveObject2: 64, ShowFrame: 300,
  SoundStreamBlock: 268, SoundStreamHead: 7, EndAction: 36,
  Button: 23, Condition: 6, Event: 8, UnknownTag: 1,
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {depth: "2", frame: 6, hasClipActions: false, name: "Mc_Page_Title", objectId: "5", replace: "0", tag: "PlaceObject2"},
  {depth: "4", frame: 6, hasClipActions: false, name: "animation", objectId: "101", replace: "0", tag: "PlaceObject2"},
] as const);

const ROOT_CONTROL_REASONS = deepFreeze({
  1: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"],
  6: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"],
  10: ["terminal-structural-frame"],
} as const);

export const COURSE_G04_L11_VB_005_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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

export const COURSE_G04_L11_VB_005_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

type StaticScriptEvidence = Readonly<{script: string; lineStart: number; lineEnd: number}>;
const controlState = (frame: number, reasons: readonly string[], scriptEvidence: readonly StaticScriptEvidence[] = []) => ({
  frame,
  reasons,
  scriptEvidence,
  actionScriptExecuted: false,
  naturalEntryProven: false,
} as const);
const scriptEvidence = (script: string, lineStart: number, lineEnd: number) => ({script, lineStart, lineEnd} as const);
const timeline = (
  timelineId: string,
  objectId: string | null,
  frameCount: number,
  structuralReachability: "root" | "reachable-from-root-placement-graph" | "not-proven-by-root-placement-graph",
  controlStates: readonly ReturnType<typeof controlState>[],
  frameLabels: readonly Readonly<{frame: number; label: string}>[] = [],
  namedPlacements: readonly Readonly<{depth: string; frame: number; hasClipActions: boolean; name: string; objectId: string; replace: string; tag: string}>[] = [],
) => ({
  timelineId, objectId, frameCount,
  frameDomain: {indexing: "one-indexed", start: 1, endInclusive: frameCount, captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
  structuralReachability,
  controlStates,
  frameLabels,
  namedPlacements,
  sourceStaticOnly: true,
  naturalRuntimeReachabilityProven: false,
} as const);

/** Exact source-static projection of all 13 scenario-inventory timelines. */
export const COURSE_G04_L11_VB_005_STATIC_SCENARIO_TIMELINE_INVENTORY = deepFreeze([
  timeline("root", null, 10, "root", [
    controlState(1, ROOT_CONTROL_REASONS[1], [scriptEvidence("frame_1/DoAction.as", 233, 235)]),
    controlState(6, ROOT_CONTROL_REASONS[6], [scriptEvidence("frame_6/DoAction.as", 237, 238)]),
    controlState(10, ROOT_CONTROL_REASONS[10]),
  ], [{frame: 6, label: "begin"}], ROOT_NAMED_PLACEMENTS),
  timeline("sprite-5", "5", 1, "reachable-from-root-placement-graph", [controlState(1, ["initial-one-indexed-frame", "terminal-structural-frame"])]),
  timeline("sprite-67", "67", 1, "reachable-from-root-placement-graph", [controlState(1, ["initial-one-indexed-frame", "terminal-structural-frame"])]),
  timeline("sprite-68", "68", 1, "reachable-from-root-placement-graph", [controlState(1, ["initial-one-indexed-frame", "terminal-structural-frame"])]),
  timeline("sprite-70", "70", 55, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_1/DoAction.as", 157, 158)]),
    controlState(2, ["exported-action-script", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_2/DoAction.as", 163, 172)]),
    controlState(3, ["frame-label:S1"]),
    controlState(16, ["exported-action-script", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_16/DoAction.as", 160, 161)]),
    controlState(18, ["frame-label:S2"]),
    controlState(27, ["exported-action-script", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_27/DoAction.as", 174, 175)]),
    controlState(31, ["frame-label:S3"]),
    controlState(36, ["exported-action-script", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_36/DoAction.as", 177, 178)]),
    controlState(40, ["frame-label:S4"]),
    controlState(54, ["exported-action-script", "structural-action:DoAction"], [scriptEvidence("DefineSprite_70/frame_54/DoAction.as", 180, 181)]),
    controlState(55, ["terminal-structural-frame"]),
  ], [{frame: 3, label: "S1"}, {frame: 18, label: "S2"}, {frame: 31, label: "S3"}, {frame: 40, label: "S4"}]),
  timeline("sprite-73", "73", 2, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_73/frame_1/DoAction.as", 183, 184)]),
    controlState(2, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_73/frame_2/DoAction.as", 186, 187)]),
  ]),
  timeline("sprite-75", "75", 2, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_75/frame_1/DoAction.as", 189, 190)]),
    controlState(2, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_75/frame_2/DoAction.as", 192, 193)]),
  ]),
  timeline("sprite-83", "83", 5, "not-proven-by-root-placement-graph", [
    controlState(1, ["initial-one-indexed-frame"]),
    controlState(5, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_83/frame_5/DoAction.as", 195, 196)]),
  ]),
  timeline("sprite-90", "90", 16, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_90/frame_1/DoAction.as", 198, 205)]),
    controlState(16, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_90/frame_16/DoAction.as", 207, 208)]),
  ], [], [{depth: "1", frame: 1, hasClipActions: false, name: "BtnClose", objectId: "84", replace: "0", tag: "PlaceObject2"}]),
  timeline("sprite-94", "94", 16, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_94/frame_1/DoAction.as", 210, 217)]),
    controlState(16, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_94/frame_16/DoAction.as", 219, 220)]),
  ], [], [{depth: "1", frame: 1, hasClipActions: false, name: "BtnClose", objectId: "84", replace: "0", tag: "PlaceObject2"}]),
  timeline("sprite-96", "96", 20, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_96/frame_1/DoAction.as", 222, 223)]),
    controlState(20, ["exported-action-script", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_96/frame_20/DoAction.as", 225, 231)]),
  ]),
  timeline("sprite-100", "100", 29, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"], [scriptEvidence("DefineSprite_100/frame_1/DoAction.as", 43, 44)]),
    controlState(29, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_100/frame_29/DoAction.as", 46, 54)]),
  ]),
  timeline("sprite-101", "101", 142, "reachable-from-root-placement-graph", [
    controlState(1, ["exported-action-script", "initial-one-indexed-frame", "structural-action:DoAction"], [scriptEvidence("DefineSprite_101/frame_1/DoAction.as", 56, 56)]),
    controlState(102, ["event-handler:press", "event-handler:releaseOutside+release", "exported-action-script", "script-stop-state", "structural-action:DoAction"], [
      scriptEvidence("DefineSprite_101/frame_102/DoAction.as", 59, 84),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD on(press).as", 86, 89),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD on(releaseOutside,release).as", 91, 112),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD onClipEvent(load).as", 114, 118),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD on(press).as", 120, 123),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD on(releaseOutside,release).as", 125, 146),
      scriptEvidence("DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD onClipEvent(load).as", 148, 152),
    ]),
    controlState(142, ["exported-action-script", "script-stop-state", "structural-action:DoAction", "terminal-structural-frame"], [scriptEvidence("DefineSprite_101/frame_142/DoAction.as", 154, 155)]),
  ], [], [
    {depth: "92", frame: 102, hasClipActions: false, name: "Scr_1", objectId: "67", replace: "0", tag: "PlaceObject2"},
    {depth: "100", frame: 102, hasClipActions: false, name: "Scr_2", objectId: "68", replace: "0", tag: "PlaceObject2"},
    {depth: "108", frame: 102, hasClipActions: false, name: "Coach_audio_1", objectId: "70", replace: "0", tag: "PlaceObject2"},
    {depth: "110", frame: 102, hasClipActions: false, name: "Tar_1", objectId: "73", replace: "0", tag: "PlaceObject2"},
    {depth: "119", frame: 102, hasClipActions: false, name: "Tar_2", objectId: "75", replace: "0", tag: "PlaceObject2"},
    {depth: "128", frame: 102, hasClipActions: false, name: "Wrong_Feedx", objectId: "90", replace: "0", tag: "PlaceObject2"},
    {depth: "146", frame: 102, hasClipActions: false, name: "Wrong_Feedy", objectId: "94", replace: "0", tag: "PlaceObject2"},
    {depth: "164", frame: 102, hasClipActions: false, name: "Coach_audio_2", objectId: "96", replace: "0", tag: "PlaceObject2"},
    {depth: "166", frame: 102, hasClipActions: false, name: "RightFeed", objectId: "100", replace: "0", tag: "PlaceObject2"},
  ]),
] as const);

const ROOT_TO_5 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-5", sourceObjectId: "5", frame: 6, depth: "2", instanceName: "Mc_Page_Title", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const ROOT_TO_101 = deepFreeze({parentTimelineId: "root", childTimelineId: "sprite-101", sourceObjectId: "101", frame: 6, depth: "4", instanceName: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const childPlacement = (objectId: string, depth: string, instanceName: string) => ({parentTimelineId: "sprite-101", childTimelineId: "sprite-" + objectId, sourceObjectId: objectId, frame: 102, depth, instanceName, tag: "PlaceObject2", replace: "0", hasClipActions: false} as const);
const unresolvedBasis = "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.";
const unresolvedInterpretation = (independent: boolean) => independent
  ? "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent."
  : "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain.";
const disposition = (
  timelineId: string,
  sourceObjectId: string,
  frameCount: number,
  path: readonly Readonly<Record<string, unknown>>[],
  riskLevel: "review" | "high",
  independentFrameDomainCandidate: boolean,
  signals: readonly string[],
  staticSignals: Readonly<{controlStateCount: number; frameLabelCount: number; namedChildPlacementCount: number}>,
) => ({
  timelineId, sourceTimelineId: timelineId, sourceObjectId, frameCount,
  structuralReachability: "reachable-from-root-placement-graph",
  rootPlacement: {status: "proven-named-placement-chain", namedPlacementPath: path},
  knownNamedParentPlacements: [path[path.length - 1]],
  declaredFrameDomains: [],
  disposition: "unresolved",
  dispositionBasis: unresolvedBasis,
  riskAssessment: {level: riskLevel, independentFrameDomainCandidate, signals, interpretation: unresolvedInterpretation(independentFrameDomainCandidate)},
  staticSignals,
  sourceStaticOnly: true,
  authoritativeDispositionEstablished: false,
} as const);

const P67 = deepFreeze(childPlacement("67", "92", "Scr_1"));
const P68 = deepFreeze(childPlacement("68", "100", "Scr_2"));
const P70 = deepFreeze(childPlacement("70", "108", "Coach_audio_1"));
const P73 = deepFreeze(childPlacement("73", "110", "Tar_1"));
const P75 = deepFreeze(childPlacement("75", "119", "Tar_2"));
const P90 = deepFreeze(childPlacement("90", "128", "Wrong_Feedx"));
const P94 = deepFreeze(childPlacement("94", "146", "Wrong_Feedy"));
const P96 = deepFreeze(childPlacement("96", "164", "Coach_audio_2"));
const P100 = deepFreeze(childPlacement("100", "166", "RightFeed"));

/** The exact 12-row disposition set; sprite-83 is intentionally excluded. */
export const COURSE_G04_L11_VB_005_STATIC_TIMELINE_DISPOSITIONS = deepFreeze([
  {
    timelineId: "root", sourceTimelineId: "root", sourceObjectId: null, frameCount: 10, structuralReachability: "root",
    rootPlacement: {status: "root-timeline", namedPlacementPath: []}, knownNamedParentPlacements: [],
    declaredFrameDomains: [{frameDomainId: "root", kind: "root", sourceTimelineId: "root", sourceInstanceId: "", parentFrameDomainId: null, parentEntryFrame: null, localEntryFrame: null, frameCount: 10, role: ""}],
    disposition: "declared-frame-domain",
    dispositionBasis: "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains.",
    riskAssessment: {level: "none", independentFrameDomainCandidate: false, signals: ["source-timeline-already-declared-as-frame-domain"], interpretation: "No undeclared-domain triage signal; fidelity still depends on the declared domain's required runtime and visual evidence."},
    staticSignals: {controlStateCount: 3, frameLabelCount: 1, namedChildPlacementCount: 2},
    sourceStaticOnly: true, authoritativeDispositionEstablished: true,
  },
  disposition("sprite-5", "5", 1, [ROOT_TO_5], "review", false, ["undeclared-structurally-root-reachable-timeline", "direct-named-root-placement"], {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-67", "67", 1, [ROOT_TO_101, P67], "review", false, ["undeclared-structurally-root-reachable-timeline"], {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-68", "68", 1, [ROOT_TO_101, P68], "review", false, ["undeclared-structurally-root-reachable-timeline"], {controlStateCount: 1, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-70", "70", 55, [ROOT_TO_101, P70], "high", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "at-least-10-static-control-states"], {controlStateCount: 11, frameLabelCount: 4, namedChildPlacementCount: 0}),
  disposition("sprite-73", "73", 2, [ROOT_TO_101, P73], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-75", "75", 2, [ROOT_TO_101, P75], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-90", "90", 16, [ROOT_TO_101, P90], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 1}),
  disposition("sprite-94", "94", 16, [ROOT_TO_101, P94], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 1}),
  disposition("sprite-96", "96", 20, [ROOT_TO_101, P96], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-100", "100", 29, [ROOT_TO_101, P100], "review", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root"], {controlStateCount: 2, frameLabelCount: 0, namedChildPlacementCount: 0}),
  disposition("sprite-101", "101", 142, [ROOT_TO_101], "high", true, ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"], {controlStateCount: 3, frameLabelCount: 0, namedChildPlacementCount: 9}),
] as const);

export const COURSE_G04_L11_VB_005_STATIC_TIMELINE_SUMMARY = deepFreeze({
  status: "structurally-enumerated-dispositions-unresolved",
  inventoryTimelineCount: 13,
  enumeratedTimelineCount: 12,
  reachableChildTimelineCount: 11,
  excludedNotProvenTimelineCount: 1,
  excludedTimelineIds: ["sprite-83"],
  dispositionCounts: {"declared-frame-domain": 1, "composite-child-with-parent": 0, "independent-required": 0, nonvisual: 0, unresolved: 11},
  highRiskIndependentCandidateCount: 2,
  highRiskIndependentCandidates: [
    {timelineId: "sprite-101", sourceObjectId: "101", frameCount: 142, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "local-frame-count-at-least-100", "direct-named-root-placement"]},
    {timelineId: "sprite-70", sourceObjectId: "70", frameCount: 55, rootPlacementStatus: "proven-named-placement-chain", signals: ["undeclared-structurally-root-reachable-timeline", "multiframe-local-playhead", "local-frame-count-exceeds-root", "at-least-10-static-control-states"]},
  ],
  sprite83ScenarioOnly: true,
  sprite83DispositionExcluded: true,
} as const);

type StaticActionScope = Readonly<{
  kind: "root" | "sprite" | "button-definition";
  objectId: string | null;
  frame: number | null;
}>;
type StaticHitTargetCandidate = Readonly<{objectId: string; depth: string}> | null;
const action = (
  id: string,
  script: string,
  body: string,
  bodyBytes: number,
  bodySha256: string,
  inventoryLineStart: number,
  inventoryLineEnd: number,
  scope: StaticActionScope,
  hitTargetCandidate: StaticHitTargetCandidate,
  event: readonly string[],
  categories: readonly string[],
) => ({
  kind: "source-static-action",
  id, script, body, bodyBytes, bodySha256,
  inventoryLineStart, inventoryLineEnd,
  bodyLineStart: inventoryLineStart + 1,
  bodyLineEnd: inventoryLineStart + Math.max(1, body.split("\n").length),
  scope, hitTargetCandidate, event, categories,
  bodyStoredAsInertText: true,
  legacyActionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
} as const);
const buttonScope = (objectId: string): StaticActionScope => ({kind: "button-definition", objectId, frame: null});
const spriteScope = (objectId: string, frame: number): StaticActionScope => ({kind: "sprite", objectId, frame});
const rootScope = (frame: number): StaticActionScope => ({kind: "root", objectId: null, frame});
const STOP_BODY = "stop();";
const GOTO_ONE_BODY = "gotoAndStop(1);";
const hyperlinkButtonBody = (keyAttribute: string) =>
  "on(release){\n   _global.KeyAttribute = \"" + keyAttribute + "\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}";
const GLOSSARY_HELPER_BODY =
  "function DoHyperLinksTemp(strKeyTermVar)\n{\n   _global.KeyAttribute = strKeyTermVar;\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\nstop();";

/** All 36 exact AVM1 bodies are frozen inert strings and are never evaluated. */
export const COURSE_G04_L11_VB_005_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_54/BUTTONCONDACTION on(release).as", hyperlinkButtonBody("X-axis"), 115, "200ad29ed015b519037675133190b59c6774d44f0cd4f44fd5893b530009c944", 1, 6, buttonScope("54"), null, ["release"], ["glossary-or-hyperlink"]),
  action("script-0002", "DefineButton2_55/BUTTONCONDACTION on(release).as", hyperlinkButtonBody("Y-axis"), 115, "c5598698b7453ddd7fca28b5ec96574bf788312e79731f66de1662cba25db329", 8, 13, buttonScope("55"), null, ["release"], ["glossary-or-hyperlink"]),
  action("script-0003", "DefineButton2_56/BUTTONCONDACTION on(release).as", hyperlinkButtonBody("Position"), 117, "304127fdc57bb26ccc448ae8e7dbd1f13d4d2de28e06692949c94ff1365e28fe", 15, 20, buttonScope("56"), null, ["release"], ["glossary-or-hyperlink"]),
  action("script-0004", "DefineButton2_57/BUTTONCONDACTION on(release).as", hyperlinkButtonBody("Coordinate grid"), 124, "89ff000d8f5676a6d549683f1ca696a572d21fbd8cd5308596ddb74fd8b2bdb6", 22, 27, buttonScope("57"), null, ["release"], ["glossary-or-hyperlink"]),
  action("script-0005", "DefineButton2_84/BUTTONCONDACTION on(release).as", "on(release){\n   this._visible = false;\n   _parent.doEnableMc();\n   this.gotoAndStop(1);\n}", 89, "bd3c1865d8c974ebd860a54ee99de3f9b2212949ec49c8a62a864c88506d43a0", 29, 34, buttonScope("84"), null, ["release"], ["navigation-or-timeline"]),
  action("script-0006", "DefineButton2_89/BUTTONCONDACTION on(release).as", hyperlinkButtonBody("Number"), 115, "a8b57202ecdc28db0a1f0ce0b1dff5d369b7e4aa2378e057887211b8d3718da1", 36, 41, buttonScope("89"), null, ["release"], ["glossary-or-hyperlink"]),
  action("script-0007", "DefineSprite_100/frame_1/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 43, 44, spriteScope("100", 1), null, [], []),
  action("script-0008", "DefineSprite_100/frame_29/DoAction.as", "stop();\n_parent.doEnableMc();\nif(_global.quizDragCount >= 2)\n{\n   _global.quizSection = false;\n   _parent.play();\n}\ngotoAndStop(1);", 131, "a9b6d796f7df4521681ab2d09e69d19474b6c90516546bee51657d56d716350c", 46, 54, spriteScope("100", 29), null, [], ["navigation-or-timeline"]),
  action("script-0009", "DefineSprite_101/frame_1/DoAction.as", "", 0, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", 56, 56, spriteScope("101", 1), null, [], []),
  action("script-0010", "DefineSprite_101/frame_102/DoAction.as", "function doDisableMc()\n{\n   i = 1;\n   while(i <= 5)\n   {\n      eval(\"Scr_\" + i).enabled = false;\n      i++;\n   }\n}\nfunction doEnableMc()\n{\n   i = 1;\n   while(i <= 5)\n   {\n      eval(\"Scr_\" + i).enabled = true;\n      i++;\n   }\n}\nstop();\n_global.quizSection = true;\n_global.quizDragCount = 0;\nMc_Popup._visible = false;\nWrong_Feedx._visible = false;\nWrong_Feedy._visible = false;\nWrong_Feed._visible = false;", 406, "080e68187ccbefe0b738a2c11858e128a55ff392b98347bcb946bb9436cabea8", 59, 84, spriteScope("101", 102), null, [], ["popup"]),
  action("script-0011", "DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD on(press).as", "on(press){\n   this.startDrag();\n}", 33, "5ddf1e9c427b06cd1c5ac461fd9ef16b36423809663969936375e2154d40aebc", 86, 89, spriteScope("101", 102), {objectId: "67", depth: "92"}, ["press"], ["drag"]),
  action("script-0012", "DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD on(releaseOutside,release).as", "on(releaseOutside,release){\n   stopDrag();\n   tempSplSrc = this._name.split(\"_\");\n   if(eval(this._droptarget) == _parent[\"Tar_\" + tempSplSrc[tempSplSrc.length - 1]])\n   {\n      _global.quizDragCount++;\n      _parent[\"Tar_\" + tempSplSrc[tempSplSrc.length - 1]]._alpha = 100;\n      _parent.RightFeed.gotoAndPlay(2);\n      _parent.doDisableMc();\n      this._visible = false;\n      _parent.Tar_1.play();\n   }\n   else\n   {\n      this._x = oX;\n      this._y = oY;\n      _parent.doDisableMc();\n      _parent.Wrong_Feedx._visible = true;\n      _parent.Coach_audio_1.gotoAndPlay(2);\n   }\n}", 581, "3f99323f120e3055bf41ba3d889d2df8fe38088a017e69f6cb1ed63b9959e423", 91, 112, spriteScope("101", 102), {objectId: "67", depth: "92"}, ["releaseOutside", "release"], ["audio-control", "drag", "navigation-or-timeline"]),
  action("script-0013", "DefineSprite_101/frame_102/PlaceObject2_67_92/CLIPACTIONRECORD onClipEvent(load).as", "onClipEvent(load){\n   oX = _X;\n   oY = _Y;\n}", 44, "e110a1719f4fed05ed754b7a8c74a3ed0c95834e94b4082441706172c42ac2ec", 114, 118, spriteScope("101", 102), {objectId: "67", depth: "92"}, [], []),
  action("script-0014", "DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD on(press).as", "on(press){\n   this.startDrag();\n}", 33, "5ddf1e9c427b06cd1c5ac461fd9ef16b36423809663969936375e2154d40aebc", 120, 123, spriteScope("101", 102), {objectId: "68", depth: "100"}, ["press"], ["drag"]),
  action("script-0015", "DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD on(releaseOutside,release).as", "on(releaseOutside,release){\n   stopDrag();\n   tempSplSrc = this._name.split(\"_\");\n   if(eval(this._droptarget) == _parent[\"Tar_\" + tempSplSrc[tempSplSrc.length - 1]])\n   {\n      _global.quizDragCount++;\n      _parent[\"Tar_\" + tempSplSrc[tempSplSrc.length - 1]]._alpha = 100;\n      _parent.RightFeed.gotoAndPlay(2);\n      _parent.doDisableMc();\n      this._visible = false;\n      _parent.Tar_2.play();\n   }\n   else\n   {\n      this._x = oX;\n      this._y = oY;\n      _parent.doDisableMc();\n      _parent.Wrong_Feedy._visible = true;\n      _parent.Coach_audio_1.gotoAndPlay(2);\n   }\n}", 581, "65e282eb2f9d03ab6e76a245e93e0749f058d8bcc94dfbd9dbd6df56850419b3", 125, 146, spriteScope("101", 102), {objectId: "68", depth: "100"}, ["releaseOutside", "release"], ["audio-control", "drag", "navigation-or-timeline"]),
  action("script-0016", "DefineSprite_101/frame_102/PlaceObject2_68_100/CLIPACTIONRECORD onClipEvent(load).as", "onClipEvent(load){\n   oX = _X;\n   oY = _Y;\n}", 44, "e110a1719f4fed05ed754b7a8c74a3ed0c95834e94b4082441706172c42ac2ec", 148, 152, spriteScope("101", 102), {objectId: "68", depth: "100"}, [], []),
  action("script-0017", "DefineSprite_101/frame_142/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 154, 155, spriteScope("101", 142), null, [], []),
  action("script-0018", "DefineSprite_70/frame_1/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 157, 158, spriteScope("70", 1), null, [], []),
  action("script-0019", "DefineSprite_70/frame_16/DoAction.as", GOTO_ONE_BODY, 15, "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469", 160, 161, spriteScope("70", 16), null, [], ["navigation-or-timeline"]),
  action("script-0020", "DefineSprite_70/frame_2/DoAction.as", "stop();\n_global.rndAudio = new Array();\n_global.rndAudio[0] = \"S1\";\n_global.rndAudio[1] = \"S2\";\n_global.rndAudio[2] = \"S3\";\n_global.rndAudio[3] = \"S4\";\ntempInt = random(_global.rndAudio.length);\ntempLabel = _global.rndAudio[tempInt];\ngotoAndPlay(tempLabel);", 257, "790951eecf396145aff2136f219c1d0b45d08bca5bb74399896964f76eab6109", 163, 172, spriteScope("70", 2), null, [], ["audio-control", "navigation-or-timeline", "random-selection"]),
  action("script-0021", "DefineSprite_70/frame_27/DoAction.as", GOTO_ONE_BODY, 15, "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469", 174, 175, spriteScope("70", 27), null, [], ["navigation-or-timeline"]),
  action("script-0022", "DefineSprite_70/frame_36/DoAction.as", GOTO_ONE_BODY, 15, "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469", 177, 178, spriteScope("70", 36), null, [], ["navigation-or-timeline"]),
  action("script-0023", "DefineSprite_70/frame_54/DoAction.as", GOTO_ONE_BODY, 15, "da4b208bade877aed3e84a9aff2c55494bbf329c6bc8ac6b34e3b66fd90fd469", 180, 181, spriteScope("70", 54), null, [], ["navigation-or-timeline"]),
  action("script-0024", "DefineSprite_73/frame_1/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 183, 184, spriteScope("73", 1), null, [], []),
  action("script-0025", "DefineSprite_73/frame_2/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 186, 187, spriteScope("73", 2), null, [], []),
  action("script-0026", "DefineSprite_75/frame_1/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 189, 190, spriteScope("75", 1), null, [], []),
  action("script-0027", "DefineSprite_75/frame_2/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 192, 193, spriteScope("75", 2), null, [], []),
  action("script-0028", "DefineSprite_83/frame_5/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 195, 196, spriteScope("83", 5), null, [], []),
  action("script-0029", "DefineSprite_90/frame_1/DoAction.as", GLOSSARY_HELPER_BODY, 158, "9355d4b96421f8aa4084fc6d93e95c8f03892161bc1c306c780382c45ee9e1ed", 198, 205, spriteScope("90", 1), null, [], ["glossary-or-hyperlink"]),
  action("script-0030", "DefineSprite_90/frame_16/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 207, 208, spriteScope("90", 16), null, [], []),
  action("script-0031", "DefineSprite_94/frame_1/DoAction.as", GLOSSARY_HELPER_BODY, 158, "9355d4b96421f8aa4084fc6d93e95c8f03892161bc1c306c780382c45ee9e1ed", 210, 217, spriteScope("94", 1), null, [], ["glossary-or-hyperlink"]),
  action("script-0032", "DefineSprite_94/frame_16/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 219, 220, spriteScope("94", 16), null, [], []),
  action("script-0033", "DefineSprite_96/frame_1/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 222, 223, spriteScope("96", 1), null, [], []),
  action("script-0034", "DefineSprite_96/frame_20/DoAction.as", "_parent.enableMC();\nif(_global.quizDragCount >= 1)\n{\n   _parent.RightFeed._visible = true;\n   _parent.RightFeed.gotoAndPlay(2);\n}", 129, "fab22cd5b44a0c32aca9c439a84e2032025d429be43b034dcec3dbe865c6006b", 225, 231, spriteScope("96", 20), null, [], ["navigation-or-timeline"]),
  action("script-0035", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 233, 235, rootScope(1), null, [], ["navigation-or-timeline"]),
  action("script-0036", "frame_6/DoAction.as", STOP_BODY, 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 237, 238, rootScope(6), null, [], []),
] as const);

const BUTTON_RELEASE_CONDITION = deepFreeze({
  next: "0", menuEnter: "0", pointerReleaseOutside: "0", pointerDragEnter: "0", pointerDragLeave: "0",
  pointerReleaseInside: "1", pointerPush: "0", pointerLeave: "0", pointerEnter: "0", key: "0", menuLeave: "0",
} as const);
const SHARED_HIT = deepFreeze({
  depth: "1", sourceObjectId: "53", objectKind: "DefineShape",
  transform: {transX: "0", transY: "0"},
  bounds: {left: -1_128, right: 1_128, top: -310, bottom: 310},
} as const);
const placement = (timelineId: string, frame: number, depth: string, objectId: string, transform: Readonly<Record<string, string>>, name = "", morph: string | null = null) => ({
  timelineId, frame, replace: "0", depth, objectId, name, morph, transform,
} as const);
const buttonTarget = (scriptId: string, buttonObjectId: string, keyAttribute: string, placements: readonly ReturnType<typeof placement>[]) => ({
  scriptId, buttonObjectId, definitionTag: "DefineButton2", menu: "0", buttonsSize: "10",
  releaseEvent: "pointerReleaseInside", keyAttribute,
  conditions: [BUTTON_RELEASE_CONDITION], hitRecords: [SHARED_HIT], placements,
  exactStageBoundsStatus: "not-derived-from-hit-shape-geometry",
  actionsExecuted: false, sourceControlsRendered: false, pointerEventsEnabled: false,
} as const);

export const COURSE_G04_L11_VB_005_STATIC_BUTTON_TARGETS = deepFreeze([
  buttonTarget("script-0001", "54", "X-axis", [
    placement("sprite-90", 1, "15", "54", {scaleX: "0.5567169189453125", scaleY: "0.6656494140625000", transX: "-4131", transY: "-268"}),
    placement("sprite-101", 8, "61", "54", {scaleX: "0.5564575195312500", scaleY: "0.6674957275390625", transX: "-1953", transY: "-1891"}, "", "7"),
  ]),
  buttonTarget("script-0002", "55", "Y-axis", [
    placement("sprite-94", 1, "15", "55", {scaleX: "0.5567169189453125", scaleY: "0.6656494140625000", transX: "-4131", transY: "-268"}),
    placement("sprite-101", 8, "63", "55", {scaleX: "0.5743103027343750", scaleY: "0.6674957275390625", transX: "207", transY: "-1891"}, "", "7"),
  ]),
  buttonTarget("script-0003", "56", "Position", [
    placement("sprite-101", 8, "65", "56", {scaleX: "0.7604522705078125", scaleY: "0.6674957275390625", transX: "5796", transY: "-1891"}, "", "7"),
  ]),
  buttonTarget("script-0004", "57", "Coordinate grid", [
    placement("sprite-101", 8, "67", "57", {scaleX: "1.284057617187500", scaleY: "0.6674957275390625", transX: "-3375", transY: "-1351"}, "", "7"),
  ]),
  {
    scriptId: "script-0005", buttonObjectId: "84", definitionTag: "DefineButton2", menu: "0", buttonsSize: "104",
    releaseEvent: "pointerReleaseInside", keyAttribute: null, conditions: [BUTTON_RELEASE_CONDITION],
    hitRecords: [
      {depth: "2", sourceObjectId: "76", objectKind: "DefineShape2", transform: {transX: "0", transY: "0"}, bounds: {left: -964, right: 965, top: -262, bottom: 268}},
      {depth: "3", sourceObjectId: "77", objectKind: "DefineText", transform: {transX: "-1842", transY: "-227"}, bounds: {left: 1_052, right: 2_037, top: 93, bottom: 411}},
      {depth: "6", sourceObjectId: "81", objectKind: "DefineShape2", transform: {transX: "0", transY: "0"}, bounds: {left: 126, right: 913, top: -202, bottom: 220}},
      {depth: "7", sourceObjectId: "82", objectKind: "DefineShape", transform: {transX: "-14907", transY: "-30"}, bounds: {left: -230, right: 230, top: -250, bottom: 250}},
    ],
    placements: [
      placement("sprite-90", 1, "1", "84", {transX: "3590", transY: "-1040"}, "BtnClose"),
      placement("sprite-94", 1, "1", "84", {transX: "3970", transY: "-1040"}, "BtnClose"),
    ],
    exactStageBoundsStatus: "not-derived-from-hit-shape-geometry",
    actionsExecuted: false, sourceControlsRendered: false, pointerEventsEnabled: false,
  },
  buttonTarget("script-0006", "89", "Number", [
    placement("sprite-90", 1, "17", "89", {scaleX: "0.6809997558593750", scaleY: "0.6656494140625000", transX: "-1571", transY: "-268"}),
    placement("sprite-94", 1, "17", "89", {scaleX: "0.6809997558593750", scaleY: "0.6656494140625000", transX: "-1571", transY: "-268"}),
  ]),
] as const);

const dragPair = (
  objectId: "67" | "68",
  depth: "92" | "100",
  instanceName: "Scr_1" | "Scr_2",
  transY: "1491" | "2431",
  pressScriptId: "script-0011" | "script-0014",
  releaseScriptId: "script-0012" | "script-0015",
  loadScriptId: "script-0013" | "script-0016",
  correctTarget: "_parent.Tar_1" | "_parent.Tar_2",
  wrongFeedback: "_parent.Wrong_Feedx" | "_parent.Wrong_Feedy",
) => ({
  objectId, depth, instanceName,
  placement: {timelineId: "sprite-101", frame: 102, replace: "0", objectId, depth, morph: "101", name: instanceName, allflags1: "7169", allflags2: "0", transform: {transX: "4363", transY}},
  handlers: {pressScriptId, releaseScriptId, loadScriptId},
  events: {press: ["press"], release: ["releaseOutside", "release"], load: ["load"]},
  correctTarget, wrongFeedback,
  rightFeedback: "_parent.RightFeed",
  wrongAudioTarget: "_parent.Coach_audio_1",
  correctAndWrongBranchesStoredAsInertText: true,
  actionsExecuted: false,
  exactStageBoundsStatus: "not-derived-from-placement-matrix-and-shape-geometry",
} as const);

export const COURSE_G04_L11_VB_005_STATIC_DRAG_PAIRS = deepFreeze([
  dragPair("67", "92", "Scr_1", "1491", "script-0011", "script-0012", "script-0013", "_parent.Tar_1", "_parent.Wrong_Feedx"),
  dragPair("68", "100", "Scr_2", "2431", "script-0014", "script-0015", "script-0016", "_parent.Tar_2", "_parent.Wrong_Feedy"),
] as const);

type StaticInitializationCandidate = Readonly<{expression: string; parsedLiteral: unknown}>;
const candidate = (expression: string, parsedLiteral: unknown): StaticInitializationCandidate => ({expression, parsedLiteral});
const hostDependency = (
  binding: string,
  scope: "_global" | "_level0" | "_parent" | "_root",
  references: readonly string[],
  fixtureRequirement: "shared-state-must-be-initialized-per-scenario" | "required-or-explicitly-proven-absent",
  originalDefaultStatus: "unresolved-or-multiple-runtime-values" | "single-source-literal-candidate-not-runtime-proven",
  safeFixtureMode: "explicit-scenario-value-required; no guessed legacy default" | "recording-inert-function-or-object-until-state-effects-are-specified",
  sourceInitializationCandidates: readonly StaticInitializationCandidate[] = [],
) => ({
  binding, scope, references, fixtureRequirement, originalDefaultStatus,
  safeFixture: {mode: safeFixtureMode, originalBehaviorClaimed: false},
  sourceInitializationCandidates,
  sourceInitializationCandidatesAreNotRuntimeDefaults: true,
  hostBindingResolved: false,
} as const);

export const COURSE_G04_L11_VB_005_STATIC_HOST_DEPENDENCIES = deepFreeze([
  hostDependency("_global.KeyAttribute", "_global", ["_global.KeyAttribute"], "shared-state-must-be-initialized-per-scenario", "unresolved-or-multiple-runtime-values", "explicit-scenario-value-required; no guessed legacy default", [candidate("\"X-axis\"", {kind: "string", value: "X-axis"}), candidate("\"Y-axis\"", {kind: "string", value: "Y-axis"}), candidate("\"Position\"", {kind: "string", value: "Position"}), candidate("\"Coordinate grid\"", {kind: "string", value: "Coordinate grid"}), candidate("\"Number\"", {kind: "string", value: "Number"}), candidate("strKeyTermVar", null), candidate("strKeyTermVar", null)]),
  hostDependency("_global.quizDragCount", "_global", ["_global.quizDragCount"], "shared-state-must-be-initialized-per-scenario", "unresolved-or-multiple-runtime-values", "explicit-scenario-value-required; no guessed legacy default", [candidate("0", {kind: "number", value: 0}), candidate("", null), candidate("", null)]),
  hostDependency("_global.quizSection", "_global", ["_global.quizSection"], "shared-state-must-be-initialized-per-scenario", "unresolved-or-multiple-runtime-values", "explicit-scenario-value-required; no guessed legacy default", [candidate("false", {kind: "boolean", value: false}), candidate("true", {kind: "boolean", value: true})]),
  hostDependency("_global.rndAudio", "_global", ["_global.rndAudio", "_global.rndAudio.length", "_global.rndAudio[0]", "_global.rndAudio[1]", "_global.rndAudio[2]", "_global.rndAudio[3]", "_global.rndAudio[tempInt]"], "shared-state-must-be-initialized-per-scenario", "unresolved-or-multiple-runtime-values", "explicit-scenario-value-required; no guessed legacy default", [candidate("new Array()", {kind: "empty-array", value: []}), candidate("\"S1\"", {kind: "string", value: "S1"}), candidate("\"S2\"", {kind: "string", value: "S2"}), candidate("\"S3\"", {kind: "string", value: "S3"}), candidate("\"S4\"", {kind: "string", value: "S4"})]),
  hostDependency("_level0.InternalPreloader", "_level0", ["_level0.InternalPreloader.gotoAndPlay"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent", "_parent", ["_parent[\"Tar_\" + tempSplSrc[tempSplSrc.length - 1]"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "explicit-scenario-value-required; no guessed legacy default"),
  hostDependency("_parent.Coach_audio_1", "_parent", ["_parent.Coach_audio_1.gotoAndPlay"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.RightFeed", "_parent", ["_parent.RightFeed._visible", "_parent.RightFeed.gotoAndPlay"], "required-or-explicitly-proven-absent", "single-source-literal-candidate-not-runtime-proven", "recording-inert-function-or-object-until-state-effects-are-specified", [candidate("true", {kind: "boolean", value: true})]),
  hostDependency("_parent.Tar_1", "_parent", ["_parent.Tar_1.play"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.Tar_2", "_parent", ["_parent.Tar_2.play"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.Wrong_Feedx", "_parent", ["_parent.Wrong_Feedx._visible"], "required-or-explicitly-proven-absent", "single-source-literal-candidate-not-runtime-proven", "explicit-scenario-value-required; no guessed legacy default", [candidate("true", {kind: "boolean", value: true})]),
  hostDependency("_parent.Wrong_Feedy", "_parent", ["_parent.Wrong_Feedy._visible"], "required-or-explicitly-proven-absent", "single-source-literal-candidate-not-runtime-proven", "explicit-scenario-value-required; no guessed legacy default", [candidate("true", {kind: "boolean", value: true})]),
  hostDependency("_parent.doDisableMc", "_parent", ["_parent.doDisableMc"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.doEnableMc", "_parent", ["_parent.doEnableMc"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.enableMC", "_parent", ["_parent.enableMC"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_parent.play", "_parent", ["_parent.play"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_root.DoHyperLinks", "_root", ["_root.DoHyperLinks"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
  hostDependency("_root.animation_mc", "_root", ["_root.animation_mc.animation.stop"], "required-or-explicitly-proven-absent", "unresolved-or-multiple-runtime-values", "recording-inert-function-or-object-until-state-effects-are-specified"),
] as const);

export const COURSE_G04_L11_VB_005_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 36,
  buttonReleaseHandlerCount: 6,
  clipEventHandlerCount: 6,
  nonEventScriptCount: 26,
  buttonDefinitionCount: 6,
  dragPairCount: 2,
  hostDependencyBindingCount: 18,
  keyAttributeAssignmentCount: 7,
  actionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
  sourceControlsRendered: false,
  pointerEventsEnabled: false,
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

export const COURSE_G04_L11_VB_005_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  rootRequirement("en", "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1"),
  rootRequirement("es", "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067"),
] as const);

const AUDIO_INVENTORY_HEADER = deepFreeze([
  "cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id",
  "start_semantics", "duration_ms", "format", "channels", "sample_rate_hz", "source_character_id", "notes",
] as const);
const ALIGNMENT_NOTE = "Alignment-derived static dependency only; cue trigger, timing, duration, audio content, synchronization, runtime reachability, and listening review remain unresolved.";
const EXTERNAL_AUDIO_NOTE = "ffprobe version 8.1.2 Copyright (c) 2007-2026 the FFmpeg developers; codec=mp3; stream_bitrate_bps=112000; container_bitrate_bps=112000; language=es from legacy host directory semantics (The legacy host maps language code SP and Spanish page audio to the SA directory.); start_semantics=host-user-activated; no child-timeline start_frame is asserted; spoken content and synchronization require authoritative listening.";
const embeddedNote = (characterId: number, headFrame: number, firstBlockFrame: number, blockCount: number) =>
  "SoundStream in sprite:" + characterId + ", local head frame " + headFrame + ", first block frame " + firstBlockFrame + ", " + blockCount + " blocks, sync=stream; sum-of-mp3-soundstreamblock-sample-counts; start_semantics=interaction-state; root cue depends on sprite placement/interaction and remains unresolved; no root frame is asserted; spoken language/content requires listening.";
const embeddedStream = (
  streamIndex: number,
  characterId: number,
  contextDeclaredFrames: number,
  firstBlockFrame: number,
  lastBlockFrame: number,
  blockCount: number,
  totalDecodedSamples: number,
  durationSeconds: number,
  durationMs: number,
) => ({
  id: "embedded-stream-" + String(streamIndex).padStart(4, "0"),
  streamIndex,
  context: {kind: "sprite", characterId},
  contextLabel: "sprite:" + characterId,
  contextDeclaredFrames,
  headFrame: 1,
  firstBlockFrame,
  lastBlockFrame,
  syncMode: "stream",
  stop: false,
  loops: null,
  compressionCode: 2,
  format: "mp3",
  playbackSampleRateHz: 22_050,
  sampleRateHz: 22_050,
  sampleSizeBits: 16,
  channels: 1,
  nominalSamplesPerBlock: 1_837,
  blockCount,
  blocksWithDecodedSampleCount: blockCount,
  totalDecodedSamples,
  seekSamplesMin: 0,
  seekSamplesMax: 1_673,
  durationSeconds,
  durationMs,
  durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
  language: "und",
  rootCueFrame: null,
  startSemantics: "interaction-state",
  rootCueResolved: false,
  runtimeReachabilityVerified: false,
  originalRuntimeListeningAccepted: false,
  spokenLanguageContentVerified: false,
  synchronizationVerified: false,
  stopBehaviorVerified: false,
  replayBehaviorVerified: false,
  playable: false,
} as const);

const EMBEDDED_STREAMS = deepFreeze([
  embeddedStream(1, 70, 55, 3, 55, 53, 96_768, 4.388571, 4_389),
  embeddedStream(2, 83, 5, 1, 5, 5, 8_640, 0.391837, 392),
  embeddedStream(3, 90, 16, 1, 16, 16, 28_800, 1.306122, 1_306),
  embeddedStream(4, 94, 16, 1, 16, 16, 28_800, 1.306122, 1_306),
  embeddedStream(5, 96, 20, 2, 20, 19, 34_560, 1.567347, 1_567),
  embeddedStream(6, 100, 29, 6, 29, 24, 43_776, 1.985306, 1_985),
  embeddedStream(7, 101, 142, 8, 142, 135, 247_680, 11.232653, 11_233),
] as const);

const AUDIO_INVENTORY_ROWS = deepFreeze([
  ["alignment-runtime-dependency-001", "es", EXTERNAL_SPANISH_MP3_PATH, EXTERNAL_SPANISH_MP3_SHA256, "", "", "", "", "mp3", "", "", "", ALIGNMENT_NOTE],
  ["catalog-audio-01", "es", EXTERNAL_SPANISH_MP3_PATH, EXTERNAL_SPANISH_MP3_SHA256, "", "", "host-user-activated", "16440", "mp3", "1", "48000", "", EXTERNAL_AUDIO_NOTE],
  ...EMBEDDED_STREAMS.map((stream) => [
    stream.id, "und", SOURCE_SWF_PATH, SOURCE_SHA256, "", "", "interaction-state", String(stream.durationMs),
    "swf-mp3-stream", "1", "22050", String(stream.context.characterId),
    embeddedNote(stream.context.characterId, stream.headFrame, stream.firstBlockFrame, stream.blockCount),
  ] as const),
]);

export const COURSE_G04_L11_VB_005_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: true,
  manifestDeclaredLanguages: ["es"],
  manifestCatalogExactAssociationLanguage: "und",
  routeLanguage: "es",
  languageClassificationTensionPreserved: true,
  alignmentDerivedStaticObligations: [{
    cueId: "alignment-runtime-dependency-001",
    language: "es",
    audioBindingKind: "ordinary-spanish-page",
    bindingBasis: "canonical-animation-exact-matching-basename",
    sourceFile: EXTERNAL_SPANISH_MP3_PATH,
    bytes: 230_160,
    sha256: EXTERNAL_SPANISH_MP3_SHA256,
    hostRouteEligible: true,
    treatedAsAcceptedCue: false,
    cueTriggerResolved: false,
    timingResolved: false,
    durationResolved: false,
    runtimeReachabilityVerified: false,
    originalRuntimeListeningAccepted: false,
  }],
  exactExternalAssociations: [{
    sourceFile: EXTERNAL_SPANISH_MP3_PATH,
    bytes: 230_160,
    catalogSha256: EXTERNAL_SPANISH_MP3_SHA256,
    observedSha256: EXTERNAL_SPANISH_MP3_SHA256,
    hashMatchesCatalog: true,
    association: "matching-basename",
    associationStatus: "exact-basename-association",
    catalogLanguage: "und",
    routeLanguage: "es",
    spokenLanguage: null,
    spokenLanguageEstablished: false,
    probe: {
      codecName: "mp3", sampleRateHz: 48_000, channels: 1, channelLayout: "mono",
      durationSeconds: 16.44, durationMs: 16_440,
      streamBitRateBps: 112_000, containerBitRateBps: 112_000,
      formatName: "mp3", probeSizeBytes: 230_160,
    },
    startFrame: null,
    startSemantics: "host-user-activated",
    startFrameAuthority: "Verified legacy host script selects and starts this external track from language/user state; it is not a child root-timeline cue.",
  }],
  externalCandidateOnlyAssociations: [],
  externalExpectedButMissing: [],
  embeddedStreams: EMBEDDED_STREAMS,
  embeddedTotals: {streamCount: 7, blockCount: 268, totalDecodedSamples: 489_024},
  defineSounds: [],
  startSounds: [],
  exportedSoundLinkages: [],
  actionScriptAudioOperations: [],
  inventory: {rowCount: 9, exactExternalRows: 1, embeddedRows: 7, alignmentDerivedStaticRows: 1, header: AUDIO_INVENTORY_HEADER, rows: AUDIO_INVENTORY_ROWS},
  acceptance: {
    authoritativeListeningComplete: false,
    hostStateTraversalComplete: false,
    synchronizationComplete: false,
    cueTriggerResolved: false,
    timingResolved: false,
    durationResolved: false,
    runtimeReachabilityVerified: false,
    originalRuntimeListeningAccepted: false,
    spokenLanguageContentVerified: false,
    humanAudioReviewComplete: false,
    ownerAcceptanceComplete: false,
    strictMigrationComplete: false,
    publicationAuthorized: false,
    strictAudioAcceptance: false,
  },
} as const);

export const COURSE_G04_L11_VB_005_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  dependencyScope: {
    artifactFingerprintSha256: "9f5edc9fa945eff11c7d070d8c6439df07d0e53627f9971d39a235bbf58a32fd",
    status: "acceptance-neutral-static-runtime-dependency-scope",
    scopeLimitedToShellForensicQuestion: true,
    keyTermsStatus: "not-applied-to-this-non-shell-workspace",
    runtimeDependencyClosure: false,
  },
  classificationTension: {
    shellScopeArtifactSaysNotAppliedToNonShellWorkspace: true,
    pageSourceContainsKeyTermHandlers: true,
    sourceStaticKeyAttributeAssignmentCount: 7,
    buttonAssignmentCount: 5,
    glossaryHelperAssignmentCount: 2,
    classificationResolved: false,
  },
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
  leadsAreReplacement: false,
  runtimeResolutionVerified: false,
  ownerAccepted: false,
  strictCompletion: false,
  publication: false,
} as const);

export const COURSE_G04_L11_VB_005_STATIC_STRUCTURAL_BASELINE_FRAMES = deepFreeze([
  {frame: 1, file: "1.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 2, file: "2.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 3, file: "3.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 4, file: "4.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 5, file: "5.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 6, file: "6.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 7, file: "7.png", sha256: "c49e14baa244d85c3152d615f0ab323853a6fd071efce4c8403ce0ce3a060b5f", bytes: 20_952, width: 800, height: 600},
  {frame: 8, file: "8.png", sha256: "8c5780ed7267792f47a405196c2d80c3eabe528cf12e1a635215c48609987bcf", bytes: 22_634, width: 800, height: 600},
  {frame: 9, file: "9.png", sha256: "d24bc6eadabd069d928e7eea9f873fb5892a01dc64066b21ca04d814343234fa", bytes: 23_591, width: 800, height: 600},
  {frame: 10, file: "10.png", sha256: "c43b59a9d5561f1b59495933f56b03df386252474634ad461382ed5446428b04", bytes: 24_928, width: 800, height: 600},
] as const);

export const COURSE_G04_L11_VB_005_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
  status: "OPEN_RECORDED",
  accepted: false,
  baselineRationaleRejected: true,
  sourceStaticLayerABlocked: false,
  strictAcceptanceEffect: "blocked-unresolved",
  exactRejectedFractionalRationale: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  affectedArtifacts: [
    {path: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.path, bytes: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.bytes, sha256: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.structuralRootBaseline.sha256, field: "runtime.rasterization.rationale"},
    {path: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.strictReadiness.path, bytes: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.strictReadiness.bytes, sha256: COURSE_G04_L11_VB_005_STATIC_EVIDENCE_CLOSURE.strictReadiness.sha256, field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale"},
  ],
  sourceAuthoritativeStage: {xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000, widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20, widthPixels: 800, heightPixels: 600, fractional: false, roundingApplied: false, exactIntegerConversion: true},
  captureRaster: {width: 800, height: 600, matchesAuthoredStageExactly: true, roundingApplied: false},
  structuralFrames: COURSE_G04_L11_VB_005_STATIC_STRUCTURAL_BASELINE_FRAMES,
  originalRuntimeAuthorityEstablished: false,
  fidelityEstablished: false,
  strictCompletionEstablished: false,
  publicationEstablished: false,
} as const);

export const COURSE_G04_L11_VB_005_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  sourceBytesRehashed: true,
  sourceStaticLayerABlocked: false,
  registered: false,
  javascriptImplementation: false,
  rendererExists: false,
  runtimeDependencyClosure: false,
  originalRuntimeFidelity: false,
  pixelComparison: false,
  audioCorrectnessOrSynchronizationAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictCompletion: false,
  releaseAuthorized: false,
  publication: false,
  strictAcceptanceEffect: "blocked-unresolved",
} as const);

const validAnimation = (animationId: unknown): boolean =>
  animationId === COURSE_G04_L11_VB_005_STATIC_ANIMATION_ID;

export const getStaticSourceFacts = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_005_STATIC_SOURCE_FACTS : blocked("animation-id-must-match-vb005-source-static-contract");
export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  validAnimation(animationId) && frameDomainId === "root" ? COURSE_G04_L11_VB_005_STATIC_DECLARED_ROOT_DOMAIN : blocked("animation-id-and-frame-domain-must-match-vb005-source-static-contract");
export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  validAnimation(animationId) && typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
    ? COURSE_G04_L11_VB_005_STATIC_ROOT_FRAME_FACTS[frame - 1]!
    : blocked("animation-id-and-one-indexed-root-frame-must-match-vb005-source-static-contract");
export const getStaticScenarioTimeline = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_SCENARIO_TIMELINE_INVENTORY.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb005-source-static-contract");
};
export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) => {
  if (!validAnimation(animationId) || typeof timelineId !== "string") return blocked("animation-id-and-timeline-id-must-match-vb005-source-static-contract");
  if (timelineId === "sprite-83") return blocked("sprite-83-is-scenario-only-and-excluded-from-the-12-row-disposition-set");
  return COURSE_G04_L11_VB_005_STATIC_TIMELINE_DISPOSITIONS.find((entry) => entry.timelineId === timelineId)
    ?? blocked("animation-id-and-timeline-id-must-match-vb005-source-static-contract");
};
export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) => {
  if (!validAnimation(animationId) || typeof scriptId !== "string") return blocked("animation-id-and-script-id-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_ACTION_RECORDS.find((entry) => entry.id === scriptId)
    ?? blocked("animation-id-and-script-id-must-match-vb005-source-static-contract");
};
export const getStaticButtonTarget = (animationId: unknown, buttonObjectId: unknown) => {
  if (!validAnimation(animationId) || typeof buttonObjectId !== "string") return blocked("animation-id-and-button-object-id-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_BUTTON_TARGETS.find((entry) => entry.buttonObjectId === buttonObjectId)
    ?? blocked("animation-id-and-button-object-id-must-match-vb005-source-static-contract");
};
export const getStaticDragPair = (animationId: unknown, objectId: unknown) => {
  if (!validAnimation(animationId) || typeof objectId !== "string") return blocked("animation-id-and-drag-object-id-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_DRAG_PAIRS.find((entry) => entry.objectId === objectId)
    ?? blocked("animation-id-and-drag-object-id-must-match-vb005-source-static-contract");
};
export const getStaticHostDependency = (animationId: unknown, binding: unknown) => {
  if (!validAnimation(animationId) || typeof binding !== "string") return blocked("animation-id-and-host-binding-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_HOST_DEPENDENCIES.find((entry) => entry.binding === binding)
    ?? blocked("animation-id-and-host-binding-must-match-vb005-source-static-contract");
};
export const getStaticRootRequirement = (animationId: unknown, requirementId: unknown, language: unknown, scenario: unknown) => {
  if (!validAnimation(animationId) || typeof requirementId !== "string" || typeof language !== "string" || scenario !== "default") return blocked("animation-id-requirement-language-and-scenario-must-match-vb005-source-static-contract");
  return COURSE_G04_L11_VB_005_STATIC_ROOT_REQUIREMENTS.find((entry) => entry.requirementId === requirementId && entry.language === language)
    ?? blocked("animation-id-requirement-language-and-scenario-must-match-vb005-source-static-contract");
};
export const getStaticStructuralBaselineFrame = (animationId: unknown, frame: unknown) =>
  validAnimation(animationId) && typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
    ? COURSE_G04_L11_VB_005_STATIC_STRUCTURAL_BASELINE_FRAMES[frame - 1]!
    : blocked("animation-id-and-one-indexed-structural-baseline-frame-must-match-vb005-source-static-contract");
export const getStaticAudioObligations = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_005_STATIC_AUDIO_OBLIGATIONS : blocked("animation-id-must-match-vb005-source-static-contract");
export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_005_STATIC_KEY_TERMS_BOUNDARY : blocked("animation-id-must-match-vb005-source-static-contract");
export const getStaticEvidenceBoundary = (animationId: unknown) =>
  validAnimation(animationId) ? COURSE_G04_L11_VB_005_STATIC_EVIDENCE_BOUNDARY : blocked("animation-id-must-match-vb005-source-static-contract");
export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  validAnimation(animationId) && conflictId === COURSE_G04_L11_VB_005_STATIC_BASELINE_RATIONALE_CONFLICT.id
    ? COURSE_G04_L11_VB_005_STATIC_BASELINE_RATIONALE_CONFLICT
    : blocked("animation-id-and-conflict-id-must-match-vb005-source-static-contract");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");
export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");
export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");
export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
