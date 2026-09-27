/**
 * Current, source-bound FQ003 sprite-910 frame-domain inspection.
 *
 * The declaration proves that sprite-910 needs its own 72-frame local domain.
 * It does not provide a runtime entry, execute AVM1, model quiz/score/Replay
 * behavior, register a renderer, or create Current-JavaScript evidence.
 */

import {
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE,
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
  COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
  inspectCourseG04L11Fq003PredecessorSourceFrame,
} from "./course-g04-l11-fq-003-predecessor";

export const COURSE_G04_L11_FQ_003_ANIMATION_ID =
  "course-g04-l11-fq-003" as const;
export const COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN =
  "sprite-910" as const;
export const COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO =
  "source-proven-independent-domain-entry-unresolved" as const;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const COURSE_G04_L11_FQ_003_SOURCE_FRAME_LANGUAGES = deepFreeze([
  "en",
  "es",
] as const);

export type CourseG04L11Fq003SourceFrameLanguage =
  (typeof COURSE_G04_L11_FQ_003_SOURCE_FRAME_LANGUAGES)[number];

export const COURSE_G04_L11_FQ_003_SOURCE = deepFreeze({
  animationId: COURSE_G04_L11_FQ_003_ANIMATION_ID,
  assetId: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.assetId,
  releaseMembership: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.releaseMembership,
  fla: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.fla,
  swf: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.swf,
  runtimeHeader: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.runtimeHeader,
  historicalPredecessor: {
    module: {
      path: "packages/demos/src/source-domain-specifications/g4-l11/course-g04-l11-fq-003-predecessor.ts" as const,
      bytes: 29_557,
      sha256: "5761e8411545052ea24d76f0e500c10866a7852b486afcc4e26c4c04d9c9e18c",
    },
    sourceStaticModule: {
      path: "packages/demos/src/source-static/g4-l11/course-g04-l11-fq-003-static.ts" as const,
      bytes: 83_736,
      sha256: "ebdfde9938730420f7e57752ca24ffeebf78f830854d886b2f56cf604e7b7e60",
    },
    observedState: "predecessor" as const,
    sourceDomainDeclared: false,
  },
  declarationReceipt: {
    path: "work/g4-l11-fq003-sprite910-source-domain-declaration-applied-receipt/receipts/sha256/06029ba0ffe167e3a28bfe27a250f8a89f4043ea9d56786a0a31a6188a6f499c.json" as const,
    bytes: 11_548,
    sha256: "06029ba0ffe167e3a28bfe27a250f8a89f4043ea9d56786a0a31a6188a6f499c",
    status: "sprite910-source-domain-declared" as const,
  },
  sourceDomainEvidence: {
    path: "migrations/course-g04-l11-fq-003/audit/source-proven-independent-frame-domain-evidence.json" as const,
    bytes: 6_592,
    sha256: "eb7572eacee0f99fe4c412ffdf5a9a9fd81db2e821ff11269297a2153a815ab4",
    claimIndex: 0,
    status: "verified-source-obligation" as const,
  },
  sourceDomainDeclarationBindings: {
    migrationManifest: {
      path: "migrations/course-g04-l11-fq-003/migration.json" as const,
      bytes: 10_141,
      sha256: "441bf0f0c6a4cb304b9f513804c73590df93410217fbd335a8f6d8cff789f80d",
    },
    scenarioInventory: {
      path: "migrations/course-g04-l11-fq-003/audit/scenario-inventory.json" as const,
      bytes: 2_676_520,
      sha256: "3cd7718749f8a40e298b779354f26936b04d71bc7eb692db1fa9c814cbf20cbc",
    },
    frameDomainDisposition: {
      path: "migrations/course-g04-l11-fq-003/audit/frame-domain-disposition.json" as const,
      bytes: 554_489,
      sha256: "ba27a99a46b5be1c6688bdf0f0408a479166899911ad8a7e98b2e2a76003452c",
    },
  },
  sprite910: {
    ...COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE.sprite910,
    id: COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN,
    currentDisposition: "declared-frame-domain" as const,
    parentFrameDomainId: "root" as const,
  },
  currentFrameDomainState: {
    persistedDeclaredTimelineIds: ["root", "sprite-910"],
    declaredFrameDomains: ["sprite-910"],
    sprite910Disposition: "declared-frame-domain" as const,
    sourceStaticIndependentDomainProven: true,
    successorProofPresent: true,
    sourceDomainDeclared: true,
    unresolvedTimelineCount: 212,
  },
  scenario: {
    id: COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO,
    kind: "source-proven-structural-entry-runtime-unresolved" as const,
    reachable: true,
    reachabilityAuthority: "structural-root-placement-graph-only" as const,
    authoritativeRuntimeEntryEstablished: false,
    strictAcceptanceEffect: "none" as const,
  },
  sourceProof: {
    timelineId: COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "910" as const,
    frameCount: 72,
    parentTimelineIds: ["root"],
    proofType: "multi-frame-local-action-independent-domain" as const,
    claimScope: "separate-local-frame-action-domain-required" as const,
    directDoActionTagCount: 3,
    ffdecFrameScriptCount: 3,
    actionFrames: [1, 29, 45],
    actionFrameSequenceSha256:
      "7095a44e6932286e17b87b6263eabeb07049991e15a87f567c280dff2c0af849",
    actionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1" as const,
    materialized: true,
    successorPresent: true,
    sourceDomainDeclared: true,
    authoritativeRuntimeEntryEstablished: false,
    strictAcceptanceEffect: "none" as const,
  },
  blockers: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE
    .predecessorProposal.proposalCore.blockers,
  inspectionContract: {
    frameRange: {first: 1, last: 72},
    supportedLanguages: ["en", "es"],
    supportedScenario: COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO,
    supportedSeed: 0,
    rootFrame: null,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    implementationAuthorized: false,
    rendererAuthorized: false,
    registryEntryAuthorized: false,
    currentJavascriptAuthorized: false,
    wholeLessonEntryAuthorized: false,
  },
});

