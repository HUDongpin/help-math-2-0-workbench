/**
 * This is intentionally a source-domain specification and source-frame
 * inspection query. It is not a renderer, route entry, capture candidate, or
 * a claim that the source domain can be entered at runtime.
 */

export const COURSE_G04_L11_IN_010_ANIMATION_ID = "course-g04-l11-in-010" as const;
export const COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN = "sprite-246" as const;
export const COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO =
  "source-proven-independent-domain-entry-unresolved" as const;

const COURSE_G04_L11_IN_010_SOURCE_FRAME_LANGUAGES = Object.freeze([
  "en",
  "es",
] as const);

export type CourseG04L11In010SourceFrameLanguage =
  (typeof COURSE_G04_L11_IN_010_SOURCE_FRAME_LANGUAGES)[number];

export const COURSE_G04_L11_IN_010_SOURCE = Object.freeze({
  animationId: COURSE_G04_L11_IN_010_ANIMATION_ID,
  assetId:
    "swf-8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  fla: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.fla",
    sha256:
      "b0269e6cb26d7dd89ca5a2705f4e11c0df093e88f0cfc0e2a1640d1521472815",
  }),
  swf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.swf",
    sha256:
      "8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  }),
  stage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  fps: 12,
  root: Object.freeze({
    id: "root" as const,
    frameCount: 10,
  }),
  sprite246: Object.freeze({
    id: COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN,
    sourceObjectId: "246",
    frameCount: 277,
    frameIndexing: "one-indexed" as const,
    parentFrameDomainId: "root" as const,
    directRootPlacement: Object.freeze({
      parentTimelineId: "root" as const,
      childTimelineId: COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN,
      sourceObjectId: "246",
      frame: 6,
      depth: "3",
      instanceName: "animation",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    }),
  }),
  sourceDomainEvidence: Object.freeze({
    path: "migrations/course-g04-l11-in-010/audit/source-proven-independent-frame-domain-evidence.json",
    sha256:
      "fd1c0e93b934ba1c8fc1d6a746827082a5ced78125f84efa9c598915c8002b80",
    claimIndex: 0,
    status: "verified-source-obligation" as const,
  }),
  sourceDomainDeclarationBindings: Object.freeze({
    migrationManifest: Object.freeze({
      path: "migrations/course-g04-l11-in-010/migration.json",
      sha256:
        "6c4be017f85a77849b5820da34c951ab197eda5179995b3f578fabc8546132cf",
    }),
    frameDomainDisposition: Object.freeze({
      path: "migrations/course-g04-l11-in-010/audit/frame-domain-disposition.json",
      sha256:
        "99bd617b13acc0087b622d167a75764fe42c93f0ac803fb489811e16f7bfcba7",
    }),
    scenarioInventory: Object.freeze({
      path: "migrations/course-g04-l11-in-010/audit/scenario-inventory.json",
      sha256:
        "ebf5130d9c9f4a3ba1d8f83151bbf081301fc33c68bd0e14a7f007a67b3488cc",
    }),
  }),
  fullFrameCoverageEvidence: Object.freeze({
    path: "migrations/course-g04-l11-in-010/evidence/full-frame-coverage.json",
    sha256:
      "a4c1c2622dfa3fb536f3a2cc3de74bb93fa4805d17e374ccd3ec2417547aaa4a",
  }),
  directLocalAction: Object.freeze({
    frame: 191,
    script: "DefineSprite_246/frame_191/DoAction.as",
    bodyBytes: 35,
    bodySha256:
      "931f1fcd7e02d6574eb3386939e4833bfc33717bcdaf9f0c3ea5e091a735e2b8",
    directDoActionTagCount: 1,
    ffdecFrameScriptCount: 1,
    frameSequenceSha256:
      "6482ae52f10140265c025d05fb3d563c175206738a67f9c844abeea5917de660",
  }),
});

/**
 * The two language-specific obligations are declared by the current
 * source-domain successor. Both remain blocked and are not language, audio,
 * visual, or runtime results.
 */
