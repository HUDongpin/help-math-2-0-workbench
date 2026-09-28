/**
 * Internal IR001 source-static specification.
 *
 * This module exposes immutable, hash-bound observations only. It does not
 * execute legacy ActionScript, advance a playhead, emit pixels, create sound,
 * or alter migration, acceptance, strict-completion, or publication state.
 */

export const COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID =
  "course-g04-l11-ir-001" as const;

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
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IR/L11RW01.swf";
const SOURCE_FLA_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IR/L11RW01.fla";

/** Exactly twenty-one independently byte-pinned source-static artifacts. */
export const COURSE_G04_L11_IR_001_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_SWF_PATH,
    bytes: 90_557,
    sha256: "4fcd80c9533e667c929756519bdb4b5b8bd08aa2bc14cf2a6cb02a416953d218",
  },
  sourceFla: {
    path: SOURCE_FLA_PATH,
    bytes: 617_472,
    sha256: "a68664f1d527cc7be6e754ad17047af5014dc5d3daa3181009dd476866c7e655",
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
    path: "migrations/course-g04-l11-ir-001/migration.json",
    bytes: 6_869,
    sha256: "616545a5c285d8a02a41a235128576e2ab533ef120ed43818dfcb9a397f0af4e",
  },
  machineReport: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/report.json",
    bytes: 12_559,
    sha256: "21a1a3bc4e8a9e8fae6e0bf71d01e99d8369e699f65c6c2a44bbb715b5014215",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/ffdec-header.txt",
    bytes: 188,
    sha256: "65593735c56e3fb6c4c87b5968c5872e52cbb79ae5300680a05e1be1db34eeef",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/ffdec-script-index.txt",
    bytes: 385,
    sha256: "f02956144789cf13aa0abb029d3dd861d9586de7871dedc15ff581d507fc6bf9",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/ffdec-scripts.txt.gz",
    bytes: 224,
    sha256: "576e9daa8f4a45c74398ced413e4df7f83421d0779f0e159b97a6d8194c5d2a4",
    uncompressedBytes: 644,
    uncompressedSha256:
      "3b2c007f53ad6ba47fcb45a9517c6b5b14c23fe7a6155d8ebc946fce145428ef",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/ffdec-tags.txt.gz",
    bytes: 123_052,
    sha256: "1dd9556c2085d8e85dbb070d4694840406f157a8b3e5fcd2af4d7aba78e873fb",
    uncompressedBytes: 836_753,
    uncompressedSha256:
      "3d398d0eb6be717c205eccca765b262078181335af26205a6568964b35c6a5a8",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/swf-frame-domain-candidates.json",
    bytes: 2_506,
    sha256: "51a9509c6e3320a2ad35d6e5310f77dc376b8ea1feff96ed2eb5604a7340d4d5",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/swfmill-summary.json",
    bytes: 2_333,
    sha256: "26cf71f9de0fc1d3e2d7cad56e76cd0c5009fcc90090b1cba8dbeb1c63387bea",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-ir-001/audit/machine/swfmill.xml.gz",
    bytes: 123_498,
    sha256: "0cf18e97907a0155cc65405cdba14ef0de815415a198c70fd2f28150e7b7d258",
    uncompressedBytes: 2_583_542,
    uncompressedSha256:
      "3920061fb789cb137af902db0ef104257318766de08a30af59dffd15b16ef3da",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-ir-001/audit/scenario-inventory.json",
    bytes: 97_963,
    sha256: "bb06ac75a6416f636573706e701bb88f1d65aec124c27843351b4804b2253ce3",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-ir-001/audit/frame-domain-disposition.json",
    bytes: 15_860,
    sha256: "3e218e9103ea79513ae4602905db6449159682a1f7cf9157706309bf892ce480",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-ir-001/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "6476c52092119bd86869731ed1449a5e24d1c5dae1d2478055736eb331140952",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-ir-001/audit/audio-runtime-evidence.json",
    bytes: 10_915,
    sha256: "3748f675f65fbe4a348784e0a0fb038a1de35b2180f91d6beaef859b607fc7b3",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-ir-001/audio-inventory.csv",
    bytes: 1_238,
    sha256: "bd78fcc180fd4f5aca34b369a6abfccd1397324fc98785fa4dd21af1a14cc458",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-ir-001/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "b60350825157fb03bcc37f61395a6b4c15c967f31ca6cab41f48568513b99b16",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-ir-001/audit/strict-readiness.json",
    bytes: 17_450,
    sha256: "c8d11f39281970f2a2793862e5fa83fa93e0e16db971e38f72092d414fc4f10b",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-ir-001/baseline/ffdec-root-frames.json",
    bytes: 3_563,
    sha256: "2a3c068afb6c6782350c73e84f7c665c9621f78e4b5b937d4223fa53b5e3342a",
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

