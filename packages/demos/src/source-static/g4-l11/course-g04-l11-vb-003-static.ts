/**
 * Internal VB003 source-static specification.
 *
 * This module preserves hash-bound observations from the shipped source and
 * current static-audit closure. It is deliberately inert: it neither renders
 * nor executes the legacy movie, host actions, audio, or Key Terms behavior.
 */

export const COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID =
  "course-g04-l11-vb-003" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB03.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/VB/L11VB03.fla";
const LESSON_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml";
const SOURCE_SHA256 =
  "5612d7f9ff1740195d2fbb0a6077a0ff00e156800119131083fae13ba7e44c5d";
const SOURCE_FLA_SHA256 =
  "4200a6a50004fb7b28dc1da4babb82f4d84cfa74a2ca52435401f11a96a5d040";

/** Exactly nineteen independently byte-pinned source-static artifacts. */
export const COURSE_G04_L11_VB_003_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {path: SOURCE_SWF_PATH, bytes: 67_029, sha256: SOURCE_SHA256},
  sourceFla: {path: SOURCE_FLA_PATH, bytes: 361_472, sha256: SOURCE_FLA_SHA256},
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
    path: "migrations/course-g04-l11-vb-003/migration.json",
    bytes: 7_022,
    sha256: "cbe816785ea99d5c79f613fe14ccb94290687fdd1f2ea07bf9069fcc9161a762",
  },
  machineReport: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/report.json",
    bytes: 12_252,
    sha256: "31ba8224607f8e98d040e27410a9d59f9462a19c1e58256dfd3923f0b2ba9074",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/ffdec-header.txt",
    bytes: 187,
    sha256: "e791a1edb0628290fcfbbf15424b4097ed0574cc1d915c244b8d6d2b72d72768",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/ffdec-script-index.txt",
    bytes: 337,
    sha256: "6641c2fee1b12c0fb69269dbe29ce40f30c71fe844f6f8f991f4780fe1b35258",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 288,
    sha256: "8add054426213546b283fda3dea632b7a1c478022aea92b5c5db53135cbae361",
    uncompressedBytes: 924,
    uncompressedSha256: "ef48943bd85d752aaf79a89055611a285e63161bec817b218471b7db19112a6c",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/ffdec-tags.txt.gz",
    bytes: 22_029,
    sha256: "e58729f115e418392cef15175662cdcf7e8b91ce4639407e92cf0ba53bc1df4b",
    uncompressedBytes: 88_569,
    uncompressedSha256: "4fda7ec586dce7ba03a321cd50936009cdedad64936090e1cba8cbc95969fe97",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_176,
    sha256: "a846e3878cf77412b131ba099af0da5c0f86962684f6e540f30d63bf5176de83",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/swfmill-summary.json",
    bytes: 2_393,
    sha256: "782c7e1d01e6434a631f36f9aeeaad1c5b4b6bbe4c890b454661042d29387d51",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-vb-003/audit/machine/swfmill.xml.gz",
    bytes: 75_969,
    sha256: "4a1667a8e790f218cbc8a72755093cd14d8eee3d3a0a43a12efe2bb828e2b174",
    uncompressedBytes: 294_922,
    uncompressedSha256: "b5835462ad83d01456d934d3a28f4c87df8b953bfa524d70db4a71da080feaf9",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-vb-003/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "117fa779c60a7ac42a0d7e91d9fbfd73880165d71e98c00e21188ccf9d2283e7",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-vb-003/audit/audio-runtime-evidence.json",
    bytes: 9_849,
    sha256: "ad18567e283fa1772c9d24560bae8e89e3d1519379473592e0ef10001ad4ba38",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-vb-003/audio-inventory.csv",
    bytes: 696,
    sha256: "a252fb0be210b71ab29e433d0fe05f69b8dd2c55b41b5a3b7bf8affabd1d3eca",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-vb-003/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "e8ec5b29ec849d57ae7229efe17c796d3cca1e81fa77ed381b034167f6e82bbb",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-vb-003/audit/strict-readiness.json",
    bytes: 17_450,
    sha256: "86eb557c24d34a297cd543b20d31cb5410feaf47fdc032e5d154565e07376a0f",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-vb-003/baseline/ffdec-root-frames.json",
    bytes: 3_563,
    sha256: "28cc24eb3c3402617513fb6149b3f84674906b7f5dcdf77ee9a8ba93f51d3059",
  },
} as const);

