/**
 * Machine-only FQ001 display-list/source-static predecessor.
 *
 * This module exposes hash-bound structural observations. It does not execute
 * AVM1, advance a Flash playhead, render pixels, start audio, or change any
 * implementation, review, completion, release, or publication state.
 */

export const COURSE_G04_L11_FQ_001_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-fq-001" as const;
export const COURSE_G04_L11_FQ_001_PREDECESSOR_FRAME_DOMAIN = "root" as const;
export const COURSE_G04_L11_FQ_001_PREDECESSOR_SCENARIO =
  "machine-source-static-display-list" as const;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const LANGUAGES = deepFreeze(["en", "es"] as const);
export type CourseG04L11Fq001PredecessorLanguage =
  (typeof LANGUAGES)[number];

export const COURSE_G04_L11_FQ_001_PREDECESSOR_ARTIFACT_BINDINGS = deepFreeze({
  sourceSwf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.swf",
    bytes: 20_950,
    sha256: "9226553896cda584d9c03f784bc6f104ac4a9a80c3f6128bf14268f9719d7ba7",
  },
  sourceFla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ01.fla",
    bytes: 345_600,
    sha256: "3a0ce0652238505348f2fba067546b0533149a68b681f9df3fffe4f455be0d73",
  },
  sourceStaticModule: {
    path: "packages/demos/src/source-static/g4-l11/course-g04-l11-fq-001-static.ts",
    bytes: 24_531,
    sha256: "a21ddd6f2c2b44b95582a1dd5a2c587b2f5532ccc50b228ed186706fb6b263a3",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/ffdec-script-index.txt",
    bytes: 735,
    sha256: "338c76f8528bc168d4945067cbe16b27e0421d741cdf7f2a351308245d6ad243",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/swfmill-summary.json",
    bytes: 3_062,
    sha256: "6cb7d70496531a63b42e4a8ff1158c726901fb02460769910603b4c2217e5613",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-fq-001/audit/machine/swfmill.xml.gz",
    bytes: 34_847,
    sha256: "ecdd052ea679ef65f78f09ae461a8bbcab280ff8593a534c9eb4b3caf0d5a831",
    uncompressedBytes: 581_322,
    uncompressedSha256:
      "1040829d24f8e743e0c6ff485258982b8b95b39bc53543008803d96d4471b3f0",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-fq-001/evidence/full-frame-coverage.json",
    bytes: 8_138,
    sha256: "317227ed2b624b86ecf8bcafb4f205c69415275ca66eec4ebc8fd58e03ef3cef",
  },
  traceSpecEn: {
    path: "migrations/course-g04-l11-fq-001/audit/trace-specs/lesson-releases/lesson-g04-l11-coordinate-grid/req-default-root-en.json",
    bytes: 18_421,
    sha256: "2a28dfca3f1faeceaf4b75c905d3b129f657b240a3ae51b572a1c2ce959f3f75",
  },
  traceSpecEs: {
    path: "migrations/course-g04-l11-fq-001/audit/trace-specs/lesson-releases/lesson-g04-l11-coordinate-grid/req-default-root-es.json",
    bytes: 18_421,
    sha256: "c8d9e5fd89a6780a57b719ceb401ab4df0aec7f43c20e1ddbc13ad58181bccf2",
  },
  traceSubsetIndex: {
    path: "migrations/lesson-release-trace-spec-indexes/lesson-g04-l11-coordinate-grid--subset-e98093d1ae27bb0c88a600baf05d005aea63e45f2a8ad21694879468c67d6761.json",
    bytes: 8_113,
    sha256: "2d10f99f234eab4f45bbc811769f72056799841e8f4211038e898ddeb34ebb82",
  },
  structuralKeyframes: {
    path: "migrations/course-g04-l11-fq-001/keyframes.csv",
    bytes: 23_362,
    sha256: "4384182f02637912dd3c62d9010cc225160acb5f6bfba1586424712385b0afb1",
  },
} as const);

const ROOT_PLACEMENTS = deepFreeze([
  {
    rootFrame: 6,
    depth: "1",
    instanceName: "Mc_BackText",
    timelineId: "sprite-22",
    sourceObjectId: "22",
    localFrameCount: 1,
  },
  {
    rootFrame: 6,
    depth: "10",
    instanceName: "animation",
    timelineId: "sprite-68",
    sourceObjectId: "68",
    localFrameCount: 52,
  },
] as const);

const ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    return {
      frame,
      label: frame === 6 ? "begin" : null,
      stopRecordPresent: frame === 1 || frame === 6,
      preloaderJumpCheckRecordPresent: frame === 1,
      namedPlacements: frame === 6 ? ROOT_PLACEMENTS : [],
      terminalStructuralFrame: frame === 10,
      runtimeReached: false,
      scriptSemanticsExecuted: false,
      visualAuthorityEstablished: false,
    };
  }),
);