export const COURSE_G04_L11_IN_010_CAPTURE_OBLIGATIONS = Object.freeze({
  en: Object.freeze({
    frameDomainId: COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO,
    requirementId:
      "req:sprite-246:source-proven-independent-domain-entry-unresolved:en",
    traceId:
      "trace:sprite-246:source-proven-independent-domain-entry-unresolved:en:seed-0",
    language: "en" as const,
    seed: "0" as const,
    requiredRange: Object.freeze({firstFrame: 1, lastFrame: 277}),
    entryStateSha256:
      "cef5160f1a6d7442ad411bd56763d09eb7797e17544382d6c56122faf6a8a261",
    baselineAuthorityRequirement: "original-runtime-natural-trace" as const,
    baselineAuthority: "unresolved" as const,
    status: "blocked" as const,
    traceSpecStatus: "unresolved" as const,
    traceSpec: Object.freeze({
      path: "migrations/course-g04-l11-in-010/audit/trace-specs/lesson-releases/lesson-g04-l11-coordinate-grid/req-sprite-246-source-proven-independent-domain-entry-unresolved-en.json",
      sha256:
        "5610167fd8d7979d98640a962c0211d2a7e831b8f2124277ceae5250ac998229",
    }),
    strictAcceptanceEffect: "none" as const,
  }),
  es: Object.freeze({
    frameDomainId: COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO,
    requirementId:
      "req:sprite-246:source-proven-independent-domain-entry-unresolved:es",
    traceId:
      "trace:sprite-246:source-proven-independent-domain-entry-unresolved:es:seed-0",
    language: "es" as const,
    seed: "0" as const,
    requiredRange: Object.freeze({firstFrame: 1, lastFrame: 277}),
    entryStateSha256:
      "357cdbf754809c66bbf81ed87d2ade2f2a20a08fe5248a93cb456ae442748506",
    baselineAuthorityRequirement: "original-runtime-natural-trace" as const,
    baselineAuthority: "unresolved" as const,
    status: "blocked" as const,
    traceSpecStatus: "unresolved" as const,
    traceSpec: Object.freeze({
      path: "migrations/course-g04-l11-in-010/audit/trace-specs/lesson-releases/lesson-g04-l11-coordinate-grid/req-sprite-246-source-proven-independent-domain-entry-unresolved-es.json",
      sha256:
        "44ab109686ec1171e8bb3f070455ed581402f08fe5ced953b63b6727dab8f8c2",
    }),
    strictAcceptanceEffect: "none" as const,
  }),
});

/**
 * These flags delimit the source-domain specification. They are deliberately
 * not upgraded by a successful source-frame inspection.
 */
export const COURSE_G04_L11_IN_010_EVIDENCE_CAVEATS = Object.freeze({
  structuralSourceEvidenceOnly: true,
  sourceDomainDeclared: true,
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
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  candidateQaCompleted: false,
  strictComplete: false,
  published: false,
  strictAcceptanceEffect: "none" as const,
});

export type CourseG04L11In010SourceFrameStructuralMarker =
  | "first-local-frame"
  | "source-direct-doaction-frame"
  | "last-local-frame";

export type CourseG04L11In010SourceFrameInspectionBlocker =
  | "invalid-request"
  | "invalid-frame"
  | "unsupported-frame-domain"
  | "unsupported-language"
  | "unsupported-scenario"
  | "unsupported-seed";

/**
 * Input intentionally uses `string` for the externally supplied identifiers.
 * The query validates each value when invoked and never coerces/clamps it.
 */