const ROOT_NAMED_PLACEMENT = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-49",
  sourceObjectId: "49",
  frame: 6,
  depth: "1",
  instanceName: "animation",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

export const COURSE_G04_L11_IR_001_STATIC_ROOT_FRAME_FACTS = deepFreeze(
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
      namedPlacements: frame === 6 ? [ROOT_NAMED_PLACEMENT] : [],
      legacyActionSemanticsExecuted: false,
      naturalEntryProven: false,
      visualAuthorityEstablished: false,
    };
  }),
);

export const COURSE_G04_L11_IR_001_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
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

const ROOT_TO_ANIMATION = deepFreeze([ROOT_NAMED_PLACEMENT] as const);

export const COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_DISPOSITIONS =
  deepFreeze([
    {
      timelineId: "sprite-20",
      sourceTimelineId: "sprite-20",
      sourceObjectId: "20",
      localFrameCount: 135,
      structuralReachability: "reachable-from-root-placement-graph",
      rootPlacement: {
        status: "proven-named-placement-chain",
        namedPlacementPath: [
          ...ROOT_TO_ANIMATION,
          {
            parentTimelineId: "sprite-49",
            childTimelineId: "sprite-20",
            sourceObjectId: "20",
            frame: 1,
            depth: "179",
            instanceName: "Mc_Sound_0",
            tag: "PlaceObject2",
            replace: "0",
            hasClipActions: false,
          },
        ],
      },
      disposition: "unresolved",
      independentFrameDomainCandidate: true,
      independentFrameDomainProven: false,
      visualAuthorityEstablished: false,
      riskSignals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
      ],
      namedChildPlacementCount: 0,
    },
    {
      timelineId: "sprite-21",
      sourceTimelineId: "sprite-21",
      sourceObjectId: "21",
      localFrameCount: 135,
      structuralReachability: "reachable-from-root-placement-graph",
      rootPlacement: {
        status: "proven-named-placement-chain",
        namedPlacementPath: [
          ...ROOT_TO_ANIMATION,
          {
            parentTimelineId: "sprite-49",
            childTimelineId: "sprite-21",
            sourceObjectId: "21",
            frame: 1,
            depth: "181",
            instanceName: "Mc_Sound_1",
            tag: "PlaceObject2",
            replace: "0",
            hasClipActions: false,
          },
        ],
      },
      disposition: "unresolved",
      independentFrameDomainCandidate: true,
      independentFrameDomainProven: false,
      visualAuthorityEstablished: false,
      riskSignals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
      ],
      namedChildPlacementCount: 0,
    },
    {
      timelineId: "sprite-49",
      sourceTimelineId: "sprite-49",
      sourceObjectId: "49",
      localFrameCount: 136,
      structuralReachability: "reachable-from-root-placement-graph",
      rootPlacement: {
        status: "proven-named-placement-chain",
        namedPlacementPath: ROOT_TO_ANIMATION,
      },
      disposition: "unresolved",
      independentFrameDomainCandidate: true,
      independentFrameDomainProven: false,
      visualAuthorityEstablished: false,
      riskSignals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
        "direct-named-root-placement",
      ],
      namedChildPlacementCount: 2,
    },
  ] as const);

