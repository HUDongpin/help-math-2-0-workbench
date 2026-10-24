/**
 * Read-only, source-static predecessor evidence for the nine IN-010 residual
 * timelines. It deliberately does not declare any source domain, implement a
 * renderer, or establish a runtime/capture/acceptance result.
 */

const deepFreeze = <Value>(value: Value): Value => {
  if (value !== null && typeof value === "object") {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(value);
  }
  return value;
};

export const COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_ANIMATION_ID =
  "course-g04-l11-in-010" as const;

export const COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_SOURCE_FRAME_SCENARIO =
  "prospective-source-domain-entry-unresolved" as const;

/** The exported frame-domain surface is intentionally identifiers only. */
export const COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_SOURCE_FRAME_DOMAINS = deepFreeze([
  "sprite-74",
  "sprite-92",
  "sprite-106",
  "sprite-118",
  "sprite-152",
  "sprite-164",
  "sprite-192",
  "sprite-206",
  "sprite-245",
] as const);

export const COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_EVIDENCE_CAVEATS = deepFreeze({
  structuralSourceEvidenceOnly: true,
  sourceDomainDeclared: false,
  residualSuccessorPresent: false,
  authoritativeOriginalRuntimeEstablished: false,
  naturalRuntimeReachabilityEstablished: false,
  sourceActionSemanticsExecuted: false,
  flaHumanAuthoringAuditEstablished: false,
  currentJavascriptImplemented: false,
  candidateQaCompleted: false,
  audioEngineeringAccepted: false,
  audioListeningAccepted: false,
  replayBehaviorEstablished: false,
  visualFidelityEstablished: false,
  humanVisualReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "none" as const,
});

