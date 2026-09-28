/**
 * Internal FQ003 source-static specification.
 *
 * This module is deliberately a diagnostic record, not a current-JavaScript
 * implementation. It has no renderer, route, registry entry, playhead,
 * action executor, or sound player. Every AVM1 observation below remains
 * record-only until separately authorized evidence establishes execution.
 */

export const COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID =
  "course-g04-l11-fq-003" as const;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(value);
  }
  return value as Readonly<T>;
};

export interface SourceArtifactBinding {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface UnresolvedNestedTimelineCandidate {
  readonly kind: "unresolved-nested-timeline-candidate";
  readonly timelineId: string;
  readonly sourceObjectId: string;
  readonly localFrameCount: number;
  readonly disposition: "unresolved";
  readonly rootPlacementStatus:
    | "proven-named-placement-chain"
    | "structurally-reachable-but-named-root-path-unresolved";
  readonly staticallyPlacedFromRoot: boolean;
  readonly runtimeEntryProven: false;
  readonly runtimeReachabilityProven: false;
  readonly independentDomainProven: false;
}

export interface BlockedSideEffectRecord {
  readonly kind: "blocked-side-effect-record";
  readonly id: string;
  readonly sourceScript: Readonly<{
    path: string;
    bodySha256: string;
    lineStart: number;
    lineEnd: number;
  }>;
  readonly candidateCalls: readonly string[];
  readonly policy: "blocked-record-only";
  readonly semanticsExecuted: false;
  readonly executableCallables: readonly [];
}

export interface StaticAudioObligationSet {
  readonly kind: "alignment-derived-static-audio-obligation-set";
  readonly obligations: readonly StaticAudioObligation[];
  readonly obligationCount: number;
  readonly languages: Readonly<Record<"en" | "es", number>>;
  readonly bindingKind: "final-quiz-question-answer";
  readonly catalogExactCueAssociationCount: 0;
  readonly cueTriggerResolved: false;
  readonly cueFrameResolved: false;
  readonly timingResolved: false;
  readonly durationResolved: false;
  readonly spokenContentResolved: false;
  readonly synchronizationResolved: false;
  readonly listeningAccepted: false;
  readonly acceptanceEstablished: false;
  readonly silenceEstablished: false;
}

export interface StaticAudioObligation {
  readonly kind: "alignment-derived-static-audio-obligation";
  readonly cueId: string;
  readonly language: "en" | "es";
  readonly sourcePath: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly status: "alignment-derived-static-obligation-unresolved";
  readonly catalogExactAssociation: false;
  readonly candidateOnly: true;
  readonly cuePromoted: false;
  readonly timingResolved: false;
  readonly runtimeReachabilityVerified: false;
  readonly originalRuntimeListeningAccepted: false;
}

export interface StaticSourceDiagnostic<T> {
  readonly status: "source-static";
  readonly animationId: typeof COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID;
  readonly facts: T;
}

export interface BlockedStaticDiagnostic {
  readonly status: "blocked";
  readonly blocker: "invalid-animation-id";
  readonly requestedAnimationId: string | null;
  readonly facts: null;
}

export type StaticDiagnostic<T> = StaticSourceDiagnostic<T> | BlockedStaticDiagnostic;

export const COURSE_G04_L11_FQ_003_STATIC_ARTIFACTS = deepFreeze({
  migrationManifest: {
    path: "migrations/course-g04-l11-fq-003/migration.json",
    bytes: 8062,
    sha256: "9b1719c8e3c5c865e3393991afaf74f982a0d20dc5275368f42bec8b7f1cd489",
  },
  machineReport: {
    path: "migrations/course-g04-l11-fq-003/audit/machine/report.json",
    bytes: 105195,
    sha256: "88695b3111fe914de2be5f75d16aaaecccb5a721a1f31d71c80f3ce4ae3d72ae",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-fq-003/audit/machine/ffdec-scripts.txt.gz",
    bytes: 3826,
    sha256: "21ea324d1b2082f8334f2a8bc7868396453dea83f91d814f898afcc1ba76f3cf",
    uncompressedBytes: 40061,
    uncompressedSha256:
      "4335879f1c4b2dd5555bdc1b5f6a9096b70187a2f67fd8ebeece52ff80442c28",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-fq-003/audit/scenario-inventory.json",
    bytes: 2676520,
    sha256: "9b2f8ad339d7be33b6e541a83cbf86d2cdeabeaffaed77f019dd6cdc66721afa",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-fq-003/audit/frame-domain-disposition.json",
    bytes: 553536,
    sha256: "2ac311836b9aa37ada205d22537c4e843fdf886de73f7cbd7f08d3c6ba4dfa9b",
  },
  runtimeDependencyScope: {
    path: "migrations/course-g04-l11-fq-003/audit/runtime-dependency-scope.json",
    bytes: 179753,
    sha256: "c5417b4bdb56a8188588f5eda6a69abb6a6bbd12b2efcee964019672c2211719",
  },
  audioRuntimeEvidence: {
    path: "migrations/course-g04-l11-fq-003/audit/audio-runtime-evidence.json",
    bytes: 942403,
    sha256: "98d7cb32cf3741677ea6cb28a86aa7ff4eefdf5f59b07dc9d92a57676ffd7283",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-fq-003/audio-inventory.csv",
    bytes: 94912,
    sha256: "41498a2e411eb399a4a1e61e242e2b878ca016c854883f006845cac1ab384cd0",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-fq-003/evidence/full-frame-coverage.json",
    bytes: 82209,
    sha256: "b221d751c5be6afddd931cedae0791f127ae9fd4a5a38c974c1e31e49d21a8bc",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-fq-003/audit/strict-readiness.json",
    bytes: 82606,
    sha256: "ddb44fe04f3f26dd89b6c2bdb32d19cea9e823d0e8b67dcfba905afdcfb9e9fc",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    bytes: 145216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
} as const);

const SPRITE_910_LABELS = deepFreeze([
  "FirstSection",
  ...Array.from({length: 26}, (_, index) => "Q" + String(index + 1)),
  "Review",
  ...Array.from({length: 26}, (_, index) => "R" + String(index + 1)),
]);

/**
 * Exact static disposition rows from frame-domain-disposition.json. A true
 * staticallyPlacedFromRoot means a complete named chain was retained, not an
 * executed runtime entry or naturally observed playback path.
 */
export const COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_NESTED_TIMELINE_CANDIDATES =
  deepFreeze(
    `
sprite-16|16|2|proven-named-placement-chain
sprite-52|52|1|proven-named-placement-chain
sprite-56|56|1|proven-named-placement-chain
sprite-60|60|1|proven-named-placement-chain
sprite-63|63|1|proven-named-placement-chain
sprite-87|87|2|proven-named-placement-chain
sprite-88|88|8|proven-named-placement-chain
sprite-94|94|1|proven-named-placement-chain
sprite-96|96|1|proven-named-placement-chain
sprite-98|98|1|proven-named-placement-chain
sprite-100|100|1|proven-named-placement-chain
sprite-106|106|1|proven-named-placement-chain
sprite-108|108|1|proven-named-placement-chain
sprite-109|109|1|proven-named-placement-chain
sprite-111|111|1|proven-named-placement-chain
sprite-117|117|1|proven-named-placement-chain
sprite-119|119|1|proven-named-placement-chain
sprite-122|122|1|proven-named-placement-chain
sprite-125|125|1|proven-named-placement-chain
sprite-141|141|1|proven-named-placement-chain
sprite-143|143|1|proven-named-placement-chain
sprite-145|145|1|proven-named-placement-chain
sprite-146|146|1|proven-named-placement-chain
sprite-152|152|1|proven-named-placement-chain
sprite-154|154|1|proven-named-placement-chain
sprite-156|156|1|proven-named-placement-chain
sprite-159|159|1|proven-named-placement-chain
sprite-168|168|1|proven-named-placement-chain
sprite-171|171|1|proven-named-placement-chain
sprite-174|174|1|proven-named-placement-chain
sprite-177|177|1|proven-named-placement-chain
sprite-185|185|1|proven-named-placement-chain
sprite-188|188|1|proven-named-placement-chain
sprite-191|191|1|proven-named-placement-chain
sprite-193|193|1|proven-named-placement-chain
sprite-201|201|1|proven-named-placement-chain
sprite-204|204|1|proven-named-placement-chain
sprite-207|207|1|proven-named-placement-chain
sprite-210|210|1|proven-named-placement-chain
sprite-219|219|1|proven-named-placement-chain
sprite-222|222|1|proven-named-placement-chain
sprite-225|225|1|proven-named-placement-chain
sprite-227|227|1|proven-named-placement-chain
sprite-235|235|1|proven-named-placement-chain
sprite-238|238|1|proven-named-placement-chain
sprite-240|240|1|proven-named-placement-chain
sprite-243|243|1|proven-named-placement-chain
sprite-251|251|1|proven-named-placement-chain
sprite-254|254|1|proven-named-placement-chain
sprite-257|257|1|proven-named-placement-chain
sprite-260|260|1|proven-named-placement-chain
sprite-268|268|1|proven-named-placement-chain
sprite-271|271|1|proven-named-placement-chain
sprite-274|274|1|proven-named-placement-chain
sprite-276|276|1|proven-named-placement-chain
sprite-283|283|1|proven-named-placement-chain
sprite-286|286|1|proven-named-placement-chain
sprite-288|288|1|proven-named-placement-chain
sprite-289|289|1|proven-named-placement-chain
sprite-296|296|1|proven-named-placement-chain
sprite-299|299|1|proven-named-placement-chain
sprite-301|301|1|proven-named-placement-chain
sprite-303|303|1|proven-named-placement-chain
sprite-309|309|1|proven-named-placement-chain
sprite-311|311|1|proven-named-placement-chain
sprite-313|313|1|proven-named-placement-chain
sprite-315|315|1|proven-named-placement-chain
sprite-321|321|1|proven-named-placement-chain
sprite-323|323|1|proven-named-placement-chain
sprite-325|325|1|proven-named-placement-chain
sprite-326|326|1|proven-named-placement-chain
sprite-331|331|1|proven-named-placement-chain
sprite-332|332|1|proven-named-placement-chain
sprite-333|333|1|proven-named-placement-chain
sprite-335|335|1|proven-named-placement-chain
sprite-344|344|1|proven-named-placement-chain
sprite-347|347|1|proven-named-placement-chain
sprite-350|350|1|proven-named-placement-chain
sprite-352|352|1|proven-named-placement-chain
sprite-362|362|1|proven-named-placement-chain
sprite-365|365|1|proven-named-placement-chain
sprite-368|368|1|proven-named-placement-chain
sprite-370|370|1|proven-named-placement-chain
sprite-378|378|1|proven-named-placement-chain
sprite-381|381|1|proven-named-placement-chain
sprite-384|384|1|proven-named-placement-chain
sprite-386|386|1|proven-named-placement-chain
sprite-396|396|1|proven-named-placement-chain
sprite-399|399|1|proven-named-placement-chain
sprite-401|401|1|proven-named-placement-chain
sprite-404|404|1|proven-named-placement-chain
sprite-412|412|1|proven-named-placement-chain
sprite-414|414|1|proven-named-placement-chain
sprite-417|417|1|proven-named-placement-chain
sprite-419|419|1|proven-named-placement-chain
sprite-427|427|1|proven-named-placement-chain
sprite-430|430|1|proven-named-placement-chain
sprite-432|432|1|proven-named-placement-chain
sprite-435|435|1|proven-named-placement-chain
sprite-443|443|1|proven-named-placement-chain
sprite-446|446|1|proven-named-placement-chain
sprite-448|448|1|proven-named-placement-chain
sprite-450|450|1|proven-named-placement-chain
sprite-458|458|1|proven-named-placement-chain
sprite-461|461|1|proven-named-placement-chain
sprite-464|464|1|proven-named-placement-chain
sprite-466|466|1|proven-named-placement-chain
sprite-471|471|1|structurally-reachable-but-named-root-path-unresolved
sprite-480|480|1|proven-named-placement-chain
sprite-481|481|1|proven-named-placement-chain
sprite-490|490|1|proven-named-placement-chain
sprite-491|491|1|proven-named-placement-chain
sprite-502|502|1|proven-named-placement-chain
sprite-503|503|1|proven-named-placement-chain
sprite-504|504|1|proven-named-placement-chain
sprite-505|505|1|proven-named-placement-chain
sprite-518|518|1|proven-named-placement-chain
sprite-519|519|1|proven-named-placement-chain
sprite-520|520|1|proven-named-placement-chain
sprite-521|521|1|proven-named-placement-chain
sprite-535|535|1|proven-named-placement-chain
sprite-536|536|1|proven-named-placement-chain
sprite-537|537|1|proven-named-placement-chain
sprite-538|538|1|proven-named-placement-chain
sprite-551|551|1|proven-named-placement-chain
sprite-552|552|1|proven-named-placement-chain
sprite-553|553|1|proven-named-placement-chain
sprite-554|554|1|proven-named-placement-chain
sprite-567|567|1|proven-named-placement-chain
sprite-568|568|1|proven-named-placement-chain
sprite-569|569|1|proven-named-placement-chain
sprite-570|570|1|proven-named-placement-chain
sprite-587|587|1|proven-named-placement-chain
sprite-588|588|1|proven-named-placement-chain
sprite-589|589|1|proven-named-placement-chain
sprite-590|590|1|proven-named-placement-chain
sprite-603|603|1|proven-named-placement-chain
sprite-604|604|1|proven-named-placement-chain
sprite-605|605|1|proven-named-placement-chain
sprite-606|606|1|proven-named-placement-chain
sprite-619|619|1|proven-named-placement-chain
sprite-620|620|1|proven-named-placement-chain
sprite-621|621|1|proven-named-placement-chain
sprite-622|622|1|proven-named-placement-chain
sprite-636|636|1|proven-named-placement-chain
sprite-637|637|1|proven-named-placement-chain
sprite-638|638|1|proven-named-placement-chain
sprite-639|639|1|proven-named-placement-chain
sprite-649|649|1|proven-named-placement-chain
sprite-650|650|1|proven-named-placement-chain
sprite-651|651|1|proven-named-placement-chain
sprite-652|652|1|proven-named-placement-chain
sprite-666|666|1|proven-named-placement-chain
sprite-667|667|1|proven-named-placement-chain
sprite-668|668|1|proven-named-placement-chain
sprite-669|669|1|proven-named-placement-chain
sprite-683|683|1|proven-named-placement-chain
sprite-684|684|1|proven-named-placement-chain
sprite-685|685|1|proven-named-placement-chain
sprite-686|686|1|proven-named-placement-chain
sprite-703|703|1|proven-named-placement-chain
sprite-704|704|1|proven-named-placement-chain
sprite-705|705|1|proven-named-placement-chain
sprite-706|706|1|proven-named-placement-chain
sprite-720|720|1|proven-named-placement-chain
sprite-721|721|1|proven-named-placement-chain
sprite-722|722|1|proven-named-placement-chain
sprite-723|723|1|proven-named-placement-chain
sprite-736|736|1|proven-named-placement-chain
sprite-737|737|1|proven-named-placement-chain
sprite-738|738|1|proven-named-placement-chain
sprite-739|739|1|proven-named-placement-chain
sprite-749|749|1|proven-named-placement-chain
sprite-750|750|1|proven-named-placement-chain
sprite-751|751|1|proven-named-placement-chain
sprite-752|752|1|proven-named-placement-chain
sprite-766|766|1|proven-named-placement-chain
sprite-767|767|1|proven-named-placement-chain
sprite-768|768|1|proven-named-placement-chain
sprite-769|769|1|proven-named-placement-chain
sprite-783|783|1|proven-named-placement-chain
sprite-784|784|1|proven-named-placement-chain
sprite-785|785|1|proven-named-placement-chain
sprite-786|786|1|proven-named-placement-chain
sprite-799|799|1|proven-named-placement-chain
sprite-800|800|1|proven-named-placement-chain
sprite-801|801|1|proven-named-placement-chain
sprite-802|802|1|proven-named-placement-chain
sprite-816|816|1|proven-named-placement-chain
sprite-817|817|1|proven-named-placement-chain
sprite-818|818|1|proven-named-placement-chain
sprite-819|819|1|proven-named-placement-chain
sprite-837|837|1|proven-named-placement-chain
sprite-838|838|1|proven-named-placement-chain
sprite-839|839|1|proven-named-placement-chain
sprite-840|840|1|proven-named-placement-chain
sprite-853|853|1|proven-named-placement-chain
sprite-854|854|1|proven-named-placement-chain
sprite-855|855|1|proven-named-placement-chain
sprite-856|856|1|proven-named-placement-chain
sprite-866|866|1|proven-named-placement-chain
sprite-867|867|1|proven-named-placement-chain
sprite-868|868|1|proven-named-placement-chain
sprite-869|869|1|proven-named-placement-chain
sprite-883|883|1|proven-named-placement-chain
sprite-884|884|1|proven-named-placement-chain
sprite-885|885|1|proven-named-placement-chain
sprite-886|886|1|proven-named-placement-chain
sprite-900|900|1|proven-named-placement-chain
sprite-901|901|1|proven-named-placement-chain
sprite-902|902|1|proven-named-placement-chain
sprite-903|903|1|proven-named-placement-chain
sprite-910|910|72|proven-named-placement-chain
    `.trim().split("\n").map(
      (row): UnresolvedNestedTimelineCandidate => {
        const [
          timelineId,
          sourceObjectId,
          localFrameCountText,
          rootPlacementStatus,
        ] = row.split("|");
        if (
          !timelineId ||
          !sourceObjectId ||
          !localFrameCountText ||
          (rootPlacementStatus !== "proven-named-placement-chain" &&
            rootPlacementStatus !==
              "structurally-reachable-but-named-root-path-unresolved")
        ) {
          throw new Error("invalid static unresolved timeline row");
        }
        const localFrameCount = Number(localFrameCountText);
        if (!Number.isSafeInteger(localFrameCount) || localFrameCount < 1) {
          throw new Error("invalid static unresolved timeline frame count");
        }
        return {
          kind: "unresolved-nested-timeline-candidate",
          timelineId,
          sourceObjectId,
          localFrameCount,
          disposition: "unresolved",
          rootPlacementStatus,
          staticallyPlacedFromRoot:
            rootPlacementStatus === "proven-named-placement-chain",
          runtimeEntryProven: false,
          runtimeReachabilityProven: false,
          independentDomainProven: false,
        };
      },
    ),
  );

export const COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_TIMELINES = deepFreeze({
  kind: "unresolved-nested-timeline-candidate-inventory",
  totalTimelineCount: 214,
  root: {
    timelineId: "root",
    frameCount: 10,
    declared: true,
  },
  nestedCandidateCount: 213,
  allNestedCandidateDispositions: "unresolved",
  nestedCandidates:
    COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_NESTED_TIMELINE_CANDIDATES,
  nestedFrameCountHistogram: {
    oneFrame: 209,
    twoFrames: 2,
    eightFrames: 1,
    seventyTwoFrames: 1,
  },
  nestedCoverageRequirementCount: 0,
  highestRiskCandidates: [
    {
      kind: "unresolved-nested-timeline-candidate",
      timelineId: "sprite-910",
      sourceObjectId: "910",
      localFrameCount: 72,
      disposition: "unresolved",
      rootPlacementStatus: "proven-named-placement-chain",
      staticallyPlacedFromRoot: true,
      runtimeEntryProven: false,
      runtimeReachabilityProven: false,
      independentDomainProven: false,
      labels: SPRITE_910_LABELS,
      frameLabelCount: 54,
      staticControlStateCount: 56,
      namedChildPlacementCount: 488,
      risk: "high",
      staticPlacement: {
        parentTimelineId: "root",
        childTimelineId: "sprite-910",
        sourceObjectId: "910",
        rootFrame: 6,
        depth: "3",
        instanceName: "animation",
        tag: "PlaceObject2",
        replace: "0",
        hasClipActions: false,
      },
      interpretation:
        "Static placement and local timeline structure identify a high-risk unresolved candidate only; they do not prove entry, natural reachability, or an independently required domain.",
    } satisfies UnresolvedNestedTimelineCandidate & Readonly<{
      readonly labels: readonly string[];
      readonly frameLabelCount: number;
      readonly staticControlStateCount: number;
      readonly namedChildPlacementCount: number;
      readonly risk: "high";
      readonly staticPlacement: Readonly<Record<string, string | number | boolean>>;
      readonly interpretation: string;
    }>,
  ],
} as const);

export const COURSE_G04_L11_FQ_003_STATIC_ROOT_COVERAGE = deepFreeze({
  declaredRootTimelineOnly: true,
  nestedRequirementCount: 0,
  requirements: [
    {
      id: "req-default-root-en",
      language: "en",
      sourceTimelineId: "root",
      firstFrame: 1,
      lastFrame: 10,
      baselineAuthority: "unresolved",
      status: "blocked",
      capturedFrameCount: 0,
    },
    {
      id: "req-default-root-es",
      language: "es",
      sourceTimelineId: "root",
      firstFrame: 1,
      lastFrame: 10,
      baselineAuthority: "unresolved",
      status: "blocked",
      capturedFrameCount: 0,
    },
  ],
} as const);

export const COURSE_G04_L11_FQ_003_STATIC_ACTION_RECORDS = deepFreeze([
  {
    id: "score-result-and-report-candidate",
    category: "score-and-result-record",
    sourceScript: {
      path: "DefineSprite_16/frame_2/DoAction.as",
      bodySha256: "39f6a3e79201cb77ecf820db2dc2a0f6f343f07b45e48c307924ff4556791984",
      lineStart: 51,
      lineEnd: 82,
    },
    scoreThresholds: [
      {minimum: null, maximum: 3, label: "Unsatisfactory"},
      {minimum: 4, maximum: 6, label: "Partially Proficient"},
      {minimum: 7, maximum: 8, label: "Proficient"},
      {minimum: 9, maximum: null, label: "Advanced"},
    ],
    candidateCalls: [
      "stop()",
      "_root.Send_Quiz_Report_Mc.gotoAndPlay(2)",
    ],
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    id: "quiz-review-arrays-and-routines",
    category: "quiz-review-record",
    sourceScript: {
      path: "DefineSprite_910/frame_1/DoAction.as",
      bodySha256: "01831a3666908aa549172819c226b0af5952d57fdafdea2ebaf5fb8a4d824d7c",
      lineStart: 194,
      lineEnd: 418,
    },
    totalQuestionCount: 26,
    routines: ["doGetRandomQuiz", "doGetReview", "doShowReview"],
    staticRandomCallCount: 0,
    randomBehaviorProven: false,
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    id: "review-label-state-candidate",
    category: "quiz-review-record",
    sourceScript: {
      path: "DefineSprite_910/frame_29/DoAction.as",
      bodySha256: "70b687558cb87688f2abb52576857fdb7a866f83112ac7b59b1364392023268e",
      lineStart: 952,
      lineEnd: 953,
    },
    staticStatement: "_global.quizSection = false",
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    id: "review-stop-candidate",
    category: "quiz-review-record",
    sourceScript: {
      path: "DefineSprite_910/frame_45/DoAction.as",
      bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
      lineStart: 1011,
      lineEnd: 1012,
    },
    candidateCalls: ["stop()"],
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  },
  {
    kind: "blocked-side-effect-record",
    id: "bookmark-close-or-navigation-candidate" as const,
    sourceScript: {
      path: "DefineButton2_12/BUTTONCONDACTION on(release).as",
      bodySha256: "1e5fdc16b14ea1793e584deb7556967e8af5fde1e644329b8531cd72d3986c57",
      lineStart: 1,
      lineEnd: 17,
    },
    candidateCalls: ["_root.setBookMark()", "_root.doCloseApp()", "getURL(strURL,\"\")"],
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  } satisfies BlockedSideEffectRecord,
  {
    kind: "blocked-side-effect-record",
    id: "spanish-host-audio-candidate" as const,
    sourceScript: {
      path: "DefineButton2_73/BUTTONCONDACTION on(release).as",
      bodySha256: "d2edf13e5399c5fe8aab23fb04f3f891a3fc8624f4f6c608a5a81a4f0293d32d",
      lineStart: 24,
      lineEnd: 34,
    },
    candidateCalls: [
      "_root.doPlayFQQuestionAudio(this,\"SP\")",
      "_root.doPlayFQAnswerAudio(this,\"SP\")",
    ],
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  } satisfies BlockedSideEffectRecord,
  {
    kind: "blocked-side-effect-record",
    id: "english-host-audio-candidate" as const,
    sourceScript: {
      path: "DefineButton2_79/BUTTONCONDACTION on(release).as",
      bodySha256: "dc32f14a10fa157854f3a6d561ff39c8b951a4645fb69d0fbe7d8ef54d597417",
      lineStart: 36,
      lineEnd: 46,
    },
    candidateCalls: [
      "_root.doPlayFQQuestionAudio(this,\"EN\")",
      "_root.doPlayFQAnswerAudio(this,\"EN\")",
    ],
    policy: "blocked-record-only",
    semanticsExecuted: false,
    executableCallables: [],
  } satisfies BlockedSideEffectRecord,
] as const);

type CourseG04L11Fq003StaticActionRecord =
  (typeof COURSE_G04_L11_FQ_003_STATIC_ACTION_RECORDS)[number];

type CourseG04L11Fq003StaticBlockedSideEffectRecord = Extract<
  CourseG04L11Fq003StaticActionRecord,
  {readonly kind: "blocked-side-effect-record"}
>;

export const COURSE_G04_L11_FQ_003_STATIC_BLOCKED_SIDE_EFFECT_RECORDS =
  deepFreeze(
    COURSE_G04_L11_FQ_003_STATIC_ACTION_RECORDS.filter(
      (record): record is CourseG04L11Fq003StaticBlockedSideEffectRecord =>
        "kind" in record && record.kind === "blocked-side-effect-record",
    ),
  );

/**
 * Exact hash-bound audio-inventory rows joined to their observed physical
 * mapping bytes. These are unresolved static obligations, never accepted cues
 * or playback instructions.
 */
export const COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATION_ROWS = deepFreeze(
  `
alignment-runtime-dependency-001|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q1.mp3|55905|099ba5dd68dd2e474a2c2d3e57c7b174f225cfa7d78e7c8cb873e22d25102a0c
alignment-runtime-dependency-002|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q10.mp3|46292|943c8416c484f581763fd9dc1479c6a10c1354884f65a714e5182123de194dee
alignment-runtime-dependency-003|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q10A.mp3|40022|95bc4360f2421f563e97ed75bf3d2c2868e9039e5f8347c12a586d0826b70af9
alignment-runtime-dependency-004|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q10B.mp3|41694|d85d1040e2a8b916b57329ca449e069f6f7dd1b8421a94ea33ea4cdf4682e4f1
alignment-runtime-dependency-005|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q10C.mp3|40858|020ed80decbc1df46ac946807c0b85b1602b5c0ff8bcf13796fb0fd14d6bee2d
alignment-runtime-dependency-006|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q10D.mp3|36261|14eba52272f9d0b38cd471a19b96c8b39a21c9fe6230cc48a428d1aaeab94526
alignment-runtime-dependency-007|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q11.mp3|42948|c03659a07e25accec7e77ab17eca26cd3b5b424316f64b19d6377fb5317b2fa3
alignment-runtime-dependency-008|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q11A.mp3|38768|af858e3c2a5e4f94f2b9d41b3278fc27d82e657d1b27ff303be012ee52abe1f2
alignment-runtime-dependency-009|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q11B.mp3|38768|63c39d927850e09d6edfc087cdb970192aaded4f1566fb4b237fe6f06c031523
alignment-runtime-dependency-010|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q11C.mp3|42112|2b3c61e432b64c0b3ebda7e2bd4a2ed26311432177f611b06f01625b3d10f46f
alignment-runtime-dependency-011|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q11D.mp3|35425|59522c46af114d942d4f1fa4b05ba71767722363216cf1553bf2d78b2126a20f
alignment-runtime-dependency-012|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q12.mp3|48381|31efb94a1cc83b3e9b345d133f2a39d5687166d51cd90bd1eaf21b0338077b08
alignment-runtime-dependency-013|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q12A.mp3|38768|095ad39b0874ddfae060e85be4e66db7f2b7c6ebeb6006c1c694f73d67cd40c3
alignment-runtime-dependency-014|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q12B.mp3|38350|c14de6d0aead289fddf9ab3f3fdcbbca32e728ff435089d88208f63359ea7e15
alignment-runtime-dependency-015|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q12C.mp3|39186|fea080d03f49db74f53bfeedfa790a97521416ac23623855d38eae3ea4f47cae
alignment-runtime-dependency-016|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q12D.mp3|34171|76b9143eda7601aa7b1c4276f1bcab2d1298b9e7c6147a73c0d26dcc0f0a248f
alignment-runtime-dependency-017|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q13.mp3|45874|907b5308cd2c48e7b16989957f276751f19e7e7b5fbe513eb0d61cfac9b882d0
alignment-runtime-dependency-018|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q13A.mp3|37932|a22d683aef78300c3fd6b7abeb5596cb47dc8d6da18b91c162cd0055bc224e2b
alignment-runtime-dependency-019|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q13B.mp3|39186|b17a2e2d0492636edd962bb75bba79b4587d77c52f8e38ef1f8a61e72fff482a
alignment-runtime-dependency-020|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q13C.mp3|40440|7219a1b349d97c42116d0e22fd445e64a588be2b56bbf651b9d695ef0113cc36
alignment-runtime-dependency-021|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q13D.mp3|35843|2d3f7ea67e4229c5a7204395adae2a07db07c8715717f848e21db6002ce1a37f
alignment-runtime-dependency-022|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q14.mp3|43784|8a239c19d06633e597d94b083db2df165b84cc17a585e684ef3afefbed1f96b0
alignment-runtime-dependency-023|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q14A.mp3|37932|2244b0fdc130006bfe978e0378cc34798bf4c2dd3e79aab10e5db2cd4660b8da
alignment-runtime-dependency-024|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q14B.mp3|40440|d3e90b394d57aa0252f6e3fd8a322b4c0237c8f9208b38469fb9e1278d6c64e4
alignment-runtime-dependency-025|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q14C.mp3|37514|6583401b707895cf180b00ee639bba5b5ce39977cb9b381a45e5f492261dc6f7
alignment-runtime-dependency-026|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q14D.mp3|36261|4af8db52b6480f05ea06032f3ecefd1603dbcdcc4e25763c07f9173cb3fbb8bf
alignment-runtime-dependency-027|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q15.mp3|41694|2b0d2d2590e767b3db8c5a0fe91317c2fb845106d8b376eefb7cf342739dbb00
alignment-runtime-dependency-028|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q15A.mp3|36261|a41e431c59de4bc61207291dd54e7b0c6e18e882e506d328e0086092033d648a
alignment-runtime-dependency-029|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q15B.mp3|38768|186aceeae6e8f7aa68f3b2ef36e789f0bc5968336cbadaf60bb2ac32cd7d8a02
alignment-runtime-dependency-030|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q15C.mp3|37514|632bd0760ceb289409c5c1c6e6e0cc6b8b44692cd02721c59b10172217f449c7
alignment-runtime-dependency-031|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q15D.mp3|34171|7b44b0784b28ab10e248db041d26111eba4705a73afdc09d0338d6cd8038ac62
alignment-runtime-dependency-032|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q16.mp3|42112|d3faed43a0530e45c7c41996fb40c56b54143d746f188b8fc80ad19b02b8c086
alignment-runtime-dependency-033|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q16A.mp3|37096|66d4870b6bb737614bff2512aebd9a88e63877041796ac015c5f2959cc2f80c6
alignment-runtime-dependency-034|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q16B.mp3|37514|c960df544d65bc696bd72970489aca9f137e8d983a31e5e8c1a62c245921afe0
alignment-runtime-dependency-035|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q16C.mp3|37932|f4ca7f672dc4fd81584d1bb4880591d739cf487deff95b6b29a9066dd28d55ae
alignment-runtime-dependency-036|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q16D.mp3|34589|93230392349bf9a46aa591b69fc9d899285bca0af560d0f096946ab8f2ae7a5b
alignment-runtime-dependency-037|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q17.mp3|42112|0555db53ca1d639dbf50a04b3bfd5ef6e6ab7198e2950519636a79eba2db2cdc
alignment-runtime-dependency-038|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q17A.mp3|39186|88b8372fbc368f7070ce18be6b366ccb4bca466b9766cdd1510be6a95a799465
alignment-runtime-dependency-039|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q17B.mp3|40022|2c89063520fe302f720774bddf78464eb00fb07a6c2a120bed7dc46cefacdc90
alignment-runtime-dependency-040|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q17C.mp3|38768|c9d65ae4d57be59db7a759ffe7488246d923e99d716f1e7c150c9bfbe8b88d49
alignment-runtime-dependency-041|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q17D.mp3|35007|45a701ee4879bd9fd3cd604a4d40534f38d6721ca52bfcd0de600d1aa10d64a6
alignment-runtime-dependency-042|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q18.mp3|46710|53925e10e5e2185505a2477737c48d6b1ec1589d84ecb7f2a39d9f3210446fcb
alignment-runtime-dependency-043|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q18A.mp3|37932|e535f8ffc57ea975b0707c4d0b0cf7fa5ba2ef10df86d223ae8e142047b7eb18
alignment-runtime-dependency-044|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q18B.mp3|38768|eb82a8efb38737af34562fd1c7ccf307e4624a64b3627c63ba7fec9c7c333ad5
alignment-runtime-dependency-045|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q18C.mp3|37932|350f571c269cc8812dd092312ab246de6b855e2ac22b9d4dc9eb806a557de567
alignment-runtime-dependency-046|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q18D.mp3|34589|d44bb32b04244f9926720dd62f1570c7d06e11cf20f291c570b7024a4c60e411
alignment-runtime-dependency-047|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q19.mp3|170008|12c88df7e73b157ab3c01d84c0521048f1d8bc69c3a87e46ec89ca4e66442db4
alignment-runtime-dependency-048|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q19A.mp3|64682|42f34c46722f8475f5c76a34eab23a87095546db4b6660bfa6ce119f50ffea10
alignment-runtime-dependency-049|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q19B.mp3|57159|4a9284b6a11d8af49296188253e19eaf6eddf775b2e15237addbee7dc0ac5321
alignment-runtime-dependency-050|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q19C.mp3|63846|fedac398ee1e8589a06f9ffb2021cf722002d736a060c5a872b5d48c71bf5891
alignment-runtime-dependency-051|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q19D.mp3|53815|8d0cbeb2de82b71d1d4be1964b49a42bf7fc52a0cc48ddedef9de3db15644d53
alignment-runtime-dependency-052|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q1A.mp3|35425|0e77cdc5d510ae42e6df6557877a0c8f7e420de9a1ae1a0ea3b7f8968b7e2ffb
alignment-runtime-dependency-053|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q1B.mp3|32499|ce153822e61a46564b7a2b4b2af834eee2876a9f199b07c55cfa54905899d2fa
alignment-runtime-dependency-054|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q1C.mp3|33753|a63d50faa474013f328dd3211767e3a1d24b4d6d94b1474a58fbb54f0c697db6
alignment-runtime-dependency-055|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q1D.mp3|34589|bc910413adfa2f4c71ebed593f6df8b6533bd0933dde1169cf9b2e2156f2e058
alignment-runtime-dependency-056|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q2.mp3|53397|7fbc73f2121ca1c65b42897dd1dc12aa490159a3133ec55d7421e7b1f51f1269
alignment-runtime-dependency-057|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q20.mp3|158723|08cea33fe600fd8cf70a95f9cca8df4be6546adae049263708b0dcdbb91fb52c
alignment-runtime-dependency-058|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q20A.mp3|44620|f58b08cb43edc46e546129030037511fa4d6f32f4e512fa429b403a35dbceb74
alignment-runtime-dependency-059|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q20B.mp3|51725|a1557d911828ab917dd52976d970500f43cb4fbd1b698b1cb4f10a351c489915
alignment-runtime-dependency-060|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q20C.mp3|56323|8dfd7621da1718fa920dea3b20fe44b1dce794620fe61bcce5fdac8e9d25a306
alignment-runtime-dependency-061|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q20D.mp3|54233|a4192889677fc47fa84128ec1d391550fc71eef32a3bbf70b4240c21bf62d28c
alignment-runtime-dependency-062|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q21.mp3|150781|9016d6287b7b25c808238761674f8c91f96c47ce4d67922b4b848479c1eb89c8
alignment-runtime-dependency-063|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q21A.mp3|50889|7cf6d1c48b18a3233d969f583c051e9e47e5f37439d9ddb41ca47e851c37b294
alignment-runtime-dependency-064|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q21B.mp3|56741|a10a2dfc1ef00ba8d6d7c6c606bf0bde0464710c76922058bd82910a596dae52
alignment-runtime-dependency-065|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q21C.mp3|54651|bca3b01ce582f4e2fcfe96f4c48aa04b339255d7a8a5aaf3c6891e9537a40df6
alignment-runtime-dependency-066|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q21D.mp3|50053|79984eaf590cb2e3aa9b1ecd053abd5bcf06dfb50b99d2db93ade58054a6f9df
alignment-runtime-dependency-067|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q22.mp3|156633|ac791f87ec2712901cbeb5db4d2b7de92408021ddc35da309df5a2bb5e873ad0
alignment-runtime-dependency-068|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q22A.mp3|50471|f42ca94948752a871ac32c9c77ae1a49a01c59f93a4dde583686d477554ca3ac
alignment-runtime-dependency-069|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q22B.mp3|50471|165948e96d074a75c7320bd9553a074bc5558d2706309209533dd6a90e59cca7
alignment-runtime-dependency-070|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q22C.mp3|54651|4145d8f3b651e9ecc6a137996bf9fec5a678e777cf1a862ddc669461b308f317
alignment-runtime-dependency-071|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q22D.mp3|52979|1f9366578729d361d30cd2930b13da4dd64a9198e8a6affcae56aa90fef3125d
alignment-runtime-dependency-072|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q23.mp3|259869|32d17347fd033294f96712060bca03b2aa99acc4e79407436307bcf5be79b4de
alignment-runtime-dependency-073|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q23A.mp3|44620|8e4e87b59a933848c4ec8601a8bc857b666d7b331736f4cff7b8421b623672fc
alignment-runtime-dependency-074|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q23B.mp3|42112|59eb46ff8e959ca19f862a755a23ea7823def1348a306d83f9857d2edd26b097
alignment-runtime-dependency-075|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q23C.mp3|41694|6cbd1602b6868ee7047f5d658a94ca88888415fef37f3c9a88c0b6cde23168f1
alignment-runtime-dependency-076|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q23D.mp3|39186|caa10ac05c54140d4eae074d7e833ee0af8432faacdf42636adabe7a757e235a
alignment-runtime-dependency-077|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q24.mp3|240643|836d26d46e940f9d6d8ccce52db67f92f1ad3a0803567efaf7c08d117fe8e30a
alignment-runtime-dependency-078|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q24A.mp3|40022|f6004d444774d58f9fdb4cf9e7571d9889366c8df1ec28271874f2a94a93edf5
alignment-runtime-dependency-079|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q24B.mp3|38768|345da81a9fb1a70b4e91d7665ceaec7977daa8f433d94e6806802123ed528fed
alignment-runtime-dependency-080|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q24C.mp3|38768|2736ab1a420489de1de2b43d4dbbd4872819d094e2a5b62d78360b4434e6e4b9
alignment-runtime-dependency-081|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q24D.mp3|35425|e229ecc4ee0542bf3aff844e87380f628480dde257611508f61921b375a76a52
alignment-runtime-dependency-082|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q25.mp3|241896|6b93dcb8f1126828bb024cc27fed00382c0eb410249e11e56e731bb5c55b1c27
alignment-runtime-dependency-083|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q25A.mp3|40858|3ed6c1ec334edee17ea41cc00325f74dff033b54c94449c6481503bb2005f416
alignment-runtime-dependency-084|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q25B.mp3|38768|dd16cf864991bfdd4087d28a6655012a4d2f598184ae2fe1b403721edf135c9a
alignment-runtime-dependency-085|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q25C.mp3|37932|2fa964bc3040b1d1b0f417bc3fad5473ccc04c4ca0f1dcd4e25f49e7173370d9
alignment-runtime-dependency-086|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q25D.mp3|37932|5884557a36f4e7e27d0f25786bd1c767930b830d178fe5b2284809251b8e6b7b
alignment-runtime-dependency-087|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q26.mp3|248396|6d18a8b6f92ed547c9938612b350e7f9aff02603440c6b92a8525034c8b1924a
alignment-runtime-dependency-088|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q26A.mp3|36073|1b2be3c8cdaac47fe01e5c1409dece99483a1d610966c603b5feac07b5e9faeb
alignment-runtime-dependency-089|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q26B.mp3|35655|2252dc8b9c92ff029e3a0bd3d23cf094f36ed7403e35d2a160fede0c55f4ad7a
alignment-runtime-dependency-090|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q26C.mp3|34065|f22fb30051533f63046e0bf6f6a6aa437a317273c5f290420f4d3bcb7f93ed80
alignment-runtime-dependency-091|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q26D.mp3|34401|abce8fbc725687963e5bbf2ff49f1367accd8673ee104c4b41284adf3b10bf46
alignment-runtime-dependency-092|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q2A.mp3|35425|b9443f67d072067d495d7e52c0b38e4badd9a2344fb30f2fe38a7ee7c4ebe0db
alignment-runtime-dependency-093|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q2B.mp3|35425|3dabab52da98b50203741aef3877d7a6c98a6655b7caf0f31b8b18e08ececf11
alignment-runtime-dependency-094|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q2C.mp3|36679|8180db6ba3701ddd09f1af56d9fcb4ebbe7a908b0388f6555a9f55bbe76ced67
alignment-runtime-dependency-095|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q2D.mp3|33335|4f8905f45d507ff082842f11bf1a8ad816f4b0f7c8fd73f765bcbb2b45c5dc0b
alignment-runtime-dependency-096|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q3.mp3|52561|55cc7969d411d3ba6dba3d26882dd65c9bc330aa0ea8d9cb394d0ec64e09c801
alignment-runtime-dependency-097|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q3A.mp3|35425|ca8b44da5c85b7a20ffaef5a019e5b716fae16c819e7987b99896c93272871db
alignment-runtime-dependency-098|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q3B.mp3|33335|446e1cfeca1a26e0651b6d652b5564da7952414f72b75b643df9477c17bb39a1
alignment-runtime-dependency-099|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q3C.mp3|35843|f3837f5ffc659effef92aca4de685fcfc55f55c40aa9f5b168d7c2f0f6e8f35e
alignment-runtime-dependency-100|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q3D.mp3|34171|f4560960e5c755c4c0bec3f1a28fc953e3c20ccc02fbae002879c17604ef5454
alignment-runtime-dependency-101|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q4.mp3|52561|915a9cef955b55310c2a3d571b5fc7f3d87052327d129fb6c7658b43ba6b708b
alignment-runtime-dependency-102|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q4A.mp3|35007|35d556de63bb98e0671cae279afa1f05eeb512ebeb0901708604019340694dfd
alignment-runtime-dependency-103|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q4B.mp3|35425|390b9ccc1ab493f806a07da6b810a8b96b6effd81d8284a49c4fcce376d3a7f9
alignment-runtime-dependency-104|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q4C.mp3|35843|773ed40b69d55f56eaf8c5e9f5d4caf287f7b232d68c679e8203314a366d1813
alignment-runtime-dependency-105|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q4D.mp3|33335|63ba47dd8d3e8f73156174dc50002cc7a112577b6b6d066ad7f9bf39bff02596
alignment-runtime-dependency-106|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q5.mp3|52143|0c4ba075372c2b963d303dbbe50c1e6d9f1ee791431a579bb85bd50ee5f0ba62
alignment-runtime-dependency-107|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q5A.mp3|33753|d9101582d41c6ff2ba5992d5b70faa132a822e225cedcdea9d9fea191e3d63d9
alignment-runtime-dependency-108|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q5B.mp3|35425|590f7b0c1421afb224fc1794eaf0f63469287fbcbbc2c8e075d3b66b10ffc886
alignment-runtime-dependency-109|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q5C.mp3|35843|4d509f8ef4ecf769d178772c5364135bafbec7b509c8875cff80ae7646059324
alignment-runtime-dependency-110|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q5D.mp3|32917|6bb0447dc7d0689ffead1a8b443e168c102eeef3e8156166735f83be35701252
alignment-runtime-dependency-111|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q6.mp3|57159|6edca0da1faade42c7aa4cbcaea8c5d0a6e4eef224448cb6afea5c1974e5961c
alignment-runtime-dependency-112|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q6A.mp3|37932|b2fae7444a39bf1e39c10bbbf4235fe1a7719e2aea5d0a54ee4d35887b77e821
alignment-runtime-dependency-113|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q6B.mp3|37096|f7f634a98ca7b51ab483354b3f5c8f8df888a45d57bc199ac0612e5db801d1c4
alignment-runtime-dependency-114|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q6C.mp3|39604|980fad47887df97ef40c40da241a35d83c1f9b3b58a92ed31181684d0f8bcc73
alignment-runtime-dependency-115|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q6D.mp3|37514|cc57dc035da59dbfee72b4427c4aa1fc85b67b4c847843b27f6ddcb181871c25
alignment-runtime-dependency-116|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q7.mp3|45456|5d44111626c03dfb16c5bfa910063e83c360c1111b4e775032054c3d5ef98b0a
alignment-runtime-dependency-117|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q7A.mp3|40440|168e7afc285e7c2ee03a81fc10a6a60e9b78f46eec06537991a55cb427ea9036
alignment-runtime-dependency-118|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q7B.mp3|40022|126a7831908b5d12877e7b481f7b849d8d2ed665181e3f37a0b086e06cba2e95
alignment-runtime-dependency-119|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q7C.mp3|43366|22bae856c58826ec118de3055f5c73549cbe747ef12665326737f9e6c35de590
alignment-runtime-dependency-120|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q7D.mp3|37514|36ff495c0c6989b955e48349f2f1ab416de3cc32dbdf01ec78218929daf48fda
alignment-runtime-dependency-121|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q8.mp3|45456|842d2b93715d89171925f842e7e99ec765c988e60b5acc0b4ad6ca9def4845bf
alignment-runtime-dependency-122|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q8A.mp3|42530|c950d09e2903682c00e76af2058030bbdbc97cac43e3de31bae9d2bd695f5001
alignment-runtime-dependency-123|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q8B.mp3|42530|cb339e1a6b5c7fe58d61834c357bf823d77245174c9a2308bc351d6a9a0169fe
alignment-runtime-dependency-124|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q8C.mp3|42530|2701bdcab93e5672e6279946c8d52346dd1c5a647d2cefc8eca1e1455d3f4fb9
alignment-runtime-dependency-125|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q8D.mp3|35843|5e74c85fce214aea9dc2e552a126bdcf0eb7e151640e8a7f4ae67575b0ec2fd2
alignment-runtime-dependency-126|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q9.mp3|42948|42cc872f247509ea3dc886c63a93b2ccb1dcca0c817b1b46dddc21166712505a
alignment-runtime-dependency-127|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q9A.mp3|38768|94833cc54dc60f17ca84bafc0e72590ab866ad1bfba52da86618665a80ea66d5
alignment-runtime-dependency-128|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q9B.mp3|40022|638aab2374a6fd02a342ba4aec9187afa893beb1e1356233d5f4a504f58bd329
alignment-runtime-dependency-129|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q9C.mp3|44620|c59afd20f792b8cac2203c703464f0bccce31374eea474f25ca05eef85c8b93b
alignment-runtime-dependency-130|en|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/EA/Q9D.mp3|37096|18e59560a301f50b0bcc58446ef8858d2c97af7d1b2ffd818e160d1d733204f4
alignment-runtime-dependency-131|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q1.mp3|93203|1c82c297112db5e9e54a2d95afbe0c0a8e466f0daf8745a06d80dafa3ccc2fb4
alignment-runtime-dependency-132|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q10.mp3|61021|7637925b2e40e1ecea204fd4c820c8ecad66002187543f3901abbdacb2e29226
alignment-runtime-dependency-133|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q10A.mp3|46392|d29bff700425e6275e380c1351d57fac1a9c86a54e77058702706c76c51e7844
alignment-runtime-dependency-134|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q10B.mp3|42630|e564999e6f84402ed32763d500b2dc3f96bf8f47053a4ec6fc225047a43f8de3
alignment-runtime-dependency-135|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q10C.mp3|39705|1de1738ee32cbf21104154b0168cf67b5861762287271bfdb9a5581933d2a52e
alignment-runtime-dependency-136|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q10D.mp3|37615|23cd27559f1a94b8b5360cce55cb49026d96f1e5fa63705d4985938cd52bb431
alignment-runtime-dependency-137|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q11.mp3|61439|4521e45332f5f70d7a632bb07bbfa0cefbe3496b8a0898779e2790127586fdac
alignment-runtime-dependency-138|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q11A.mp3|40123|ecfb48a01b8fddd4afc6470e786166c2f85c64c56d25d430094d37be3728da50
alignment-runtime-dependency-139|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q11B.mp3|39705|adc890db298fb3e405b4244b8a93f602d5dabaa07a10dfd5d086a13fb643ea39
alignment-runtime-dependency-140|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q11C.mp3|38451|05eb24f44ace9b8327e26814d53d9b9474257a8bef9564b0b9a998758f56184d
alignment-runtime-dependency-141|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q11D.mp3|42630|d01775f67d1275fa642f78cf075c1f306c4f25831da78b5c6abf4a5cdeb38bdd
alignment-runtime-dependency-142|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q12.mp3|70216|97808d28a86c7c01a0223d290f4b93878a6d8e706e1cc6a101fe0bafc5ce1dae
alignment-runtime-dependency-143|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q12A.mp3|41794|f4a6d6408d7aeb38dcc00637ca4da4506564e1f7494e034233f21c94ba453d2d
alignment-runtime-dependency-144|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q12B.mp3|44720|5d86d8ca1241bf48f633e117d49e389c8dea23742dad0f7f8921da5857f89f2a
alignment-runtime-dependency-145|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q12C.mp3|44720|2865c4ee9223b2f4493e3f6e3e0e7310d6ac2da0ea47eaf0a0acbe1819b3fb9b
alignment-runtime-dependency-146|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q12D.mp3|42630|79b729f680c5437e89d6e2071d00186f0fffb6ecb8b80960b7115757e4ce95e8
alignment-runtime-dependency-147|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q13.mp3|68126|ba04608c4f43acc092d6ccf71027fc4de5e80fec2f367c420d5daf9bd841eb2e
alignment-runtime-dependency-148|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q13A.mp3|48064|1a26c45d4ce43a6b2beb26220a36af1645c876ff5bf16ef1b8f514f437e7a8ad
alignment-runtime-dependency-149|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q13B.mp3|45138|e5d1352c03a827fb2c1bf01866b6327a59131b80831cb59dd7795b4b4374099a
alignment-runtime-dependency-150|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q13C.mp3|47646|922a7422d0709c8331eb6a5489bc288ecdfc3bd30c4a5c827ad4c697061b5161
alignment-runtime-dependency-151|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q13D.mp3|45138|d2760e6fb1e3c62e648947d4bf8ef23286d3c5bd858b88fc0b7ae3814f32f896
alignment-runtime-dependency-152|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q14.mp3|71052|7b86ef475d8601d6cc06b13c47e13f212d48e8e70fce451893e94663400037bb
alignment-runtime-dependency-153|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q14A.mp3|47228|6a93c32d1579e41ca13d0ca5bd0d87553caea193c970621a5853304b13b33ccd
alignment-runtime-dependency-154|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q14B.mp3|39287|4cfe6683ff58d35e4db2fa7ff7e2103e13c1452a160803f50c45e735d6a1af89
alignment-runtime-dependency-155|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q14C.mp3|46810|366404f42db342d5b91f74a4597f2613c2b787b491c9f8f193531cf4cc08e164
alignment-runtime-dependency-156|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q14D.mp3|39705|10da44004537d26632495186cc406a51629df2fac4a92e05adaa992abb171113
alignment-runtime-dependency-157|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q15.mp3|71888|be7ae2afe8e243d93360c8a944cf891c8371a2992a20d27323df1b9ac9e2bcca
alignment-runtime-dependency-158|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q15A.mp3|48482|583e9780184e50368504ffff454ec50538aa8b5cb80dce22a291c5d6f407b4d2
alignment-runtime-dependency-159|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q15B.mp3|42630|c818b5d68afe78b0b46f6dc8e5240bafdc9848c9744aace4473cbf40fa69a770
alignment-runtime-dependency-160|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q15C.mp3|51408|9c71dd9d79ff66d38bc3ba6c14b6dd88299cab28264c400303e29e53aa6c0722
alignment-runtime-dependency-161|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q15D.mp3|48482|22eb37ae6857fbceea534a2437df0c59d58ac20fe0aa7e97dfd658070fbdc0b8
alignment-runtime-dependency-162|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q16.mp3|80247|11e5a7ae48ddd66706c2aa3356635c7a20265ffe4823a6202ad97fd0113d7eaa
alignment-runtime-dependency-163|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q16A.mp3|47228|dab656924f702bbc8c1079c8f0a2c68fe0da5d689efdb8db44650fe081ba3564
alignment-runtime-dependency-164|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q16B.mp3|42212|090e90b58a80fec40965a8a238f7bfe7f9707f27d092113edd8a42ff4282767b
alignment-runtime-dependency-165|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q16C.mp3|44720|7edd72a64a568ab449d2ade2c8e45e07058fcbfa846a4d21f1034acfc0654ff3
alignment-runtime-dependency-166|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q16D.mp3|41276|d614b608500c008f430c2a3f1c9edbd803dafedb19a8a9ae11cc89c59df9a9a9
alignment-runtime-dependency-167|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q17.mp3|62274|5b94ff355650006555e52e101b1a2d8a5d9442b2bec03090956b8d56dab910d2
alignment-runtime-dependency-168|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q17A.mp3|42212|d1a16a50425108fab750b86819a55bd002c7bf3b7ec328fa76b4870b8a88f32b
alignment-runtime-dependency-169|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q17B.mp3|43466|4d4a9a7f88a8e9793011a2d71e8ae3fe418bcf5f7ebc398a4a07b2284f485d46
alignment-runtime-dependency-170|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q17C.mp3|41794|0d88e0208cd7a9cf5cda4f50c016588f8cad7c22de19e81c32408c139eac93ba
alignment-runtime-dependency-171|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q17D.mp3|43884|4b3c2a1d7db049714a7725162c924bb3155785380374af25c5be9150d70d42a0
alignment-runtime-dependency-172|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q18.mp3|56005|a4b3b07087f78ecbf58185081f39d6b116c538e3b089742643f7826a1af7bbe5
alignment-runtime-dependency-173|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q18A.mp3|51408|7281bf97d91b6f8d27d58b11cb8fa1bc576850f808a33a2e35ce4585a22907f7
alignment-runtime-dependency-174|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q18B.mp3|40541|226acb454dacccc0c66e039f8fe90eda78c55793cb03450a99d9521b8f6cf1f6
alignment-runtime-dependency-175|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q18C.mp3|34271|761a88e47e70763e5e2bd4628ae3f287829e45a7b496a777ebd59b971891f7f9
alignment-runtime-dependency-176|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q18D.mp3|45138|9bea66466300f9a3805e86acf8ab0a08cd9f2063d1d67c1a71acb1e0a76fc030
alignment-runtime-dependency-177|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q19.mp3|324335|9a2a99beb5cb4fd9220db79801a642bf15a03afacb4e913e9392674f2887dd6d
alignment-runtime-dependency-178|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q19A.mp3|62274|f436ec9f0002027e53066fc660e34673cde3681dc2bf2cccaa8f5c6ab53b50b5
alignment-runtime-dependency-179|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q19B.mp3|62692|cffa802533e2bab9a28590e1eaaf6b5a400f647c458416bdda5d1cb4166acf29
alignment-runtime-dependency-180|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q19C.mp3|66454|4d5e2a40b42587aa19b1c95c084cd94412fd32bfb186bcaf24b4c3553905b701
alignment-runtime-dependency-181|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q19D.mp3|68962|2688dd97563ec640afa160232125cc1d9d0863b11a1c4801281448decfaae2ef
alignment-runtime-dependency-182|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q1A.mp3|32599|e78f23c5d31f81882a51bdeda416dcd73505acc246221ad45856ec4be3796f01
alignment-runtime-dependency-183|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q1B.mp3|36361|0bd598d7442114534a9ee5685b2e46b29576129fc6d8eb18f5fb43f0d26f6b9c
alignment-runtime-dependency-184|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q1C.mp3|38033|d916bc3b9bd340cebd0d9fecdad37fe60ed4e9d5511e9d563db110607f1dd7c3
alignment-runtime-dependency-185|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q1D.mp3|34689|fe38c869b23a76684f6f65c21fc9051c74f2054e73e97d34ed82527965a25d6d
alignment-runtime-dependency-186|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q2.mp3|86934|9c29c3384eab69e8909d55c6a23c04b094f5af5d22973e47f00efccd540bb79f
alignment-runtime-dependency-187|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q20.mp3|305527|1ccce3b42726cf589363609abc7a0654e75c03993ca1ebbf193e56ce5e12778e
alignment-runtime-dependency-188|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q20A.mp3|63528|d40368a8d932a8331a871fe09bcb12125c43f3fca79e369e42ec13e471e8e98c
alignment-runtime-dependency-189|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q20B.mp3|67290|cca376d92b918ecc7008dd8c433c78bc62d7dac9ae9074a1a2668ebfbd29575d
alignment-runtime-dependency-190|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q20C.mp3|75231|5497ac01b6baa90bf59e26e509051f29587a428383ae7de2bbcdacd8272a20c2
alignment-runtime-dependency-191|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q20D.mp3|72306|30cb14ac5f021a43595809a9adc20a3d5773f7ebfabef347e1e51b193b57bff0
alignment-runtime-dependency-192|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q21.mp3|317230|6ed667adc8bc1077f547e94b9b59ab1285e894ee7b346dfff48ef72fc709888a
alignment-runtime-dependency-193|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q21A.mp3|56423|9eb98ba844c84496dc1c8b701111e2376819054f620b9d9d175b710aaf71f603
alignment-runtime-dependency-194|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q21B.mp3|66036|624072d53a7cd592d631efc0f9d26f44811bf4549e4888302278ff15babfdea6
alignment-runtime-dependency-195|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q21C.mp3|71470|038e4f8bfc6a61b15f77a2ce160ec3a5ab7ea8494ab01e850757293104eaf700
alignment-runtime-dependency-196|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q21D.mp3|71470|63eff5488dd6a2c9f94067a140ca71e8ae72e1a146035a567f67858e0b6a458f
alignment-runtime-dependency-197|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q22.mp3|309706|4e2ef1d8c9c518096344f93229dedb49170757e5dacf20db4b8091d1c5c626ca
alignment-runtime-dependency-198|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q22A.mp3|71052|3d9e938b3d0d006ee88c3a03a8cb7d3b7ef2ab2e7708d8c0dca09d2553ea44f8
alignment-runtime-dependency-199|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q22B.mp3|71052|ab405c308fd76bf3e99706cc343149712a53ecb455c16dbce6e6d5efceb288ef
alignment-runtime-dependency-200|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q22C.mp3|75649|2a77e31c1fc5905867ee37abf44ebb6741a6ae18de3a2ed6eb92e70b3c1216ec
alignment-runtime-dependency-201|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q22D.mp3|81919|b8d7ea10634283af88fadc643091699855c69991e50e67981ef0ff9cca7a0cd4
alignment-runtime-dependency-202|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q23.mp3|351084|6543ba04825a6b45580cc5899bdf29133bec4832b5f1408bd3355bd8ed07aea0
alignment-runtime-dependency-203|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q23A.mp3|43466|a6351c85a1584dab716db4973e3fbae8e6a478887f7c85d542c182e146529b32
alignment-runtime-dependency-204|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q23B.mp3|39287|742d5fdfbbdca8331f0bdaf83e11f9b3e0544d901a26abb8792f1c95e5ea7c59
alignment-runtime-dependency-205|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q23C.mp3|46810|3e5caebe0b5c019a02b7bc54fcd0aa157366bafcecc8e26bbdf7d4b38519252a
alignment-runtime-dependency-206|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q23D.mp3|45974|0d392120bf11d49616fe6230be38c62ce26b34f9d43a1e9f8636a78e85fbd8af
alignment-runtime-dependency-207|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q24.mp3|345233|4352dc8dd1a249b5e18e9c7768fc2f1abe05d90526088b85eeffe9b844609468
alignment-runtime-dependency-208|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q24A.mp3|38869|e0313e0207ce46cc097d7058c5827e94c7896b0db84416a75c0244f80ba0c8cd
alignment-runtime-dependency-209|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q24B.mp3|46810|1f1e842145fa00e62636b8a061e2964207ad72cc3cca7ca42a9695d3f70b2d9e
alignment-runtime-dependency-210|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q24C.mp3|45556|63d20ec659ebff5a47cd6a4409c8e281d31c7adadb2c5573f8a58c6e90a354d3
alignment-runtime-dependency-211|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q24D.mp3|46810|e66e05388e4e656f0f70381c664660bc69486b31a8de36c5a74236179f08e126
alignment-runtime-dependency-212|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q25.mp3|351084|8a0d4d7fcceb9f9a381636527aacadf83f0084f67a4dddf30bdf8aa47b221eff
alignment-runtime-dependency-213|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q25A.mp3|33853|cd1faae49cc33bdaf6a2f8fd139b5f009c283f12a2028a48f8f25a46f3e99614
alignment-runtime-dependency-214|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q25B.mp3|42630|ef9554fbc3ef810dd58587e577be3ac4cc66c4b08ef131e68041438e68268669
alignment-runtime-dependency-215|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q25C.mp3|51408|cc595e455692e92327f3823a153bb6ac819c1e3a645345e3fb86fa8b5b55e842
alignment-runtime-dependency-216|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q25D.mp3|46392|66998c7b2206944db92e950bdf85ffb49569e47f7417024f29a0e5359abc10a2
alignment-runtime-dependency-217|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q26.mp3|331858|d37a9ebecb463095bd378e101789d1bb396e3d51631be727b4e0fc5e99e78ce0
alignment-runtime-dependency-218|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q26A.mp3|36779|92a6795ee5e86404a51cc053d9b2d88154a1a8336784adb6f6487b49b4ccf1f8
alignment-runtime-dependency-219|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q26B.mp3|46392|c9bd38671c5a35ab488401214dea4278c70a109b1a8b764f44be52856401acbc
alignment-runtime-dependency-220|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q26C.mp3|46810|9a27914f9c322b53f1ebff6c2bd10e460d0692c871fec8c7976a3027dad0df0c
alignment-runtime-dependency-221|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q26D.mp3|45556|8bd986933c2f27e615fa27fcf4f18830d9c0ff28dbf12deb042e8d0252a635af
alignment-runtime-dependency-222|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q2A.mp3|37197|2aa72858750725cce5825afbee56fc704154d7011174cc0afd52499033d30dd9
alignment-runtime-dependency-223|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q2B.mp3|35525|3d8b7017417e69901f2433df18e01c0b2b439b35bfd80efaa7dac99d0ff15721
alignment-runtime-dependency-224|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q2C.mp3|37615|2c491e39fbc705d0d46c9ba8ab2171c40dbb7ca5e6c8b11e00017f8f1680ce8c
alignment-runtime-dependency-225|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q2D.mp3|36779|e5e14e4df3392a9e74da64ea76d1ba2621d691084709f42866f5cc4f235b911a
alignment-runtime-dependency-226|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q3.mp3|90696|fa899d7b1416b127e22d6e4622afc449f1b5694664ad3c825e17dc87122277c2
alignment-runtime-dependency-227|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q3A.mp3|34689|ff545bd7cb3bd30d97dd301e04caf5f3ab5780019aef5a8a27fade33819141b6
alignment-runtime-dependency-228|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q3B.mp3|35525|93211e2bfe6927a1607ecee17d3d3bda82e915cfa02d6aed7d7354823197fb9a
alignment-runtime-dependency-229|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q3C.mp3|38451|37c12ffbc63dac2da790ae9de1b7af5a5ae046bacd05090cb9d44316c6e0f9e2
alignment-runtime-dependency-230|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q3D.mp3|35943|6a756739ca3435a484ad5526644f5c02c0e8f0cbc1a04e148d2aa990b01e2b4c
alignment-runtime-dependency-231|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q4.mp3|90278|c7047c5147632a393c1c1262812d62a6f0afaacedeb581a51bd39cd4a07fadb5
alignment-runtime-dependency-232|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q4A.mp3|35107|1c0189c388f1f14dccb15aa5c35eb04fba2c0aefa60d8b03ed7fecbed191ea5c
alignment-runtime-dependency-233|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q4B.mp3|39705|ce9e63b74c93f0c7de250fe03c312b64a8fdb4ae712c2e971edb80662fcc9234
alignment-runtime-dependency-234|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q4C.mp3|38451|ddfce096e7335c7cf7371d2fa8e8a0412e183ed070dc9ab8dd245189651e380c
alignment-runtime-dependency-235|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q4D.mp3|36779|6475cdbd1127349bcb8305de41981c9f922461779e9d27eaa47dba30ed68295c
alignment-runtime-dependency-236|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q5.mp3|99891|79b7a670ab217c81d2dc4ecb642b2ce7c80df5e454e3952231c20e42d65157e8
alignment-runtime-dependency-237|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q5A.mp3|34689|625fc8feda375fb01e8835d552be6afa0c0fdbf4b89b1c4f0b26ad45ed18a2da
alignment-runtime-dependency-238|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q5B.mp3|38033|d0a52ac94513fa3b73617108a70a95b573be6104ca117b8f38ad755fe3c0f68a
alignment-runtime-dependency-239|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q5C.mp3|36361|ead931035df6c1c71910d2ae9d476fa36e4d72585ecc852059ddd857a3cf017d
alignment-runtime-dependency-240|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q5D.mp3|32599|33a87988c221d2e58c4a64ca28f0084f71929e1b90c18c4b2ed9a66d58cdd8d4
alignment-runtime-dependency-241|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q6.mp3|91532|a7062a3e3c97115a7cc0b46f0b98d547b58c769e979243782de156c91fc2c00f
alignment-runtime-dependency-242|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q6A.mp3|36361|f8a3151c87d155087da9f56a394c190dbd8c3b09d12ae913ebaf008a905028bc
alignment-runtime-dependency-243|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q6B.mp3|39287|e71d1cbb05d3def88c519e6dfd283456535f17ac80efa57c47594216b6a375f5
alignment-runtime-dependency-244|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q6C.mp3|39705|d24d7428ab7b5350c147b7a9442a54e3c51aeec9ab9c658931c3604a541b33b5
alignment-runtime-dependency-245|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q6D.mp3|37615|7e7aac8ff847ed8764a8b995a841b63b9ba343c190c16265f9d907d7b15af63f
alignment-runtime-dependency-246|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q7.mp3|71888|acb7ad9a4333891d8731a5c72c61ddb8a3423e6a79220de11a97f158b1691e62
alignment-runtime-dependency-247|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q7A.mp3|42630|116811354ab1697240e133510a4a4f35d8e7f451e4bb071e7b980e93b402614f
alignment-runtime-dependency-248|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q7B.mp3|43048|3bc7c46d6d3f27f2efd90489f875c06d30337b700c96a4c622d5484e5f73b7cc
alignment-runtime-dependency-249|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q7C.mp3|44720|ab73e3926010b54c03893b015cf7c5bd9cf625237a17ef24c3f756792cc5ba04
alignment-runtime-dependency-250|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q7D.mp3|47228|de59c14c1fcef7cf9bbf28ea0648c29d1b4d16444708e7ff7e1c6ceb10836461
alignment-runtime-dependency-251|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q8.mp3|68544|0f5d87155c9d24d396549c84d5601f5cdc088f2d8d79a2e6881e1a5fd5003a8c
alignment-runtime-dependency-252|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q8A.mp3|40123|9fbae3f0578d6582a3dc9d0cfe58d4e498645cee20e62103c4a0ff7b73a254f9
alignment-runtime-dependency-253|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q8B.mp3|42630|396fbd6e491b675ae909d23622813cc83df367ce723c70afc9ac9c248842f88e
alignment-runtime-dependency-254|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q8C.mp3|44720|331fadc46514b78dd8e1149b8247a0f3535016dd8632984efba8946e37d69101
alignment-runtime-dependency-255|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q8D.mp3|38869|8222309e31863802bbf45f505f349da2c93718137b0fae0611501e98b8ac4a19
alignment-runtime-dependency-256|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q9.mp3|60603|4bed3eab9008478334073f02b25b8d74de8ed5307e3b18293bd7bc3087fa06cd
alignment-runtime-dependency-257|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q9A.mp3|33435|97e494667afbaa32ba71423f1f6f27bc5766e31fdb91a9ecdb62ff54fa6b2a66
alignment-runtime-dependency-258|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q9B.mp3|38451|29f3fde08873cd1d8695a946958af7d1ff04e1ca07e81f385bae343d12d46eca
alignment-runtime-dependency-259|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q9C.mp3|36361|aaf7120c36110d763a0bbc0c2c1e8b4d8897baad1d0e99a3ffdbc4f88f8c3bb6
alignment-runtime-dependency-260|es|source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/SA/Q9D.mp3|41377|d1b615cf80bd894de8c67361cccc66139d4d6c721507456470e75267cb94d68c
  `.trim().split("\n").map((row): StaticAudioObligation => {
    const [cueId, language, sourcePath, bytesText, sha256] = row.split("|");
    if (
      !cueId ||
      (language !== "en" && language !== "es") ||
      !sourcePath ||
      !bytesText ||
      !sha256 ||
      !/^[a-f0-9]{64}$/.test(sha256)
    ) {
      throw new Error("invalid static audio obligation row");
    }
    const bytes = Number(bytesText);
    if (!Number.isSafeInteger(bytes) || bytes < 1) {
      throw new Error("invalid static audio obligation byte count");
    }
    return {
      kind: "alignment-derived-static-audio-obligation",
      cueId,
      language,
      sourcePath,
      bytes,
      sha256,
      status: "alignment-derived-static-obligation-unresolved",
      catalogExactAssociation: false,
      candidateOnly: true,
      cuePromoted: false,
      timingResolved: false,
      runtimeReachabilityVerified: false,
      originalRuntimeListeningAccepted: false,
    };
  }),
);

export const COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATIONS =
  deepFreeze({
    kind: "alignment-derived-static-audio-obligation-set",
    obligations: COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATION_ROWS,
    inventory: {
      ...COURSE_G04_L11_FQ_003_STATIC_ARTIFACTS.audioInventory,
      rowSetSha256:
        "08faa45d7e38e527868a83041c767781696d2b3059e98a5fa78dfc4572c05402",
    },
    physicalMapping: {
      mappingRowSetSha256:
        "f80c62b2821394df5cb4f211a14661613186fb23bf0a1676ffc16f0f4ba7439a",
      mappedSourceCount: 260,
      physicalHashBoundSourceCount: 260,
      allRowsMappedUniquely: true,
      catalogExactAssociationCoverageCount: 0,
      lessonGroupCandidateOnlyCoverageCount: 260,
    },
    obligationCount: 260,
    languages: {en: 130, es: 130},
    bindingKind: "final-quiz-question-answer",
    catalogExactCueAssociationCount: 0,
    embeddedDefineSoundCount: 0,
    embeddedSoundStreamCount: 0,
    embeddedStartSoundCount: 0,
    embeddedExportedSoundLinkageCount: 0,
    cueTriggerResolved: false,
    cueFrameResolved: false,
    timingResolved: false,
    durationResolved: false,
    spokenContentResolved: false,
    synchronizationResolved: false,
    listeningAccepted: false,
    acceptanceEstablished: false,
    silenceEstablished: false,
    hostAudioCandidateCallsPresent: true,
    interpretation:
      "The inventory is a hash-bound alignment-derived obligation set. Zero exact associations or embedded sound records do not prove silence while host audio-call candidates remain unresolved.",
  } as const satisfies StaticAudioObligationSet & Readonly<{
    readonly inventory: SourceArtifactBinding & Readonly<{readonly rowSetSha256: string}>;
    readonly physicalMapping: Readonly<Record<string, string | number | boolean>>;
    readonly embeddedDefineSoundCount: number;
    readonly embeddedSoundStreamCount: number;
    readonly embeddedStartSoundCount: number;
    readonly embeddedExportedSoundLinkageCount: number;
    readonly hostAudioCandidateCallsPresent: boolean;
    readonly interpretation: string;
  }>);

export const COURSE_G04_L11_FQ_003_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  migrationStatus: "preserved",
  authoringInspectionComplete: false,
  authoringInspectionStatus: "not-complete-legacy-conversion-dialog",
  legacyConversionDialogAuditComplete: false,
  sourceActionSemanticsExecuted: false,
  runtimeEntryEstablished: false,
  runtimeReachabilityEstablished: false,
  naturalTraceEstablished: false,
  branchOrderEstablished: false,
  hitGeometryEstablished: false,
  hostDefaultsEstablished: false,
  terminalBehaviorEstablished: false,
  replayBehaviorEstablished: false,
  rendererImplemented: false,
  currentJavascriptImplemented: false,
  originalRuntimeEvidenceEstablished: false,
  ruffleEvidenceEstablished: false,
  browserEvidenceEstablished: false,
  visualComparisonEstablished: false,
  rmseMeasured: false,
  audioCueAcceptanceEstablished: false,
  humanVisualReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseAuthorized: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "none",
} as const);