const ROOT_NAMED_PLACEMENTS = deepFreeze([
  {
    frame: 6,
    timelineId: "root",
    objectId: "5",
    sourceTimelineId: "sprite-5",
    depth: "2",
    name: "Mc_Page_Title",
    replace: "0",
    transform: {transX: "8002", transY: "868"},
  },
  {
    frame: 6,
    timelineId: "root",
    objectId: "72",
    sourceTimelineId: "sprite-72",
    depth: "4",
    name: "animation",
    replace: "0",
    transform: {transX: "8026", transY: "4885"},
  },
] as const);

const ROOT_CONTROL_RECORDS = deepFreeze([
  {
    frame: 1,
    reasons: ["exported-action-script", "initial-one-indexed-frame", "script-stop-state", "structural-action:DoAction"],
  },
  {
    frame: 6,
    reasons: ["exported-action-script", "frame-label:begin", "script-stop-state", "structural-action:DoAction"],
  },
  {frame: 10, reasons: ["terminal-structural-frame"]},
] as const);

export const COURSE_G04_L11_VB_003_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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

export const COURSE_G04_L11_VB_003_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

/** Structural candidates only; neither has a formal scenario/disposition artifact. */
export const COURSE_G04_L11_VB_003_STATIC_NESTED_DEFINITION_CANDIDATES = deepFreeze([
  {
    timelineId: "sprite-5",
    sourceTimelineId: "sprite-5",
    sourceObjectId: 5,
    kind: "nested-definition-candidate",
    frameCount: 1,
    structuralRootPlacementObserved: true,
    machineCandidateRootReachability: "unresolved",
    placementEntryState: "unresolved",
    runtimeReachability: "unresolved",
    formalScenarioInventory: "absent",
    formalFrameDomainDisposition: "absent",
    riskAssessment: {level: "review", reason: "root placement is structural only; no authorized natural trace or formal disposition exists"},
  },
  {
    timelineId: "sprite-72",
    sourceTimelineId: "sprite-72",
    sourceObjectId: 72,
    kind: "nested-definition-candidate",
    frameCount: 158,
    structuralRootPlacementObserved: true,
    machineCandidateRootReachability: "unresolved",
    placementEntryState: "unresolved",
    runtimeReachability: "unresolved",
    formalScenarioInventory: "absent",
    formalFrameDomainDisposition: "absent",
    riskAssessment: {level: "high", reason: "158-frame candidate contains audio, buttons, and a terminal stop but has no authorized runtime/disposition evidence"},
  },
] as const);

export const COURSE_G04_L11_VB_003_STATIC_TAG_COUNTS = deepFreeze({
  Button: 8,
  CallMethod: 9,
  Color: 62,
  ColorTransform2: 56,
  Condition: 4,
  CurveTo: 780,
  DefineButton2: 4,
  DefineFont2: 4,
  DefineMorphShape: 5,
  DefineShape: 11,
  DefineShape2: 2,
  DefineShape3: 1,
  DefineSprite: 2,
  DefineText: 43,
  Dictionary: 4,
  DoAction: 3,
  End: 3,
  EndAction: 7,
  FrameLabel: 1,
  GetMember: 9,
  GetVariable: 13,
  Glyph: 57,
  GlyphShape: 57,
  Header: 1,
  LineStyle: 9,
  LineTo: 609,
  PlaceObject2: 237,
  Pop: 9,
  PushData: 35,
  Rectangle: 58,
  RemoveObject2: 21,
  SetBackgroundColor: 1,
  SetMember: 4,
  Shape: 14,
  ShapeSetup: 161,
  ShowFrame: 169,
  Solid: 9,
  SoundStreamBlock: 152,
  SoundStreamHead: 1,
  StackDictionaryLookup: 36,
  StackDouble: 8,
  StackInteger: 1,
  StackString: 4,
  Stop: 3,
  String: 32,
  StyleList: 17,
  TextEntry: 114,
  TextRecord: 43,
  TextRecord6: 129,
  Transform: 164,
  UnknownTag: 1,
  actions: 7,
  bounds: 57,
  buttons: 4,
  color: 62,
  colorTransform: 56,
  conditions: 4,
  data: 163,
  edges: 71,
  fillStyles: 17,
  flags: 1,
  glyphs: 90,
  items: 35,
  latencySeek: 1,
  lineStyles: 17,
  records: 86,
  shapes: 14,
  size: 1,
  strings: 4,
  styles: 17,
  swf: 1,
  tags: 3,
  transform: 164,
} as const);