export const COURSE_G04_L11_FQ_003_EVIDENCE_CAVEATS = deepFreeze({
  structuralSourceEvidenceOnly: true,
  sourceDomainDeclared: true,
  proofMaterialized: true,
  authoritativeOriginalRuntimeEstablished: false,
  runtimeEntryEstablished: false,
  runtimeReachabilityEstablished: false,
  sourceActionSemanticsExecuted: false,
  quizBehaviorEstablished: false,
  scoreBehaviorEstablished: false,
  replayBehaviorEstablished: false,
  audioModeled: false,
  audioAccepted: false,
  naturalTraceEstablished: false,
  currentJavascriptImplemented: false,
  rendererRegistered: false,
  visualFidelityEstablished: false,
  behaviorParityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  candidateQaCompleted: false,
  strictComplete: false,
  published: false,
  strictAcceptanceEffect: "none" as const,
});

export type CourseG04L11Fq003SourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Fq003SourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11Fq003SourceFrameInspection {
  readonly status: "source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11Fq003SourceFrameLanguage;
  readonly seed: 0;
  readonly rootFrame: null;
  readonly sourceDomainDeclared: true;
  readonly rootPlacement: typeof COURSE_G04_L11_FQ_003_SOURCE.sprite910.rootPlacement;
  readonly frameLabel:
    | (typeof COURSE_G04_L11_FQ_003_SOURCE.sprite910.frameLabels)[number]
    | null;
  readonly structuralMarkers: readonly string[];
  readonly avm1Action: Readonly<{
    readonly presentAtRequestedFrame: boolean;
    readonly sourceRecord:
      | (typeof COURSE_G04_L11_FQ_003_SOURCE.sprite910.actionRecords)[number]
      | null;
    readonly recordOnly: true;
    readonly semanticsExecuted: false;
  }>;
  readonly tagCensus: typeof COURSE_G04_L11_FQ_003_SOURCE.sprite910.tagCensus;
  readonly blockers: typeof COURSE_G04_L11_FQ_003_SOURCE.blockers;
  readonly sourceProof: typeof COURSE_G04_L11_FQ_003_SOURCE.sourceProof;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_FQ_003_EVIDENCE_CAVEATS;
}

export interface CourseG04L11Fq003BlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11Fq003SourceFrameInspectionBlocker;
  readonly frame: null;
  readonly frameDomain: null;
  readonly scenario: null;
  readonly lang: null;
  readonly seed: null;
  readonly sourceDomainDeclared: true;
  readonly captureIdentity: null;
  readonly requirementId: null;
  readonly traceId: null;
  readonly entryStateSha256: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_FQ_003_EVIDENCE_CAVEATS;
}