export const COURSE_G04_L11_FQ_003_STATIC_SOURCE_FACTS = deepFreeze({
  kind: "internal-source-static-specification",
  animationId: COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID,
  assetId:
    "swf-d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
  source: {
    swf: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf",
      physicalBytes: 57010,
      sha256:
        "d23b4731d38748f012d914fac027f1c79ab725f0f767138a47d9ac4c99463ad0",
      signature: "CWS",
      compression: "zlib",
      version: 7,
      headerDeclaredUncompressedBytes: 234602,
      headerDeclaredLengthIsPhysicalFileSize: false,
      actionScriptVersion: "AS1/2",
    },
    fla: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.fla",
      physicalBytes: 3217408,
      sha256:
        "f69ac59104bf8a05f9920b0dc2e6cb3fa84aa32d2d0da054203e972eb06a5c4c",
      presenceAndHashOnly: true,
    },
    lessonXml: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml",
      physicalBytes: 10085,
      sha256:
        "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
      activeXmlOccurrence: 43,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    memberCount: 44,
    memberOrdinal: 43,
    releaseRole: "active-xml-referenced-page",
    sourcePath: "HELP_COURSES/ELMGR4/L11/FQ/L11FQ03.swf",
  },
  stage: {
    twips: {
      left: 0,
      right: 16000,
      top: 0,
      bottom: 12000,
      twipsPerPixel: 20,
    },
    pixels: {width: 800, height: 600},
    captureRaster: {width: 800, height: 600},
    fps: 12,
    rootFrameCount: 10,
    backgroundColor: "#b8d8f7",
  },
  artifacts: COURSE_G04_L11_FQ_003_STATIC_ARTIFACTS,
  unresolvedTimelines: COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_TIMELINES,
  rootCoverage: COURSE_G04_L11_FQ_003_STATIC_ROOT_COVERAGE,
  audioObligations: COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATIONS,
  evidenceBoundary: COURSE_G04_L11_FQ_003_STATIC_EVIDENCE_BOUNDARY,
} as const);

