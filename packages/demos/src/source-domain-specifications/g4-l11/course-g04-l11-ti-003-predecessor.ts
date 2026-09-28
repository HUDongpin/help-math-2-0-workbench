/**
 * This is a predecessor-bound, source-static inspection query. It records
 * structural facts that a later source-domain declaration must preserve; it
 * does not declare sprite-346 as a frame domain or provide a playback API.
 */

export const COURSE_G04_L11_TI_003_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-ti-003" as const;
export const COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN =
  "sprite-346" as const;
export const COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_SCENARIO =
  "prospective-source-domain-entry-unresolved" as const;

const COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES = Object.freeze([
  "en",
  "es",
] as const);

export type CourseG04L11Ti003PredecessorSourceFrameLanguage =
  (typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES)[number];

const COURSE_G04_L11_TI_003_PREDECESSOR_ROOT_PLACEMENT = Object.freeze({
  parentTimelineId: "root" as const,
  childTimelineId: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
  sourceObjectId: "346" as const,
  frame: 6,
  depth: "4" as const,
  instanceName: "animation" as const,
  tag: "PlaceObject2" as const,
  replace: "0" as const,
  hasClipActions: false,
});

const COURSE_G04_L11_TI_003_PREDECESSOR_ACTION_RECORDS = Object.freeze([
  Object.freeze({
    frame: 1,
    script: "DefineSprite_346/frame_1/DoAction.as" as const,
    bodyBytes: 0,
    bodySha256:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  }),
  Object.freeze({
    frame: 235,
    script: "DefineSprite_346/frame_235/DoAction.as" as const,
    bodyBytes: 2658,
    bodySha256:
      "e7e9d79299767afcf7624e47a7694618e6546aac6b9b391ee7ec09b23be34d71",
    avm1Marker: "record-only" as const,
    semanticsExecuted: false,
  }),
] as const);

const COURSE_G04_L11_TI_003_PREDECESSOR_TAG_CENSUS = Object.freeze({
  DoAction: 2,
  ShowFrame: 236,
  PlaceObject2: 129,
  RemoveObject2: 50,
  SoundStreamHead: 1,
  SoundStreamBlock: 213,
  End: 1,
});

/**
 * Every binding below is predecessor input only. In particular, no generated
 * source-domain proof, trace specification, capture artifact, or declaration
 * is bound here because none exists in this predecessor state.
 */
const COURSE_G04_L11_TI_003_PREDECESSOR_INPUTS = Object.freeze({
  migrationManifest: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/migration.json",
    bytes: 7003,
    sha256:
      "df551ba1a874d7f35c73f15f8f4a0f9dcf38c705c61cb6512fa2c305bfcd25bc",
  }),
  scenarioInventory: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/scenario-inventory.json",
    bytes: 625895,
    sha256:
      "d008c6900a61fe0988d5b183fbe82a1798a4f6eda4a61f0904940b7dc4d6be77",
  }),
  frameDomainDisposition: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/frame-domain-disposition.json",
    bytes: 57898,
    sha256:
      "444768f9a424b05f672fcdda66ac7f2c99e9e524adca10f19c65f0514c2252ab",
  }),
  machineReport: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/machine/report.json",
    bytes: 22455,
    sha256:
      "0118afe46f801f8e3a77f4c951400f96cbadcbb137f8edc11550f000aff1658c",
  }),
  machineFrameDomainCandidates: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/machine/swf-frame-domain-candidates.json",
    bytes: 9020,
    sha256:
      "0c7169c9db5c958a0b59716b684d942ee484bc680b097fd977a2951013a0a189",
  }),
  swfmillXml: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/machine/swfmill.xml.gz",
    bytes: 978340,
    sha256:
      "c9425dcd36a927a457499457deb369d525c408b000445e930665e62962038885",
  }),
  ffdecScripts: Object.freeze({
    path: "migrations/course-g04-l11-ti-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 1514,
    sha256:
      "b15f831eab680f1d9b2798d761e0f441ea8d037016436eacaecad0b80df74d1d",
  }),
  prospectivePlanner: Object.freeze({
    path: "scripts/materialize-g4-l11-ti003-sprite346-source-proven-domain.mjs",
    bytes: 62610,
    sha256:
      "1224c00102447d8ec629de4467547333f867bfe1c3ee0e10515f5c8cbf46bb5c",
  }),
});