export const COURSE_G04_L11_IR_001_STATIC_TIMELINE_SUMMARY = deepFreeze({
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
  highRiskIndependentCandidateCount: 3,
  highRiskIndependentCandidates: [
    {
      timelineId: "sprite-49",
      sourceObjectId: "49",
      frameCount: 136,
      rootPlacementStatus: "proven-named-placement-chain",
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
        "direct-named-root-placement",
      ],
    },
    {
      timelineId: "sprite-20",
      sourceObjectId: "20",
      frameCount: 135,
      rootPlacementStatus: "proven-named-placement-chain",
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
      ],
    },
    {
      timelineId: "sprite-21",
      sourceObjectId: "21",
      frameCount: 135,
      rootPlacementStatus: "proven-named-placement-chain",
      signals: [
        "undeclared-structurally-root-reachable-timeline",
        "multiframe-local-playhead",
        "local-frame-count-exceeds-root",
        "local-frame-count-at-least-100",
      ],
    },
  ],
  completeRootReachableDomainInventory: false,
  independentFrameDomainsEstablished: false,
} as const);

export const COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_INVENTORY =
  deepFreeze(
    COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_DISPOSITIONS.map((row) => ({
      timelineId: row.timelineId,
      sourceTimelineId: row.sourceTimelineId,
      sourceObjectId: row.sourceObjectId,
      localFrameCount: row.localFrameCount,
      structuralReachability: row.structuralReachability,
      rootPlacement: row.rootPlacement,
      independentFrameDomainCandidate: row.independentFrameDomainCandidate,
      independentFrameDomainProven: row.independentFrameDomainProven,
      visualAuthorityEstablished: row.visualAuthorityEstablished,
    })),
  );

export const COURSE_G04_L11_IR_001_STATIC_FRAME_DOMAIN_DISPOSITIONS =
  deepFreeze([
    {
      timelineId: "root",
      sourceTimelineId: "root",
      sourceObjectId: null,
      localFrameCount: 10,
      structuralReachability: "root",
      rootPlacement: {status: "root-timeline", namedPlacementPath: []},
      disposition: "declared-frame-domain",
      independentFrameDomainCandidate: false,
      independentFrameDomainProven: false,
      visualAuthorityEstablished: false,
      riskSignals: ["source-timeline-already-declared-as-frame-domain"],
      namedChildPlacementCount: 1,
    },
    ...COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_DISPOSITIONS,
  ] as const);

export const COURSE_G04_L11_IR_001_STATIC_TIMELINE_INVENTORY_ROWS =
  deepFreeze([
    {
      timelineId: "root",
      sourceTimelineId: "root",
      sourceObjectId: null,
      localFrameCount: 10,
      structuralReachability: "root",
      rootPlacement: {status: "root-timeline", namedPlacementPath: []},
      declaredFrameDomainId: "root",
      disposition: "declared-frame-domain",
      independentFrameDomainCandidate: false,
      independentFrameDomainProven: false,
      visualAuthorityEstablished: false,
      riskSignals: ["source-timeline-already-declared-as-frame-domain"],
      controlStateCount: 3,
      frameLabelCount: 1,
      namedChildPlacementCount: 1,
    },
    ...COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_DISPOSITIONS.map((row) => ({
      timelineId: row.timelineId,
      sourceTimelineId: row.sourceTimelineId,
      sourceObjectId: row.sourceObjectId,
      localFrameCount: row.localFrameCount,
      structuralReachability: row.structuralReachability,
      rootPlacement: row.rootPlacement,
      declaredFrameDomainId: null,
      disposition: row.disposition,
      independentFrameDomainCandidate: row.independentFrameDomainCandidate,
      independentFrameDomainProven: row.independentFrameDomainProven,
      visualAuthorityEstablished: row.visualAuthorityEstablished,
      riskSignals: row.riskSignals,
      controlStateCount: row.timelineId === "sprite-49" ? 3 : 2,
      frameLabelCount: 0,
      namedChildPlacementCount: row.namedChildPlacementCount,
    })),
  ] as const);