export const COURSE_G04_L11_FQ_001_PREDECESSOR_AUTHORITY_BOUNDARY = deepFreeze({
  structuralSourceEvidenceOnly: true,
  authoritativeOriginalRuntimeEstablished: false,
  behaviorEstablished: false,
  runtimeBehaviorEstablished: false,
  runtimeReachabilityEstablished: false,
  naturalTraceEstablished: false,
  sourceActionSemanticsExecuted: false,
  audioModeled: false,
  audioFidelityEstablished: false,
  audioAccepted: false,
  currentJavascriptImplemented: false,
  visualFidelityEstablished: false,
  browserQaCompleted: false,
  humanVisualReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseAuthorized: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "none" as const,
});

export const COURSE_G04_L11_FQ_001_PREDECESSOR_SOURCE = deepFreeze({
  kind: "machine-only-display-list-source-static-predecessor" as const,
  animationId: COURSE_G04_L11_FQ_001_PREDECESSOR_ANIMATION_ID,
  assetId:
    "swf-9226553896cda584d9c03f784bc6f104ac4a9a80c3f6128bf14268f9719d7ba7",
  releaseMembership: {
    releaseId: "lesson-g04-l11-coordinate-grid" as const,
    ordinal: 41,
    xmlOccurrence: 41,
    releaseMemberCount: 44,
    releaseRole: "active-xml-referenced-page" as const,
  },
  source: {
    swf: {
      ...COURSE_G04_L11_FQ_001_PREDECESSOR_ARTIFACT_BINDINGS.sourceSwf,
      signature: "CWS" as const,
      version: 6,
      declaredUncompressedBytes: 33_984,
    },
    fla: {
      ...COURSE_G04_L11_FQ_001_PREDECESSOR_ARTIFACT_BINDINGS.sourceFla,
      presenceAndHashOnly: true,
    },
  },
  stage: {
    width: 800,
    height: 600,
    background: "#b8d8f7" as const,
    fps: 12,
  },
  rootTimeline: {
    timelineId: "root" as const,
    frameCount: 10,
    frameIndexing: "one-indexed" as const,
    frameFacts: ROOT_FRAME_FACTS,
    frameOne: {
      preloaderTarget: "_level0.InternalPreloader" as const,
      preloaderMethod: "gotoAndPlay" as const,
      preloaderArgument: "jump_check" as const,
      stopRecordPresent: true,
    },
    frameSix: {
      label: "begin" as const,
      stopRecordPresent: true,
      placements: ROOT_PLACEMENTS,
    },
  },
  nestedTimelines: {
    defineSpriteCount: 7,
    reachable: [
      {timelineId: "sprite-22" as const, frameCount: 1, disposition: "unresolved" as const},
      {timelineId: "sprite-68" as const, frameCount: 52, disposition: "unresolved" as const},
    ],
    excludedFuiReachabilityUnresolved: {
      count: 5,
      timelineIds: ["sprite-1", "sprite-2", "sprite-3", "sprite-4", "sprite-5"],
    },
    sprite68: {
      frameCount: 52,
      stopRecordFrame: 52,
      placeObject2Count: 132,
      frameOnePlaceObject2Count: 94,
      framesTwoThroughTwentyPlaceObject2CountEach: 2,
      runtimeEntryEstablished: false,
      independentDomainEstablished: false,
    },
    sprite22: {
      frameCount: 1,
      localPlacementCount: 8,
      runtimeEntryEstablished: false,
    },
  },
  physicalDefinitionCensus: {
    totalDefinitionCount: 68,
    defineShapeCount: 2,
    defineShape2Count: 2,
    defineShape3Count: 3,
    shapeDefinitionCount: 7,
    defineSpriteCount: 7,
    defineFont2Count: 11,
    defineTextCount: 43,
    buttonDefinitionCount: 0,
    morphDefinitionCount: 0,
    soundDefinitionCount: 0,
    objectIds: {
      DefineShape: ["38", "43"],
      DefineShape2: ["49", "54"],
      DefineShape3: ["23", "41", "44"],
      DefineSprite: ["1", "2", "3", "4", "5", "22", "68"],
      DefineFont2: ["6", "8", "10", "12", "14", "16", "18", "20", "24", "36", "50"],
      DefineText: [
        "7", "9", "11", "13", "15", "17", "19", "21", "25", "26", "27",
        "28", "29", "30", "31", "32", "33", "34", "35", "37", "39", "40",
        "42", "45", "46", "47", "48", "51", "52", "53", "55", "56", "57",
        "58", "59", "60", "61", "62", "63", "64", "65", "66", "67",
      ],
    },
  },
  physicalPlacementCensus: {
    placeObject2Count: 142,
    rootPlaceObject2Count: 2,
    sprite22PlaceObject2Count: 8,
    sprite68PlaceObject2Count: 132,
    otherSpritePlaceObject2Count: 0,
  },
  staticScriptAndControlCensus: {
    exportedScriptRecordCount: 14,
    recordOnlyNonEventScriptCount: 14,
    nestedDoActionCount: 10,
    rootDoActionCount: 2,
    doInitActionCount: 2,
    eventHandlerCount: 0,
    buttonDefinitionCount: 0,
    embeddedDefineSoundCount: 0,
    embeddedSoundStreamCount: 0,
    embeddedStartSoundCount: 0,
    semanticsExecuted: false,
  },
  audioObligations: {
    lessonGroupCandidateCount: 260,
    candidateLanguageCounts: {en: 130, es: 130},
    catalogExactCueAssociationCount: 0,
    exactCueResolved: false,
    cueTimingResolved: false,
    hostSynchronizationResolved: false,
    silenceEstablished: false,
    listeningAccepted: false,
  },
  evidenceChain: {
    artifacts: COURSE_G04_L11_FQ_001_PREDECESSOR_ARTIFACT_BINDINGS,
    coverage: {
      requirementCount: 2,
      status: "blocked" as const,
      capturedFrameCount: 0,
      requiredFrameCountPerRequirement: 10,
    },
    traceSpecifications: [
      {
        requirementId: "req-default-root-en" as const,
        traceId: "default-root-en" as const,
        language: "en" as const,
        entryStateSha256:
          "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
        naturalPlaybackClaimed: false,
      },
      {
        requirementId: "req-default-root-es" as const,
        traceId: "default-root-es" as const,
        language: "es" as const,
        entryStateSha256:
          "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
        naturalPlaybackClaimed: false,
      },
    ],
    subsetIndex: {
      selectionSha256:
        "e98093d1ae27bb0c88a600baf05d005aea63e45f2a8ad21694879468c67d6761",
      selectedMemberCount: 1,
      atomicReleaseMemberCount: 44,
      status: "blocked-by-unresolved-frame-domain-dispositions" as const,
    },
    structuralKeyframes: {
      rowCount: 12,
      frames: [1, 6, 7, 8, 9, 10],
      languages: LANGUAGES,
      pixelsPresent: false,
      reviewerPresent: false,
    },
  },
  authorityBoundary: COURSE_G04_L11_FQ_001_PREDECESSOR_AUTHORITY_BOUNDARY,
  captureIdentity: null,
  implementationEntry: null,
});