const independentRequired = deepFreeze([
  {
    timelineId: "sprite-74",
    sourceObjectId: "74",
    frameCount: 28,
    actionFrames: [1, 22, 28],
    parentPlacement: {
      depth: "56", frame: 191, hasClipActions: false, instanceName: "Mc_Wrong_Feed2",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "74", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "57fd0fb5fce0a45259b8a96bdfcf526de141f057ebb31de6bcc5b77704cd03ab",
      directDoActionTagCount: 3, ffdecFrameScriptCount: 3,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2064, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 2, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-92",
    sourceObjectId: "92",
    frameCount: 27,
    actionFrames: [1, 22, 27],
    parentPlacement: {
      depth: "66", frame: 191, hasClipActions: false, instanceName: "Mc_Wrong_Feed3",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "92", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "b83e9bd073768acb998d54b435a099bcae3181d9b468cecb75e4ef3133e5a107",
      directDoActionTagCount: 3, ffdecFrameScriptCount: 3,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2142, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 3, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-106",
    sourceObjectId: "106",
    frameCount: 31,
    actionFrames: [1, 22, 31],
    parentPlacement: {
      depth: "72", frame: 191, hasClipActions: false, instanceName: "Mc_Wrong_Feed4",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "106", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "7b069f818226f5e75c6d6861d5e3fd09ebe81a11083027a87b939776eb9bf655",
      directDoActionTagCount: 3, ffdecFrameScriptCount: 3,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2403, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 4, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-118",
    sourceObjectId: "118",
    frameCount: 29,
    actionFrames: [1, 22, 29],
    parentPlacement: {
      depth: "84", frame: 191, hasClipActions: false, instanceName: "Mc_Wrong_Feed1",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "118", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "5a085472a31c3cf7cf3a85b23cb161ed29d945f908deaafe0a3a49d97af84966",
      directDoActionTagCount: 3, ffdecFrameScriptCount: 3,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2325, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 5, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-152",
    sourceObjectId: "152",
    frameCount: 27,
    actionFrames: [1, 27],
    parentPlacement: {
      depth: "95", frame: 191, hasClipActions: false, instanceName: "Mc_Right_Feed1",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "152", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "4c99ddc252022c27ac1d34f6da42a57c2bcf28344d397e09c28c98d7e4d84d20",
      directDoActionTagCount: 2, ffdecFrameScriptCount: 2,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2220, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 6, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-164",
    sourceObjectId: "164",
    frameCount: 27,
    actionFrames: [1, 27],
    parentPlacement: {
      depth: "104", frame: 191, hasClipActions: false, instanceName: "Mc_Right_Feed4",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "164", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "4c99ddc252022c27ac1d34f6da42a57c2bcf28344d397e09c28c98d7e4d84d20",
      directDoActionTagCount: 2, ffdecFrameScriptCount: 2,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2142, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 7, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-192",
    sourceObjectId: "192",
    frameCount: 28,
    actionFrames: [1, 28],
    parentPlacement: {
      depth: "109", frame: 191, hasClipActions: false, instanceName: "Mc_Right_Feed3",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "192", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "7ae8000a03b5b87ff3cc516cafc4858c5ab97bc5cca04bdf987e6f0b112fc122",
      directDoActionTagCount: 2, ffdecFrameScriptCount: 2,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2220, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 8, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-206",
    sourceObjectId: "206",
    frameCount: 32,
    actionFrames: [1, 32],
    parentPlacement: {
      depth: "113", frame: 191, hasClipActions: false, instanceName: "Mc_Right_Feed2",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "206", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "629a45f61e6db8ab8633280588a8e23ad451968f1b9c2ef2c23da5058cc3a053",
      directDoActionTagCount: 2, ffdecFrameScriptCount: 2,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2482, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 9, syncMode: "stream",
    },
  },
  {
    timelineId: "sprite-245",
    sourceObjectId: "245",
    frameCount: 27,
    actionFrames: [1, 27],
    parentPlacement: {
      depth: "152", frame: 191, hasClipActions: false, instanceName: "Mc_Right_Feed5",
      parentTimelineId: "sprite-246", replace: "0", sourceObjectId: "245", tag: "PlaceObject2",
    },
    sourceProof: {
      actionFrameSequenceSha256: "4c99ddc252022c27ac1d34f6da42a57c2bcf28344d397e09c28c98d7e4d84d20",
      directDoActionTagCount: 2, ffdecFrameScriptCount: 2,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
    },
    audio: {
      channels: 1, cueMeaningResolved: false, durationMs: 2142, languageResolved: false,
      listeningAccepted: false, naturalTriggerEstablished: false, overlapResolved: false,
      replayBehaviorEstablished: false, sampleRateHz: 22050, startEndResolved: false,
      streamIndex: 10, syncMode: "stream",
    },
  },
] as const);

const retainedUnresolved = deepFreeze([
  {
    timelineId: "sprite-3", sourceObjectId: "3", frameCount: 1,
    reason: "scripted-one-frame-domain-semantics-unproved",
    nextEvidenceAction: "Prove with authoring or authoritative natural-runtime evidence whether the entry/tick ActionScript is wholly represented by a containing behavior state; one source frame alone does not justify either composite or independent-required.",
  },
  {
    timelineId: "sprite-71", sourceObjectId: "71", frameCount: 1,
    reason: "scripted-one-frame-domain-semantics-unproved",
    nextEvidenceAction: "Prove with authoring or authoritative natural-runtime evidence whether the entry/tick ActionScript is wholly represented by a containing behavior state; one source frame alone does not justify either composite or independent-required.",
  },
  {
    timelineId: "sprite-97", sourceObjectId: "97", frameCount: 1,
    reason: "scripted-one-frame-domain-semantics-unproved",
    nextEvidenceAction: "Prove with authoring or authoritative natural-runtime evidence whether the entry/tick ActionScript is wholly represented by a containing behavior state; one source frame alone does not justify either composite or independent-required.",
  },
  {
    timelineId: "sprite-212", sourceObjectId: "212", frameCount: 22,
    reason: "scriptless-multiframe-domain-needs-parent-or-runtime-proof",
    nextEvidenceAction: "Obtain an exact declared-parent clock proof or authoritative natural-runtime trace; the current source graph does not positively choose composite versus independent-required.",
  },
  {
    timelineId: "sprite-236", sourceObjectId: "236", frameCount: 19,
    reason: "scriptless-multiframe-domain-needs-parent-or-runtime-proof",
    nextEvidenceAction: "Obtain an exact declared-parent clock proof or authoritative natural-runtime trace; the current source graph does not positively choose composite versus independent-required.",
  },
] as const);

const plannerBlockers = deepFreeze({
  audio: {
    embeddedSoundStreamResidualCount: 9,
    externalSpanishPageAudio: {
      exactAssociationCount: 1,
      languageRouting: "es",
      listeningAccepted: false,
      runtimeReachabilityEstablished: false,
      timingResolved: false,
    },
    residualStreamsHaveOnlyStructuralEvidence: true,
  },
  retainedDomains: retainedUnresolved,
  runtimeDependencyClosureEstablished: false,
  sourceActionSemanticsExecuted: false,
});

const prospectiveProof = deepFreeze({
  independentRequired,
  retainedUnresolved,
  proofEngineFunction: "deriveSourceProvenIndependentRequiredAudit",
  proofType: "multi-frame-local-action-independent-domain",
  status: "prospective-source-domain-planning-only",
  materialized: false,
  residualSuccessorPresent: false,
  sourceDomainDeclared: false,
  strictAcceptanceEffect: "none" as const,
});

export const COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_SOURCE = deepFreeze({
  animationId: COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_ANIMATION_ID,
  assetId: "swf-8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
  releaseMembership: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    releaseRole: "active-xml-referenced-page",
    ordinal: 22,
    xmlOccurrence: 22,
  },
  swf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.swf",
    bytes: 879754,
    sha256: "8af2d73e85df5c68702ce37d2f233c64766434283d2fe6b419938e427c55a488",
    presenceAndHashOnly: true,
  },
  fla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN10.fla",
    bytes: 2720256,
    sha256: "b0269e6cb26d7dd89ca5a2705f4e11c0df093e88f0cfc0e2a1640d1521472815",
    presenceAndHashOnly: true,
  },
  runtimeHeader: {
    stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    fps: 12,
    root: {id: "root", frameCount: 10},
  },
  currentFrameDomainState: {
    persistedDeclaredTimelineIds: ["root", "sprite-246"],
    currentDeclaredTimelineIds: ["root", "sprite-246"],
    declaredFrameDomainCount: 2,
    unresolvedTimelineCount: 14,
    currentDispositionCounts: {
      declaredFrameDomainCount: 2,
      unresolvedTimelineCount: 14,
    },
    root: {id: "root", frameCount: 10, fps: 12},
    persistedSourceProvenIndependentTimelineIds: ["sprite-246"],
    sourceDomainDeclared: false,
    residualSuccessorPresent: false,
  },
  persistedSprite246PredecessorProof: {
    acceptedTimelineIds: ["sprite-246"],
    proofPath: "migrations/course-g04-l11-in-010/audit/source-proven-independent-frame-domain-evidence.json",
    proofBytes: 5558,
    proofSha256: "fd1c0e93b934ba1c8fc1d6a746827082a5ced78125f84efa9c598915c8002b80",
    status: "historical-predecessor-proof-bound-no-current-scenario-substitution",
  },
  residualSourceAudit: {
    independentRequired,
    retainedUnresolved,
    proofEngineFunction: prospectiveProof.proofEngineFunction,
    proofType: prospectiveProof.proofType,
    status: prospectiveProof.status,
  },
  prospectiveProof,
  conditionalForecast: {
    prospectiveIndependentRequiredCount: 9,
    retainedUnresolvedCount: 5,
    ifAuthorizedAndIndependentlyReviewed: {
      declaredFrameDomainCount: 11,
      unresolvedTimelineCount: 5,
    },
    materialized: false,
    residualSuccessorPresent: false,
    sourceDomainDeclared: false,
    strictAcceptanceEffect: "none",
  },
  plannerBlockers,
  predecessorProposal: {
    path: "scripts/prepare-g4-l11-in010-residual-source-domain-predecessor.mjs",
    bytes: 44071,
    sha256: "55379168d5150cca502a658632b80d64382d024f6b06b0ec16a50ecce5c34adf",
    artifactType: "g4-l11-in010-residual-source-domain-predecessor-proposal",
    schemaVersion: 1,
    inputSet: {
      count: 19,
      sha256: "d2b26e4f7821742756f556ee845fd8399a94ee2995a80d24122f00bfd2f87f73",
    },
    canonicalCore: {
      bytes: 27942,
      sha256: "57e0e14df26a78af1272ad246172583067d0f8b16ea1b09beef56dab3a55f0d8",
    },
    canonicalStdout: {
      bytes: 29644,
      sha256: "c54b3fa8fbe3f865338425cf8e7d548e94e56d520b177f3e9461d77c26508f02",
    },
  },
  sourceDomainDeclared: false,
  residualSuccessorPresent: false,
  materialized: false,
  captureIdentity: null,
});

type Domain = (typeof independentRequired)[number];
/*
 * A Map deliberately keeps arbitrary string probes out of Object.prototype.
 * This inspection surface must report every non-exact domain identifier as
 * unsupported rather than accidentally treating inherited names as records.
 */
const domainsById: ReadonlyMap<string, Domain> = new Map(
  independentRequired.map((domain) => [domain.timelineId, domain]),
);

const exactRequestValues = (request: unknown): Readonly<{
  readonly frameDomain: unknown;
  readonly scenario: unknown;
  readonly lang: unknown;
  readonly seed: unknown;
}> | null => {
  if (request === null || typeof request !== "object" || Array.isArray(request)) return null;
  try {
    const expectedKeys = ["frameDomain", "scenario", "lang", "seed"] as const;
    const ownKeys = Reflect.ownKeys(request);
    if (ownKeys.length !== expectedKeys.length
      || ownKeys.some((key) => typeof key !== "string")
      || expectedKeys.some((key) => !ownKeys.includes(key))) return null;
    const descriptors = Object.getOwnPropertyDescriptors(request);
    const descriptorKeys = Reflect.ownKeys(descriptors);
    if (descriptorKeys.length !== expectedKeys.length
      || descriptorKeys.some((key) => typeof key !== "string")
      || expectedKeys.some((key) => !descriptorKeys.includes(key))) return null;
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

const blocked = (blocker: string) => deepFreeze({
  status: "blocked" as const,
  blocker,
  frame: null,
  frameDomain: null,
  scenario: null,
  lang: null,
  seed: null,
  rootFrame: null,
  sourceDomainDeclared: false,
  captureIdentity: null,
  requirementId: null,
  traceId: null,
  entryStateSha256: null,
  evidenceCaveats: COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_EVIDENCE_CAVEATS,
});

const markersFor = (frame: number, domain: Domain): readonly string[] => deepFreeze([
  ...(frame === 1 ? ["first-local-frame"] : []),
  ...((domain.actionFrames as readonly number[]).includes(frame)
    ? ["record-only-avm1-doaction-frame"]
    : []),
  ...(frame === domain.frameCount ? ["last-local-frame"] : []),
]);

/**
 * This query is intentionally an evidence inspection surface, not a playback
 * API. It returns source records only and fail-closes every unsupported input.
 */
export const inspectCourseG04L11In010ResidualPredecessorSourceFrame = (
  frame: unknown,
  request: unknown,
) => {
  const query = exactRequestValues(request);
  if (query === null) return blocked("invalid-request");
  if (typeof query.frameDomain !== "string") return blocked("unsupported-frame-domain");
  const domain = domainsById.get(query.frameDomain);
  if (domain === undefined) return blocked("unsupported-frame-domain");
  if (query.lang !== "en" && query.lang !== "es") return blocked("unsupported-language");
  if (query.scenario !== COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_SOURCE_FRAME_SCENARIO) {
    return blocked("unsupported-scenario");
  }
  if (!Object.is(query.seed, 0)) return blocked("unsupported-seed");
  if (typeof frame !== "number" || !Number.isSafeInteger(frame)
    || frame < 1 || frame > domain.frameCount) return blocked("invalid-frame");

  const presentAtRequestedFrame = (domain.actionFrames as readonly number[]).includes(frame);
  return deepFreeze({
    status: "prospective-source-static" as const,
    blocker: null,
    frame,
    frameDomain: domain.timelineId,
    scenario: COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_SOURCE_FRAME_SCENARIO,
    lang: query.lang,
    seed: 0 as const,
    rootFrame: null,
    sourceDomainDeclared: false,
    domain,
    parentPlacement: domain.parentPlacement,
    structuralMarkers: markersFor(frame, domain),
    localAction: {
      presentAtRequestedFrame,
      recordOnly: true,
      semanticsExecuted: false,
      sourceProof: domain.sourceProof,
    },
    soundStreamStructuralEvidence: {
      ...domain.audio,
      format: "mp3" as const,
      language: "und" as const,
    },
    cueAtRequestedFrameEstablished: false,
    blockers: plannerBlockers,
    prospectiveProof,
    captureIdentity: null,
    requirementId: null,
    traceId: null,
    entryStateSha256: null,
    evidenceCaveats: COURSE_G04_L11_IN_010_RESIDUAL_PREDECESSOR_EVIDENCE_CAVEATS,
  });
};