export type CourseG04L11Fq003SourceFrameInspectionResult =
  | CourseG04L11Fq003SourceFrameInspection
  | CourseG04L11Fq003BlockedSourceFrameInspection;

type ExactRequestValues = Readonly<{
  frameDomain: unknown;
  scenario: unknown;
  lang: unknown;
  seed: unknown;
}>;

const exactRequestValues = (request: object): ExactRequestValues | null => {
  try {
    const expectedKeys = ["frameDomain", "scenario", "lang", "seed"] as const;
    const ownKeys = Reflect.ownKeys(request);
    if (ownKeys.length !== expectedKeys.length
      || ownKeys.some((key) => typeof key !== "string")
      || expectedKeys.some((key) => !ownKeys.includes(key))) return null;
    const descriptors = Object.getOwnPropertyDescriptors(request);
    if (Reflect.ownKeys(descriptors).length !== expectedKeys.length) return null;
    for (const key of expectedKeys) {
      const descriptor = descriptors[key];
      if (descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.prototype.hasOwnProperty.call(descriptor, "value")
        || Object.prototype.hasOwnProperty.call(descriptor, "get")
        || Object.prototype.hasOwnProperty.call(descriptor, "set")) return null;
    }
    return {
      frameDomain: descriptors.frameDomain.value,
      scenario: descriptors.scenario.value,
      lang: descriptors.lang.value,
      seed: descriptors.seed.value,
    };
  } catch {
    return null;
  }
};

const blockedInspection = (
  blocker: CourseG04L11Fq003SourceFrameInspectionBlocker,
): CourseG04L11Fq003BlockedSourceFrameInspection => deepFreeze({
  status: "blocked" as const,
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  sourceDomainDeclared: true as const,
  captureIdentity: null,
  requirementId: null,
  traceId: null,
  entryStateSha256: null,
  evidenceCaveats: COURSE_G04_L11_FQ_003_EVIDENCE_CAVEATS,
}) as CourseG04L11Fq003BlockedSourceFrameInspection;

/**
 * Inspect one exact, one-indexed sprite-910 local source frame. Success proves
 * source structure only. It deliberately returns no root playhead, capture
 * identity, runtime state, rendered state, or executed AVM1 result.
 */
export const inspectCourseG04L11Fq003SourceFrame = (
  frame: unknown,
  request: unknown,
): CourseG04L11Fq003SourceFrameInspectionResult => {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    return blockedInspection("invalid-request");
  }
  const values = exactRequestValues(request);
  if (values === null) return blockedInspection("invalid-request");
  if (values.frameDomain !== COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN) {
    return blockedInspection("unsupported-frame-domain");
  }
  if (!COURSE_G04_L11_FQ_003_SOURCE_FRAME_LANGUAGES.includes(
    values.lang as CourseG04L11Fq003SourceFrameLanguage,
  )) return blockedInspection("unsupported-language");
  if (values.scenario !== COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO) {
    return blockedInspection("unsupported-scenario");
  }
  if (!Object.is(values.seed, 0)) return blockedInspection("unsupported-seed");
  if (typeof frame !== "number" || !Number.isSafeInteger(frame)
    || frame < 1 || frame > COURSE_G04_L11_FQ_003_SOURCE.sprite910.frameCount) {
    return blockedInspection("invalid-frame");
  }

  const historical = inspectCourseG04L11Fq003PredecessorSourceFrame(frame, {
    frameDomain: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_FQ_003_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: values.lang,
    seed: 0,
  });
  if (historical.status !== "prospective-source-static") {
    throw new Error("validated successor request did not resolve historical structure");
  }

  return deepFreeze({
    status: "source-static" as const,
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_FQ_003_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_FQ_003_SOURCE_FRAME_SCENARIO,
    lang: values.lang as CourseG04L11Fq003SourceFrameLanguage,
    seed: 0 as const,
    rootFrame: null,
    sourceDomainDeclared: true as const,
    rootPlacement: historical.rootPlacement,
    frameLabel: historical.frameLabel,
    structuralMarkers: historical.structuralMarkers,
    avm1Action: historical.avm1Action,
    tagCensus: historical.tagCensus,
    blockers: COURSE_G04_L11_FQ_003_SOURCE.blockers,
    sourceProof: COURSE_G04_L11_FQ_003_SOURCE.sourceProof,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_FQ_003_EVIDENCE_CAVEATS,
  }) as CourseG04L11Fq003SourceFrameInspection;
};