const sourceFactsDiagnostic = deepFreeze({
  status: "source-static",
  animationId: COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID,
  facts: COURSE_G04_L11_FQ_003_STATIC_SOURCE_FACTS,
} as const);

const unresolvedTimelinesDiagnostic = deepFreeze({
  status: "source-static",
  animationId: COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID,
  facts: COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_TIMELINES,
} as const);

const audioObligationsDiagnostic = deepFreeze({
  status: "source-static",
  animationId: COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID,
  facts: COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATIONS,
} as const);

const blockedSideEffectsDiagnostic = deepFreeze({
  status: "source-static",
  animationId: COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID,
  facts: COURSE_G04_L11_FQ_003_STATIC_BLOCKED_SIDE_EFFECT_RECORDS,
} as const);

const blockedDiagnostic = (animationId: unknown): BlockedStaticDiagnostic =>
  deepFreeze({
    status: "blocked",
    blocker: "invalid-animation-id",
    requestedAnimationId: typeof animationId === "string" ? animationId : null,
    facts: null,
  } as const) as BlockedStaticDiagnostic;

/**
 * Returns immutable source facts only for the exact catalog placement.
 * Any other identifier fails closed and exposes no substitute facts.
 */
export const getStaticSourceFacts = (
  animationId: unknown,
): StaticDiagnostic<typeof COURSE_G04_L11_FQ_003_STATIC_SOURCE_FACTS> =>
  animationId === COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID
    ? sourceFactsDiagnostic
    : blockedDiagnostic(animationId);