export const COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE = Object.freeze({
  animationId: COURSE_G04_L11_TI_003_PREDECESSOR_ANIMATION_ID,
  assetId:
    "swf-83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  fla: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.fla",
    bytes: 3131904,
    sha256:
      "6197a41fd60bd1f18a2f54b911e0498c0c57dffb4091d46e6253747752a387d0",
  }),
  swf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TI/L11TI03.swf",
    bytes: 442966,
    sha256:
      "83b37fa15719e6e50b328ea8621a19a9d362351a706be333b48b2d6730ecc987",
  }),
  stage: Object.freeze({
    twips: Object.freeze({
      units: "twips" as const,
      width: 15998,
      height: 11995,
      twipsPerPixel: 20,
    }),
    native: Object.freeze({
      units: "px" as const,
      width: 799.9,
      height: 599.75,
    }),
    captureRaster: Object.freeze({
      units: "px" as const,
      width: 800,
      height: 600,
      rule: "ceil-positive-native-stage-dimensions" as const,
    }),
  }),
  fps: 12,
  root: Object.freeze({
    id: "root" as const,
    frameCount: 10,
  }),
  sprite346: Object.freeze({
    id: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "346" as const,
    frameCount: 236,
    frameIndexing: "one-indexed" as const,
    rootPlacement: COURSE_G04_L11_TI_003_PREDECESSOR_ROOT_PLACEMENT,
    tagCensus: COURSE_G04_L11_TI_003_PREDECESSOR_TAG_CENSUS,
    actionFrames: Object.freeze([1, 235] as const),
    actionFrameSequenceSha256:
      "4d684c802881beca1576a7dc7b32c909533f90d81995102b75c7ce094ce0cc64",
    actionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1" as const,
    actionRecords: COURSE_G04_L11_TI_003_PREDECESSOR_ACTION_RECORDS,
  }),
  /** This child is recorded only as an unresolved source obligation. */
  sprite345: Object.freeze({
    sourceObjectId: "345" as const,
    frameCount: 55,
    status: "unresolved-child" as const,
    declaredFrameDomain: false,
  }),
  predecessorInputs: COURSE_G04_L11_TI_003_PREDECESSOR_INPUTS,
  sourceDomainDeclared: false,
  captureIdentity: null,
});

/**
 * A successful inspection remains structural evidence. No boolean in this
 * object can be upgraded by inspecting a source frame.
 */
export const COURSE_G04_L11_TI_003_PREDECESSOR_EVIDENCE_CAVEATS = Object.freeze({
  structuralSourceEvidenceOnly: true,
  sourceDomainDeclared: false,
  authoritativeOriginalRuntimeEstablished: false,
  runtimeEntryEstablished: false,
  sourceActionSemanticsExecuted: false,
  interactionImplemented: false,
  audioModeled: false,
  audioAccepted: false,
  naturalTraceEstablished: false,
  visualFidelityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  candidateQaCompleted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
  strictAcceptanceEffect: "none" as const,
});

export type CourseG04L11Ti003PredecessorSourceFrameStructuralMarker =
  | "first-local-frame"
  | "record-only-avm1-doaction-frame"
  | "last-local-frame";

export type CourseG04L11Ti003PredecessorSourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Ti003PredecessorSourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11Ti003PredecessorSourceFrameInspection {
  readonly status: "prospective-source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11Ti003PredecessorSourceFrameLanguage;
  readonly seed: 0;
  /** A static placement record cannot establish a root playhead position. */
  readonly rootFrame: null;
  readonly sourceDomainDeclared: false;
  readonly rootPlacement: typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.rootPlacement;
  readonly structuralMarkers: readonly CourseG04L11Ti003PredecessorSourceFrameStructuralMarker[];
  readonly avm1Action: Readonly<{
    readonly presentAtRequestedFrame: boolean;
    readonly sourceRecord:
      | (typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.actionRecords)[number]
      | null;
    readonly recordOnly: true;
    readonly semanticsExecuted: false;
  }>;
  readonly tagCensus: typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.tagCensus;
  readonly unresolvedChild: typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite345;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_TI_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export interface CourseG04L11Ti003PredecessorBlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11Ti003PredecessorSourceFrameInspectionBlocker;
  readonly frame: null;
  readonly frameDomain: null;
  readonly scenario: null;
  readonly lang: null;
  readonly seed: null;
  readonly sourceDomainDeclared: false;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_TI_003_PREDECESSOR_EVIDENCE_CAVEATS;
}

export type CourseG04L11Ti003PredecessorSourceFrameInspectionResult =
  | CourseG04L11Ti003PredecessorSourceFrameInspection
  | CourseG04L11Ti003PredecessorBlockedSourceFrameInspection;