export const COURSE_G04_L11_IR_001_STATIC_ACTION_RECORDS = deepFreeze([
  {
    kind: "blocked-source-script-record",
    id: "script-0001",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_20/frame_1/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 1,
    lineEnd: 2,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0002",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_20/frame_135/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 4,
    lineEnd: 5,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0003",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_21/frame_1/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 7,
    lineEnd: 8,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0004",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_21/frame_135/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 10,
    lineEnd: 11,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0005",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_49/frame_1/DoAction.as",
    bodyText:
      "tempNum = random(2);\n_global.tempRandomSoundMc = \"Mc_Sound_\" + tempNum;",
    bodyBytes: 71,
    bodySha256: "534196db1b9352db95897e78166465293f70844f5b18292d5da450cfeb3e9cbe",
    lineStart: 13,
    lineEnd: 15,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0006",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_49/frame_136/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 17,
    lineEnd: 18,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0007",
    sourceKind: "nested-do-action",
    sourcePath: "DefineSprite_49/frame_5/DoAction.as",
    bodyText: "eval(_global.tempRandomSoundMc).gotoAndPlay(2);",
    bodyBytes: 47,
    bodySha256: "4b2a8ea86d7a09876c10ea6d2e0abd838f294518275642d3c7f68c2257c8f16e",
    lineStart: 20,
    lineEnd: 21,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0008",
    sourceKind: "root-do-action",
    sourcePath: "frame_1/DoAction.as",
    bodyText:
      "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");\nstop();",
    bodyBytes: 60,
    bodySha256: "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3",
    lineStart: 23,
    lineEnd: 25,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
  {
    kind: "blocked-source-script-record",
    id: "script-0009",
    sourceKind: "root-do-action",
    sourcePath: "frame_6/DoAction.as",
    bodyText: "stop();",
    bodyBytes: 7,
    bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
    lineStart: 27,
    lineEnd: 28,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    behaviorEstablished: false,
    executableCallables: [],
  },
] as const);

export const COURSE_G04_L11_IR_001_STATIC_BLOCKED_BEHAVIOR_RECORDS =
  deepFreeze([
    {
      id: "random-two-selection-candidate",
      sourceScriptId: "script-0005",
      observedSourceFragment: "random(2)",
      policy: "blocked-record-only",
      semanticsExecuted: false,
      behaviorEstablished: false,
      executableCallables: [],
    },
    {
      id: "indirect-sound-symbol-navigation-candidate",
      sourceScriptId: "script-0007",
      observedSourceFragment: "eval(_global.tempRandomSoundMc).gotoAndPlay(2)",
      policy: "blocked-record-only",
      semanticsExecuted: false,
      behaviorEstablished: false,
      executableCallables: [],
    },
    {
      id: "root-preloader-jump-check-candidate",
      sourceScriptId: "script-0008",
      observedSourceFragment: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")",
      policy: "blocked-record-only",
      semanticsExecuted: false,
      behaviorEstablished: false,
      executableCallables: [],
    },
  ] as const);

export const COURSE_G04_L11_IR_001_STATIC_RANDOM_OBLIGATIONS = deepFreeze([
  {
    obligationId: "random-001",
    expression: "random(2)",
    requiredOutcomes: [0, 1],
    deterministicHarness:
      "record and inject the random result without enabling network, storage, or host side effects",
    sourceScriptId: "script-0005",
    sourcePath: "DefineSprite_49/frame_1/DoAction.as",
    line: 14,
    sourceActionSemanticsExecuted: false,
    deterministicOutcomeEvidenceEstablished: false,
  },
] as const);