export type CourseG04L11Fq001PredecessorInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

export interface CourseG04L11Fq001PredecessorInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

type ExactRequest = Readonly<{
  frameDomain: unknown;
  scenario: unknown;
  lang: unknown;
  seed: unknown;
}>;

const exactRequest = (request: object): ExactRequest | null => {
  try {
    const expected = ["frameDomain", "scenario", "lang", "seed"] as const;
    const keys = Reflect.ownKeys(request);
    if (keys.length !== expected.length
      || keys.some((key) => typeof key !== "string")
      || expected.some((key) => !keys.includes(key))) return null;
    const descriptors = Object.getOwnPropertyDescriptors(request);
    for (const key of expected) {
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

const blocked = (blocker: CourseG04L11Fq001PredecessorInspectionBlocker) =>
  deepFreeze({
    status: "blocked" as const,
    blocker,
    frame: null,
    facts: null,
    captureIdentity: null,
    authorityBoundary: COURSE_G04_L11_FQ_001_PREDECESSOR_AUTHORITY_BOUNDARY,
  });

/** Inspect one structural root-frame record without executing the SWF. */
export const inspectCourseG04L11Fq001PredecessorFrame = (
  frame: unknown,
  request: unknown,
) => {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    return blocked("invalid-request");
  }
  const values = exactRequest(request);
  if (values === null) return blocked("invalid-request");
  if (values.frameDomain !== COURSE_G04_L11_FQ_001_PREDECESSOR_FRAME_DOMAIN) {
    return blocked("unsupported-frame-domain");
  }
  if (!LANGUAGES.includes(values.lang as CourseG04L11Fq001PredecessorLanguage)) {
    return blocked("unsupported-language");
  }
  if (values.scenario !== COURSE_G04_L11_FQ_001_PREDECESSOR_SCENARIO) {
    return blocked("unsupported-scenario");
  }
  if (!Object.is(values.seed, 0)) return blocked("unsupported-seed");
  if (!Number.isSafeInteger(frame) || (frame as number) < 1 || (frame as number) > 10) {
    return blocked("invalid-frame");
  }
  return deepFreeze({
    status: "machine-source-static" as const,
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_FQ_001_PREDECESSOR_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_FQ_001_PREDECESSOR_SCENARIO,
    lang: values.lang as CourseG04L11Fq001PredecessorLanguage,
    seed: 0 as const,
    facts: COURSE_G04_L11_FQ_001_PREDECESSOR_SOURCE.rootTimeline.frameFacts[
      (frame as number) - 1
    ],
    captureIdentity: null,
    authorityBoundary: COURSE_G04_L11_FQ_001_PREDECESSOR_AUTHORITY_BOUNDARY,
  });
};