const isSourceFrameLanguage = (
  value: unknown,
): value is CourseG04L11Ti003PredecessorSourceFrameLanguage =>
  COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_LANGUAGES.includes(
    value as CourseG04L11Ti003PredecessorSourceFrameLanguage,
  );

const isSourceFrame = (frame: unknown): frame is number =>
  typeof frame === "number"
  && Number.isSafeInteger(frame)
  && frame >= 1
  && frame <= COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.frameCount;

const hasExactRequestShape = (
  request: object,
): request is Readonly<Record<keyof CourseG04L11Ti003PredecessorSourceFrameInspectionRequest, unknown>> => {
  try {
    const keys = Reflect.ownKeys(request).sort((left, right) =>
      String(left).localeCompare(String(right)));
    return keys.length === 4
      && keys.every((key) => typeof key === "string")
      && keys[0] === "frameDomain"
      && keys[1] === "lang"
      && keys[2] === "scenario"
      && keys[3] === "seed";
  } catch {
    return false;
  }
};

const structuralMarkersForSourceFrame = (
  frame: number,
): readonly CourseG04L11Ti003PredecessorSourceFrameStructuralMarker[] => {
  const markers: CourseG04L11Ti003PredecessorSourceFrameStructuralMarker[] = [];
  if (frame === 1) markers.push("first-local-frame");
  if (frame === 1 || frame === 235) {
    markers.push("record-only-avm1-doaction-frame");
  }
  if (frame === COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.frameCount) {
    markers.push("last-local-frame");
  }
  return Object.freeze(markers);
};

const actionRecordForSourceFrame = (
  frame: number,
): (typeof COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.actionRecords)[number] | null =>
  COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.actionRecords.find(
    (record) => record.frame === frame,
  ) ?? null;

const blockedSourceFrameInspection = (
  blocker: CourseG04L11Ti003PredecessorSourceFrameInspectionBlocker,
): CourseG04L11Ti003PredecessorBlockedSourceFrameInspection => Object.freeze({
  status: "blocked",
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  sourceDomainDeclared: false,
  captureIdentity: null,
  requirementId: null,
  traceId: null,
  entryStateSha256: null,
  evidenceCaveats: COURSE_G04_L11_TI_003_PREDECESSOR_EVIDENCE_CAVEATS,
});

/**
 * Inspect one exact one-indexed sprite-346 source frame. The public boundary
 * accepts unknown values, rejects malformed objects and every unsupported
 * field without coercion, and returns no root-frame, capture, or runtime
 * state. It is deliberately not an addressable playback-state query.
 */
export const inspectCourseG04L11Ti003PredecessorSourceFrame = (
  frame: unknown,
  request: unknown,
): CourseG04L11Ti003PredecessorSourceFrameInspectionResult => {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    return blockedSourceFrameInspection("invalid-request");
  }
  if (!hasExactRequestShape(request)) {
    return blockedSourceFrameInspection("invalid-request");
  }

  let frameDomain: unknown;
  let language: unknown;
  let scenario: unknown;
  let seed: unknown;
  try {
    frameDomain = request.frameDomain;
    language = request.lang;
    scenario = request.scenario;
    seed = request.seed;
  } catch {
    return blockedSourceFrameInspection("invalid-request");
  }

  if (frameDomain !== COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN) {
    return blockedSourceFrameInspection("unsupported-frame-domain");
  }
  if (!isSourceFrameLanguage(language)) {
    return blockedSourceFrameInspection("unsupported-language");
  }
  if (scenario !== COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_SCENARIO) {
    return blockedSourceFrameInspection("unsupported-scenario");
  }
  if (!Object.is(seed, 0)) return blockedSourceFrameInspection("unsupported-seed");
  if (!isSourceFrame(frame)) return blockedSourceFrameInspection("invalid-frame");

  const sourceRecord = actionRecordForSourceFrame(frame);
  return Object.freeze({
    status: "prospective-source-static",
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: language,
    seed: 0,
    rootFrame: null,
    sourceDomainDeclared: false,
    rootPlacement: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.rootPlacement,
    structuralMarkers: structuralMarkersForSourceFrame(frame),
    avm1Action: Object.freeze({
      presentAtRequestedFrame: sourceRecord !== null,
      sourceRecord,
      recordOnly: true,
      semanticsExecuted: false,
    }),
    tagCensus: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite346.tagCensus,
    unresolvedChild: COURSE_G04_L11_TI_003_PREDECESSOR_SOURCE.sprite345,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_TI_003_PREDECESSOR_EVIDENCE_CAVEATS,
  });
};