export const COURSE_G04_L11_IR_001_STATIC_BLOCKED_HOST_DEPENDENCIES =
  deepFreeze([
    {
      id: "global-temp-random-sound-mc",
      expression: "_global.tempRandomSoundMc",
      sourceScriptId: "script-0005",
      sourcePath: "DefineSprite_49/frame_1/DoAction.as",
      line: 15,
      kind: "global-property",
      policy: "blocked-record-only",
      resolved: false,
      semanticsExecuted: false,
      fixtureRequirement:
        "Provide a deterministic source-derived global value only for authorized natural-trace work; this record does not provide one.",
      originalDefaultStatus: "unresolved",
      safeFixture: {
        mode: "not-provided-by-layer-a",
        originalBehaviorClaimed: false,
      },
      observedAssignment: {
        target: "_global.tempRandomSoundMc",
        operator: "=",
        expression: "\"Mc_Sound_\" + tempNum",
      },
    },
    {
      id: "root-internal-preloader",
      expression: "_level0.InternalPreloader",
      sourceScriptId: "script-0008",
      sourcePath: "frame_1/DoAction.as",
      line: 24,
      kind: "parent-root-host-property",
      policy: "blocked-record-only",
      resolved: false,
      semanticsExecuted: false,
      fixtureRequirement:
        "An inert host fixture must explicitly define or deny the preloader before authorized natural-trace work; this record does not provide one.",
      originalDefaultStatus: "unresolved",
      safeFixture: {
        mode: "not-provided-by-layer-a",
        originalBehaviorClaimed: false,
      },
      observedCall: {
        target: "_level0.InternalPreloader.gotoAndPlay",
        arguments: "\"jump_check\"",
      },
    },
  ] as const);

export const COURSE_G04_L11_IR_001_STATIC_INTERACTION_SUMMARY = deepFreeze({
  doActionCount: 9,
  buttonCount: 0,
  eventHandlerCount: 0,
  editTextCount: 0,
  externalCallCandidateCount: 0,
  conservativeMachineSignalCount: 17,
  randomSignalCount: 1,
  stopSignalCount: 7,
  sourceActionSemanticsExecuted: false,
  terminalBehaviorEstablished: false,
  replayBehaviorEstablished: false,
} as const);

export const COURSE_G04_L11_IR_001_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  kind: "unresolved-embedded-stream-static-obligation-set",
  manifestRequired: false,
  manifestRequiredDoesNotEstablishSilence: true,
  manifestAndStructuralEvidenceConflict: true,
  exactExternalAssociationCount: 0,
  alignmentDerivedExternalRowCount: 0,
  externalRowAbsenceDoesNotEraseEmbeddedStreams: true,
  embeddedInventoryRowCount: 2,
  defineSoundCount: 0,
  startSoundCount: 0,
  exportedSoundLinkageCount: 0,
  actionScriptSoundOperationCount: 0,
  streams: [
    {
      id: "embedded-stream-0001",
      sourceCharacterId: 20,
      timelineId: "sprite-20",
      language: "und",
      localHeadFrame: 1,
      localFirstBlockFrame: 1,
      localLastBlockFrame: 135,
      rootCueFrame: null,
      startSemantics: "interaction-state",
      syncMode: "stream",
      format: "swf-mp3-stream",
      channels: 1,
      sampleRateHz: 11_025,
      sampleSizeBits: 16,
      blockCount: 135,
      totalDecodedSamples: 124_992,
      durationMs: 11_337,
      durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
      sourceBoundObligation: true,
      sourceListeningAccepted: false,
      timingEstablished: false,
      rootReachabilityEstablished: false,
      spokenLanguageContentEstablished: false,
      randomSelectionEstablished: false,
      synchronizationEstablished: false,
      stopBehaviorEstablished: false,
      replayBehaviorEstablished: false,
    },
    {
      id: "embedded-stream-0002",
      sourceCharacterId: 21,
      timelineId: "sprite-21",
      language: "und",
      localHeadFrame: 1,
      localFirstBlockFrame: 1,
      localLastBlockFrame: 135,
      rootCueFrame: null,
      startSemantics: "interaction-state",
      syncMode: "stream",
      format: "swf-mp3-stream",
      channels: 1,
      sampleRateHz: 11_025,
      sampleSizeBits: 16,
      blockCount: 135,
      totalDecodedSamples: 124_992,
      durationMs: 11_337,
      durationBasis: "sum-of-mp3-soundstreamblock-sample-counts",
      sourceBoundObligation: true,
      sourceListeningAccepted: false,
      timingEstablished: false,
      rootReachabilityEstablished: false,
      spokenLanguageContentEstablished: false,
      randomSelectionEstablished: false,
      synchronizationEstablished: false,
      stopBehaviorEstablished: false,
      replayBehaviorEstablished: false,
    },
  ],
  acceptanceEstablished: false,
} as const);