export const COURSE_G04_L11_VB_003_STATIC_SOURCE_FACTS = deepFreeze({
  animationId: COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID,
  assetId: "swf-" + SOURCE_SHA256,
  source: {
    swf: {path: SOURCE_SWF_PATH, bytes: 67_029, sha256: SOURCE_SHA256},
    fla: {path: SOURCE_FLA_PATH, bytes: 361_472, sha256: SOURCE_FLA_SHA256},
    pairedFlaStatus: "present",
    authoringInspectionStatus: "not-complete-legacy-conversion-dialog",
    machineAuthoringInspectionStatus: "not-performed-by-this-script",
    authoringStructureRecovered: false,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/VB/L11VB03.swf",
    activeXmlOccurrence: {
      title: "x-axis/Horizontal",
      randomAudio: "",
      backgroundText: "",
      exactText: "<Page Title=\"x-axis/Horizontal\" RandomAudio=\"\" BGText=\"\">VB/L11VB03.swf</Page>",
      lineNumber: 46,
      xmlOccurrence: 6,
    },
    bilingualStrings: {
      englishTitle: "x-axis/Horizontal",
      spanishTitle: "Eje horizontal x",
      englishSubtitle: "2. x-axis/Horizontal",
      spanishSubtitle: "Eje horizontal x",
      subTitleButtonName: "L11VB03",
      exactSubPageText: "<SubPageTitle EngSubTitleName=\"2. x-axis/Horizontal\" SpanSubTitleName=\"Eje horizontal x\" SubTitleButtonName=\"L11VB03\">VB/L11VB03.swf</SubPageTitle>",
      lineNumber: 56,
      runtimeLanguageParityEstablished: false,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    expectedMemberCount: 44,
    ordinal: 6,
    xmlOccurrence: 6,
    releaseRole: "active-xml-referenced-page",
    batchId: "g04-l11-host-language",
    shardId: "g04-l11-host-language",
    sourcePath: "HELP_COURSES/ELMGR4/L11/VB/L11VB03.swf",
  },
  runtimeHeader: {
    signature: "CWS",
    swfVersion: 6,
    compression: "zlib",
    physicalSourceBytes: 67_029,
    declaredUncompressedBytes: 76_002,
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
  rawUnknownTag: {tag: "UnknownTag", id: "0x18", preserved: true},
  status: {
    migration: "preserved",
    sourceStaticOnly: true,
    currentJsCandidateExists: false,
    strictAcceptanceReady: false,
    publicationAllowed: false,
  },
} as const);

const action = (
  id: string,
  script: string,
  body: string,
  bodyBytes: number,
  bodySha256: string,
  lineStart: number,
  lineEnd: number,
  scope: Readonly<{kind: "root" | "sprite" | "button-definition"; objectId: string | null; frame: number | null}>,
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
  legacyActionScriptExecuted: false,
  hostCallsExecuted: false,
  naturalInteractionProven: false,
} as const);

/** Seven exact FFDec script bodies are retained as inert text, never evaluated. */
export const COURSE_G04_L11_VB_003_STATIC_ACTION_RECORDS = deepFreeze([
  action("script-0001", "DefineButton2_47/BUTTONCONDACTION on(release).as", "on(release){\n   _global.KeyAttribute = \"X-axis\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 115, "200ad29ed015b519037675133190b59c6774d44f0cd4f44fd5893b530009c944", 2, 6, {kind: "button-definition", objectId: "47", frame: null}),
  action("script-0002", "DefineButton2_48/BUTTONCONDACTION on(release).as", "on(release){\n   _global.KeyAttribute = \"Horizontal\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 119, "9626108d9dec8998b16490646daeb1ecd2f6e051936681ab0817ef64878de586", 9, 13, {kind: "button-definition", objectId: "48", frame: null}),
  action("script-0003", "DefineButton2_49/BUTTONCONDACTION on(release).as", "on(release){\n   _global.KeyAttribute = \"Number line\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 120, "9af2b73747b39522e5b0be7156bc4b0939d87fed3e02176af9dd96a20350a86e", 16, 20, {kind: "button-definition", objectId: "49", frame: null}),
  action("script-0004", "DefineButton2_50/BUTTONCONDACTION on(release).as", "on(release){\n   _global.KeyAttribute = \"Coordinate grid\";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}", 124, "89ff000d8f5676a6d549683f1ca696a572d21fbd8cd5308596ddb74fd8b2bdb6", 23, 27, {kind: "button-definition", objectId: "50", frame: null}),
  action("script-0005", "DefineSprite_72/frame_158/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 30, 30, {kind: "sprite", objectId: "72", frame: 158}),
  action("script-0006", "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();", 60, "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3", 33, 34, {kind: "root", objectId: null, frame: 1}),
  action("script-0007", "frame_6/DoAction.as", "stop();", 7, "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db", 37, 37, {kind: "root", objectId: null, frame: 6}),
] as const);

const SHARED_HIT_RECORD = deepFreeze({
  objectId: "46",
  depth: "1",
  states: {hitTest: true, down: false, over: false, up: false},
  transform: {transX: "0", transY: "0"},
  bounds: {left: -1_128, right: 1_128, top: -310, bottom: 310},
} as const);

const buttonPlacement = (
  objectId: "47" | "48" | "49" | "50",
  depth: string,
  scaleX: string,
  transX: string,
  frame: 8 | 64,
  morph: "7" | "63",
) => ({
  timelineId: "sprite-72",
  frame,
  replace: "0",
  objectId,
  depth,
  morph,
  transform: {scaleX, scaleY: "0.6674957275390625", transX, transY: "-2163"},
} as const);

export const COURSE_G04_L11_VB_003_STATIC_BUTTON_TARGETS = deepFreeze([
  {
    scriptId: "script-0001",
    buttonObjectId: "47",
    releaseEvent: "pointerReleaseInside",
    keyAttribute: "X-axis",
    hitRecords: [SHARED_HIT_RECORD],
    placements: [buttonPlacement("47", "55", "0.5118560791015625", "-4177", 8, "7"), buttonPlacement("47", "55", "0.5118560791015625", "-4177", 64, "63")],
    actionsExecuted: false,
  },
  {
    scriptId: "script-0002",
    buttonObjectId: "48",
    releaseEvent: "pointerReleaseInside",
    keyAttribute: "Horizontal",
    hitRecords: [SHARED_HIT_RECORD],
    placements: [buttonPlacement("48", "57", "0.8311920166015625", "-1438", 8, "7"), buttonPlacement("48", "57", "0.8311920166015625", "-1438", 64, "63")],
    actionsExecuted: false,
  },
  {
    scriptId: "script-0003",
    buttonObjectId: "49",
    releaseEvent: "pointerReleaseInside",
    keyAttribute: "Number line",
    hitRecords: [SHARED_HIT_RECORD],
    placements: [buttonPlacement("49", "59", "1.000305175781250", "673", 8, "7"), buttonPlacement("49", "59", "1.000305175781250", "673", 64, "63")],
    actionsExecuted: false,
  },
  {
    scriptId: "script-0004",
    buttonObjectId: "50",
    releaseEvent: "pointerReleaseInside",
    keyAttribute: "Coordinate grid",
    hitRecords: [SHARED_HIT_RECORD],
    placements: [buttonPlacement("50", "61", "1.275772094726562", "4242", 8, "7"), buttonPlacement("50", "61", "1.275772094726562", "4242", 64, "63")],
    actionsExecuted: false,
  },
] as const);

/** Four and only four unresolved host-facing source operations are retained. */
export const COURSE_G04_L11_VB_003_STATIC_BLOCKED_HOST_DEPENDENCIES = deepFreeze([
  {sourceToken: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")", status: "BLOCKED_UNVERIFIED", blocker: "The root preloader handoff has no authorized natural-entry runtime evidence.", facts: null},
  {sourceToken: "_global.KeyAttribute", status: "BLOCKED_UNVERIFIED", blocker: "Four release handlers write shared KeyAttribute state without a bound host/default or authorized execution evidence.", facts: null},
  {sourceToken: "_root.DoHyperLinks", status: "BLOCKED_UNVERIFIED", blocker: "The host hyperlink call appears in four release handlers without authorized natural-entry evidence.", facts: null},
  {sourceToken: "_root.animation_mc.animation.stop", status: "BLOCKED_UNVERIFIED", blocker: "The nested host animation stop target lacks an authorized host binding and natural interaction evidence.", facts: null},
] as const);

export const COURSE_G04_L11_VB_003_STATIC_INTERACTION_SUMMARY = deepFreeze({
  ffdecExportedScriptFileCount: 7,
  buttonReleaseHandlerCount: 4,
  doActionCount: 3,
  buttonDefinitionCount: 4,
  externalCallCandidateCount: 0,
  machineExternalCandidatesDoNotEliminateHostDependencies: true,
  hostDependencyTokenCount: 4,
  actionScriptExecuted: false,
  naturalInteractionProven: false,
  sourceControlsRendered: false,
  pointerEventsEnabled: false,
} as const);

export const COURSE_G04_L11_VB_003_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  {
    requirementId: "req-default-root-en",
    scenario: "default",
    frameDomainId: "root",
    traceId: "default-root-en",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "en"},
    entryStateSha256: "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
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
    entryStateSha256: "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
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

export const COURSE_G04_L11_VB_003_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  manifestAudioRequired: false,
  strictNoAudioConclusionForbidden: true,
  manifestAudioRequiredConflict: "migration.audio.required is false, but the audit found 0 exact external track(s) and 1 timed embedded sound asset/stream(s); update only after runtime reachability/listening review.",
  externalExactAssociations: [],
  externalCandidateOnlyAssociations: [],
  externalExactAssociationCount: 0,
  externalCandidateOnlyCount: 0,
  externalPlayable: false,
  embeddedStreams: [{
    id: "embedded-stream-0001",
    streamIndex: 1,
    context: {kind: "sprite", characterId: 72},
    contextLabel: "sprite:72",
    contextDeclaredFrames: 158,
    headFrame: 1,
    firstBlockFrame: 7,
    lastBlockFrame: 158,
    blockCount: 152,
    totalDecodedSamples: 278_784,
    format: "mp3",
    syncMode: "stream",
    compressionCode: 2,
    sampleRateHz: 22_050,
    sampleSizeBits: 16,
    channels: 1,
    nominalSamplesPerBlock: 1_837,
    seekSamplesMin: 0,
    seekSamplesMax: 1_673,
    durationSeconds: 12.643265,
    durationMs: 12_643,
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
  }],
  strictAudioAcceptance: false,
} as const);

export const COURSE_G04_L11_VB_003_STATIC_KEY_TERMS_BOUNDARY = deepFreeze({
  workspaceScope: "non-shell",
  runtimeDependencyScopeStatus: "not-applied-to-this-non-shell-workspace",
  shellScopeArtifactConflictsWithPageHandlers: true,
  pageHandlerCount: 4,
  pageHandlerExecutionProven: false,
  pageDependencyEstablished: false,
  canonicalDependencies: [
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTE01.xml", language: "en", status: "BLOCKED_UNVERIFIED", sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L11KTS01.xml", language: "es", status: "BLOCKED_UNVERIFIED", sourceBytes: null, bytes: null, sha256: null, successorReceipt: null, replacementAccepted: false, facts: null},
  ],
  gradeWideRetrievalLeads: [
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", bytes: 378_783, sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
    {path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml", bytes: 374_466, sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00", replacementAccepted: false, disposition: "retrieval-lead-only-not-a-substitute"},
  ],
  runtimeResolutionVerified: false,
  strictCompletionEligible: false,
} as const);

export const COURSE_G04_L11_VB_003_STATIC_STRUCTURAL_BASELINE_FRAMES = deepFreeze([
  {frame: 1, file: "1.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 2, file: "2.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 3, file: "3.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 4, file: "4.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 5, file: "5.png", sha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c", bytes: 3_239, width: 800, height: 600},
  {frame: 6, file: "6.png", sha256: "003880e02e3ca77f42a3df2472caca71b9731ba935f984fb9391b076e5122dbf", bytes: 8_339, width: 800, height: 600},
  {frame: 7, file: "7.png", sha256: "588e08f28e392a6215b5e774fde073ce5106a610c5fe11e708d79a9cc1964cfd", bytes: 12_844, width: 800, height: 600},
  {frame: 8, file: "8.png", sha256: "a1f59f3115d01d0ab62315b306b11b80a702c2a65b86f618f436e1d142e8d83c", bytes: 12_342, width: 800, height: 600},
  {frame: 9, file: "9.png", sha256: "303ea2741fd8f22c5d70fa29e184fff679f2547cca73e268f53cc918b0a07715", bytes: 12_509, width: 800, height: 600},
  {frame: 10, file: "10.png", sha256: "ccfb9068315e2b9c17ad339ba28804bb92bb760738c2d578a1a985da4cf853ad", bytes: 12_610, width: 800, height: 600},
] as const);

export const COURSE_G04_L11_VB_003_STATIC_BASELINE_RATIONALE_CONFLICT = deepFreeze({
  id: "PREEXISTING_STRUCTURAL_BASELINE_RATIONALE_CONFLICT",
  status: "OPEN_RECORDED",
  severityForSourceStaticLayerA: "nonblocking-if-explicitly-contained",
  scope: "stage-rasterization-rationale-only",
  accepted: false,
  conflictingClaimAccepted: false,
  fractionalNativeStageClaimAccepted: false,
  affectedArtifacts: [
    {path: "migrations/course-g04-l11-vb-003/baseline/ffdec-root-frames.json", bytes: 3_563, sha256: "28cc24eb3c3402617513fb6149b3f84674906b7f5dcdf77ee9a8ba93f51d3059", field: "runtime.rasterization.rationale"},
    {path: "migrations/course-g04-l11-vb-003/audit/strict-readiness.json", bytes: 17_450, sha256: "86eb557c24d34a297cd543b20d31cb5410feaf47fdc032e5d154565e07376a0f", field: "baselineReadiness.ffdecStructuralRootFrameExport.rasterization.rationale"},
  ],
  exactObservedConflictingText: "PNG dimensions are whole pixels; FFDec maps fractional positive native stage bounds to the smallest containing integer raster (799.9x599.75 was observed as 800x600).",
  sourceAuthoritativeStage: {xMinTwips: 0, xMaxTwips: 16_000, yMinTwips: 0, yMaxTwips: 12_000, widthTwips: 16_000, heightTwips: 12_000, twipsPerPixel: 20, widthPixels: 800, heightPixels: 600, fractionalNativeStage: false, roundingApplied: false, exactIntegerConversion: true},
  captureRaster: {width: 800, height: 600, matchesAuthoredStageExactly: true, roundingApplied: false},
  structuralFrames: COURSE_G04_L11_VB_003_STATIC_STRUCTURAL_BASELINE_FRAMES,
  baselineFrameManifestHashBound: true,
  baselinePngDimensionsInvalidated: false,
  baselineRationaleRejected: true,
  baselineRationaleAccepted: false,
  originalRuntimeAuthorityEstablished: false,
  fidelityEstablished: false,
  strictCompletionEstablished: false,
  publicationEstablished: false,
  strictAcceptanceEffect: "blocked-unresolved",
  publicationEffect: "none",
} as const);

export const COURSE_G04_L11_VB_003_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  formalScenarioInventoryArtifact: {path: "migrations/course-g04-l11-vb-003/audit/scenario-inventory.json", status: "absent-lstat-enoent-required"},
  formalFrameDomainDispositionArtifact: {path: "migrations/course-g04-l11-vb-003/audit/frame-domain-disposition.json", status: "absent-lstat-enoent-required"},
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
  animationId === COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_VB_003_STATIC_SOURCE_FACTS
    : blocked("animation-id-must-match-vb003-source-static-contract");

export const getStaticDeclaredFrameDomain = (animationId: unknown, frameDomainId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : frameDomainId === "root"
      ? COURSE_G04_L11_VB_003_STATIC_DECLARED_ROOT_DOMAIN
      : typeof frameDomainId === "string"
        ? blocked("only-the-declared-root-frame-domain-is-source-static")
        : blocked("frame-domain-id-must-be-a-string");

export const getStaticRootFrameFact = (animationId: unknown, frame: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof frame === "number" && Number.isInteger(frame) && frame >= 1 && frame <= 10
      ? COURSE_G04_L11_VB_003_STATIC_ROOT_FRAME_FACTS[frame - 1] ?? blocked("root-frame-index-is-not-bound")
      : blocked("root-frame-must-be-a-finite-one-indexed-integer-in-1-through-10");

export const getStaticStructuralNestedDefinitionCandidate = (animationId: unknown, timelineId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof timelineId === "string"
      ? COURSE_G04_L11_VB_003_STATIC_NESTED_DEFINITION_CANDIDATES.find((row) => row.timelineId === timelineId) ?? blocked("timeline-id-is-not-in-the-hash-bound-vb003-candidate-inventory")
      : blocked("timeline-id-must-be-a-string");

/** No disposition was projected: the required artifact is absent. */
export const getStaticTimelineDisposition = (animationId: unknown, timelineId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof timelineId !== "string"
      ? blocked("timeline-id-must-be-a-string")
      : blocked("formal-frame-domain-disposition-artifact-is-absent");

export const getStaticActionRecord = (animationId: unknown, scriptId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof scriptId === "string"
      ? COURSE_G04_L11_VB_003_STATIC_ACTION_RECORDS.find((row) => row.id === scriptId) ?? blocked("script-id-is-not-in-the-hash-bound-vb003-bundle")
      : blocked("script-id-must-be-a-string");

export const getStaticButtonTarget = (animationId: unknown, buttonObjectId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof buttonObjectId === "string"
      ? COURSE_G04_L11_VB_003_STATIC_BUTTON_TARGETS.find((row) => row.buttonObjectId === buttonObjectId) ?? blocked("button-object-id-is-not-in-the-hash-bound-vb003-inventory")
      : blocked("button-object-id-must-be-a-string");

export const getStaticRootRequirement = (animationId: unknown, requirementId: unknown, language: unknown, scenario: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof requirementId === "string" && typeof language === "string" && typeof scenario === "string"
      ? COURSE_G04_L11_VB_003_STATIC_ROOT_REQUIREMENTS.find((row) => row.requirementId === requirementId && row.language === language && row.scenario === scenario) ?? blocked("requirement-language-scenario-combination-is-not-bound")
      : blocked("requirement-id-language-and-scenario-must-all-be-strings");

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_VB_003_STATIC_AUDIO_OBLIGATIONS
    : blocked("animation-id-must-match-vb003-source-static-contract");

export const getStaticBlockedHostDependencies = (animationId: unknown) =>
  animationId === COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_VB_003_STATIC_BLOCKED_HOST_DEPENDENCIES
    : blocked("animation-id-must-match-vb003-source-static-contract");

export const getStaticKeyTermsBoundary = (animationId: unknown) =>
  animationId === COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_VB_003_STATIC_KEY_TERMS_BOUNDARY
    : blocked("animation-id-must-match-vb003-source-static-contract");

export const getStaticEvidenceBoundary = (animationId: unknown) =>
  animationId === COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_VB_003_STATIC_EVIDENCE_BOUNDARY
    : blocked("animation-id-must-match-vb003-source-static-contract");

export const getStaticBaselineRationaleConflict = (animationId: unknown, conflictId: unknown) =>
  animationId !== COURSE_G04_L11_VB_003_STATIC_ANIMATION_ID
    ? blocked("animation-id-must-match-vb003-source-static-contract")
    : typeof conflictId !== "string"
      ? blocked("conflict-id-must-be-a-string")
      : conflictId === COURSE_G04_L11_VB_003_STATIC_BASELINE_RATIONALE_CONFLICT.id
        ? COURSE_G04_L11_VB_003_STATIC_BASELINE_RATIONALE_CONFLICT
        : blocked("conflict-id-is-not-in-the-hash-bound-vb003-inventory");

export const requestStaticRuntime = (): Readonly<BlockedUnverified> =>
  blocked("authorized-natural-or-original-runtime-evidence-is-not-present");
export const requestStaticPixels = (): Readonly<BlockedUnverified> =>
  blocked("pixel-output-requires-a-separate-implementation-or-authoritative-capture");
export const requestStaticAudioAcceptance = (): Readonly<BlockedUnverified> =>
  blocked("audio-listening-reachability-synchronization-and-replay-are-unverified");
export const requestStaticKeyTermsResolution = (): Readonly<BlockedUnverified> =>
  blocked("exact-l11-keyterms-source-bytes-and-successor-intake-are-unavailable");