/**
 * Returns the unresolved nested-timeline inventory. It does not declare or
 * query child timelines as separately addressable implementation state.
 */
export const getUnresolvedTimelineDispositions = (
  animationId: unknown,
): StaticDiagnostic<typeof COURSE_G04_L11_FQ_003_STATIC_UNRESOLVED_TIMELINES> =>
  animationId === COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID
    ? unresolvedTimelinesDiagnostic
    : blockedDiagnostic(animationId);

/**
 * Returns the immutable alignment-derived obligation set, never a playback
 * instruction or an accepted cue map.
 */
export const getStaticAudioObligations = (
  animationId: unknown,
): StaticDiagnostic<typeof COURSE_G04_L11_FQ_003_STATIC_AUDIO_OBLIGATIONS> =>
  animationId === COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID
    ? audioObligationsDiagnostic
    : blockedDiagnostic(animationId);

/**
 * Returns unexecuted host/network/audio side-effect observations as inert
 * records. No legacy ActionScript call is exposed for execution.
 */
export const getBlockedSideEffectRecords = (
  animationId: unknown,
): StaticDiagnostic<typeof COURSE_G04_L11_FQ_003_STATIC_BLOCKED_SIDE_EFFECT_RECORDS> =>
  animationId === COURSE_G04_L11_FQ_003_STATIC_ANIMATION_ID
    ? blockedSideEffectsDiagnostic
    : blockedDiagnostic(animationId);