export const COURSE_G04_L11_IR_001_STATIC_ROOT_REQUIREMENTS = deepFreeze([
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

export const COURSE_G04_L11_IR_001_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  currentJavaScriptCandidate: false,
  originalAuthorityEstablished: false,
  fullFrameComparisonComplete: false,
  audioEngineeringAccepted: false,
  humanVisualReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAcceptanceAccepted: false,
  strictComplete: false,
  publicationAuthorized: false,
  externalExposureRegistered: false,
  strictAcceptanceEffect: "none",
} as const);

export const COURSE_G04_L11_IR_001_STATIC_SOURCE_FACTS = deepFreeze({
  kind: "internal-source-static-specification",
  animationId: COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID,
  assetId:
    "swf-4fcd80c9533e667c929756519bdb4b5b8bd08aa2bc14cf2a6cb02a416953d218",
  source: {
    swf: COURSE_G04_L11_IR_001_STATIC_ARTIFACTS.sourceSwf,
    fla: COURSE_G04_L11_IR_001_STATIC_ARTIFACTS.sourceFla,
    lessonXml: COURSE_G04_L11_IR_001_STATIC_ARTIFACTS.lessonXml,
    catalogRelativeSwfPath: "HELP_COURSES/ELMGR4/L11/IR/L11RW01.swf",
    sourcePathDerivationProhibited: true,
    animationIdDoesNotDetermineFilename: true,
    disallowedFilenameDerivedAlternatives: [
      "HELP_COURSES/ELMGR4/L11/IR/L11IR01.swf",
      "HELP_COURSES/ELMGR4/L11/RW/L11RW01.swf",
    ],
    activeXmlOccurrence: {
      title: "Introduction",
      randomAudio: "Yes",
      backgroundText: "Yes",
      exactText:
        "<Page Title=\"Introduction\" RandomAudio=\"Yes\" BGText=\"Yes\">IR/L11RW01.swf</Page>",
    },
  },
  authoringInspection: {
    pairedFlaStatus: "present",
    machineAuditStatus: "not-performed-by-this-script",
    perFileFlaAuditStatus: "not-complete-legacy-conversion-dialog",
    applicationInstalled: true,
    blankDocumentProbeStatus: "passed",
    readinessScope: "tool-and-blank-document-only",
    comprehensiveCurrentContract: false,
    strictGateBlocked: true,
  },
  runtimeHeader: {
    signature: "CWS",
    version: 7,
    actionScriptVersion: "AS1/2",
    physicalSourceBytes: 90_557,
    declaredUncompressedBytes: 176_623,
    stageTwips: {width: 16_000, height: 12_000},
    stageRaster: {width: 800, height: 600, background: "#b8d8f7"},
    fps: 12,
    rootFrameCount: 10,
  },
  lessonMembership: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    releaseOrdinal: 1,
    xmlOccurrence: 1,
    releaseRole: "active-xml-referenced-page",
    shardId: "g04-l11-host-language",
    atomicMemberCount: 44,
  },
  declaredRootDomain: COURSE_G04_L11_IR_001_STATIC_DECLARED_ROOT_DOMAIN,
  rootFrameFacts: COURSE_G04_L11_IR_001_STATIC_ROOT_FRAME_FACTS,
  timelineInventoryRows: COURSE_G04_L11_IR_001_STATIC_TIMELINE_INVENTORY_ROWS,
  frameDomainDispositions:
    COURSE_G04_L11_IR_001_STATIC_FRAME_DOMAIN_DISPOSITIONS,
  nestedTimelineInventory:
    COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_INVENTORY,
  nestedTimelineDispositions:
    COURSE_G04_L11_IR_001_STATIC_NESTED_TIMELINE_DISPOSITIONS,
  timelineSummary: COURSE_G04_L11_IR_001_STATIC_TIMELINE_SUMMARY,
  actionRecords: COURSE_G04_L11_IR_001_STATIC_ACTION_RECORDS,
  blockedBehaviorRecords: COURSE_G04_L11_IR_001_STATIC_BLOCKED_BEHAVIOR_RECORDS,
  randomObligations: COURSE_G04_L11_IR_001_STATIC_RANDOM_OBLIGATIONS,
  blockedHostDependencies:
    COURSE_G04_L11_IR_001_STATIC_BLOCKED_HOST_DEPENDENCIES,
  interactionSummary: COURSE_G04_L11_IR_001_STATIC_INTERACTION_SUMMARY,
  audioObligations: COURSE_G04_L11_IR_001_STATIC_AUDIO_OBLIGATIONS,
  rootRequirements: COURSE_G04_L11_IR_001_STATIC_ROOT_REQUIREMENTS,
  evidenceBoundary: COURSE_G04_L11_IR_001_STATIC_EVIDENCE_BOUNDARY,
} as const);