export interface CourseG04L11In010SourceFrameInspectionRequest {
  readonly frameDomain: string;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

export interface CourseG04L11In010SourceFrameInspection {
  readonly status: "source-static";
  readonly blocker: null;
  readonly frame: number;
  readonly frameDomain: typeof COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN;
  readonly scenario: typeof COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO;
  readonly lang: CourseG04L11In010SourceFrameLanguage;
  readonly seed: 0;
  /** The direct root placement is static; a local-to-root runtime mapping is not. */
  readonly rootFrame: null;
  readonly rootPlacement: typeof COURSE_G04_L11_IN_010_SOURCE.sprite246.directRootPlacement;
  readonly structuralMarkers: readonly CourseG04L11In010SourceFrameStructuralMarker[];
  readonly directLocalAction: Readonly<{
    presentAtRequestedFrame: boolean;
    sourceRecord: typeof COURSE_G04_L11_IN_010_SOURCE.directLocalAction | null;
    semanticsExecuted: false;
  }>;
  readonly captureObligation:
    (typeof COURSE_G04_L11_IN_010_CAPTURE_OBLIGATIONS)[CourseG04L11In010SourceFrameLanguage];
  readonly evidenceCaveats: typeof COURSE_G04_L11_IN_010_EVIDENCE_CAVEATS;
}

export interface CourseG04L11In010BlockedSourceFrameInspection {
  readonly status: "blocked";
  readonly blocker: CourseG04L11In010SourceFrameInspectionBlocker;
  readonly frame: null;
  readonly frameDomain: null;
  readonly scenario: null;
  readonly lang: null;
  readonly seed: null;
  readonly evidenceCaveats: typeof COURSE_G04_L11_IN_010_EVIDENCE_CAVEATS;
}

export type CourseG04L11In010SourceFrameInspectionResult =
  | CourseG04L11In010SourceFrameInspection
  | CourseG04L11In010BlockedSourceFrameInspection;

const isSourceFrameLanguage = (
  value: unknown,
): value is CourseG04L11In010SourceFrameLanguage =>
  COURSE_G04_L11_IN_010_SOURCE_FRAME_LANGUAGES.includes(
    value as CourseG04L11In010SourceFrameLanguage,
  );

const isSourceFrameInspectionRequestRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSourceFrame = (frame: number): boolean =>
  Number.isSafeInteger(frame)
  && frame >= 1
  && frame <= COURSE_G04_L11_IN_010_SOURCE.sprite246.frameCount;

const structuralMarkersForSourceFrame = (
  frame: number,
): readonly CourseG04L11In010SourceFrameStructuralMarker[] => {
  const markers: CourseG04L11In010SourceFrameStructuralMarker[] = [];
  if (frame === 1) markers.push("first-local-frame");
  if (frame === COURSE_G04_L11_IN_010_SOURCE.directLocalAction.frame) {
    markers.push("source-direct-doaction-frame");
  }
  if (frame === COURSE_G04_L11_IN_010_SOURCE.sprite246.frameCount) {
    markers.push("last-local-frame");
  }
  return Object.freeze(markers);
};

const blockedSourceFrameInspection = (
  blocker: CourseG04L11In010SourceFrameInspectionBlocker,
): CourseG04L11In010BlockedSourceFrameInspection => Object.freeze({
  status: "blocked",
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  evidenceCaveats: COURSE_G04_L11_IN_010_EVIDENCE_CAVEATS,
});

/**
 * Inspect exactly one one-indexed local child frame. Invalid values fail
 * closed: this function never normalizes a frame, borrows the root domain, or
 * invents a language/scenario/seed. The public boundary accepts `unknown` so
 * null, undefined, primitives, and arrays return an explicit blocked state
 * rather than throwing. A successful result is static structural information
 * only, never runtime or visual evidence.
 */
export const inspectCourseG04L11In010SourceFrame = (
  frame: number,
  request: unknown,
): CourseG04L11In010SourceFrameInspectionResult => {
  if (!isSourceFrameInspectionRequestRecord(request)) {
    return blockedSourceFrameInspection("invalid-request");
  }
  if (request.frameDomain !== COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN) {
    return blockedSourceFrameInspection("unsupported-frame-domain");
  }
  const language = request.lang;
  if (!isSourceFrameLanguage(language)) {
    return blockedSourceFrameInspection("unsupported-language");
  }
  if (request.scenario !== COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO) {
    return blockedSourceFrameInspection("unsupported-scenario");
  }
  if (request.seed !== 0) return blockedSourceFrameInspection("unsupported-seed");
  if (!isSourceFrame(frame)) return blockedSourceFrameInspection("invalid-frame");

  const isDirectLocalActionFrame =
    frame === COURSE_G04_L11_IN_010_SOURCE.directLocalAction.frame;

  return Object.freeze({
    status: "source-static",
    blocker: null,
    frame,
    frameDomain: COURSE_G04_L11_IN_010_SOURCE_FRAME_DOMAIN,
    scenario: COURSE_G04_L11_IN_010_SOURCE_FRAME_SCENARIO,
    lang: language,
    seed: 0,
    rootFrame: null,
    rootPlacement: COURSE_G04_L11_IN_010_SOURCE.sprite246.directRootPlacement,
    structuralMarkers: structuralMarkersForSourceFrame(frame),
    directLocalAction: Object.freeze({
      presentAtRequestedFrame: isDirectLocalActionFrame,
      sourceRecord: isDirectLocalActionFrame
        ? COURSE_G04_L11_IN_010_SOURCE.directLocalAction
        : null,
      semanticsExecuted: false,
    }),
    captureObligation: COURSE_G04_L11_IN_010_CAPTURE_OBLIGATIONS[language],
    evidenceCaveats: COURSE_G04_L11_IN_010_EVIDENCE_CAVEATS,
  });
};