type Blocker =
  | "invalid-animation-id"
  | "invalid-frame-domain-id"
  | "invalid-frame"
  | "invalid-timeline-id"
  | "invalid-script-id"
  | "invalid-requirement-id"
  | "invalid-language"
  | "invalid-scenario";

const requestedScalar = (value: unknown): string | number | boolean | null =>
  typeof value === "string" || typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
    ? value
    : null;

const blocked = (
  blocker: Blocker,
  animationId: unknown,
  requestedValue: unknown,
) => deepFreeze({
  status: "BLOCKED_UNVERIFIED",
  blocker,
  requestedAnimationId: requestedScalar(animationId),
  requestedValue: requestedScalar(requestedValue),
  facts: null,
} as const);

export const getStaticSourceFacts = (animationId: unknown) =>
  animationId === COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_IR_001_STATIC_SOURCE_FACTS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticDeclaredFrameDomain = (
  animationId: unknown,
  frameDomainId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frameDomainId);
  }
  return frameDomainId === "root"
    ? COURSE_G04_L11_IR_001_STATIC_DECLARED_ROOT_DOMAIN
    : blocked("invalid-frame-domain-id", animationId, frameDomainId);
};

export const getStaticRootFrameFact = (
  animationId: unknown,
  frame: unknown,
) => {
  if (animationId !== COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frame);
  }
  if (!Number.isInteger(frame) || (frame as number) < 1 ||
    (frame as number) > 10) {
    return blocked("invalid-frame", animationId, frame);
  }
  return COURSE_G04_L11_IR_001_STATIC_ROOT_FRAME_FACTS[(frame as number) - 1];
};

export const getStaticTimelineDisposition = (
  animationId: unknown,
  timelineId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, timelineId);
  }
  const disposition = COURSE_G04_L11_IR_001_STATIC_FRAME_DOMAIN_DISPOSITIONS
    .find((candidate) => candidate.timelineId === timelineId);
  return disposition ?? blocked("invalid-timeline-id", animationId, timelineId);
};

export const getStaticActionRecord = (
  animationId: unknown,
  scriptId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, scriptId);
  }
  const record = COURSE_G04_L11_IR_001_STATIC_ACTION_RECORDS.find(
    (candidate) => candidate.id === scriptId,
  );
  return record ?? blocked("invalid-script-id", animationId, scriptId);
};

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_IR_001_STATIC_AUDIO_OBLIGATIONS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticRootRequirement = (
  animationId: unknown,
  requirementId: unknown,
  language: unknown,
  scenario: unknown,
) => {
  if (animationId !== COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, requirementId);
  }
  const requirement = COURSE_G04_L11_IR_001_STATIC_ROOT_REQUIREMENTS.find(
    (candidate) => candidate.requirementId === requirementId,
  );
  if (!requirement) {
    return blocked("invalid-requirement-id", animationId, requirementId);
  }
  if (language !== requirement.language) {
    return blocked("invalid-language", animationId, language);
  }
  if (scenario !== requirement.scenario) {
    return blocked("invalid-scenario", animationId, scenario);
  }
  return requirement;
};

export const getStaticBlockedBehaviorRecords = (animationId: unknown) =>
  animationId === COURSE_G04_L11_IR_001_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_IR_001_STATIC_BLOCKED_BEHAVIOR_RECORDS
    : blocked("invalid-animation-id", animationId, null);
