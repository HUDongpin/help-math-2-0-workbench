import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalContractJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalContractJson).join(",")}]`;
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort(compareCodeUnits).map((key) => `${JSON.stringify(key)}:${canonicalContractJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export const SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE = "scripts/source-driven-branch-capture-contracts.mjs";
export const SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH = fileURLToPath(import.meta.url);

export const SOURCE_DRIVEN_BRANCH_PROOF_MODE = "natural-trace-ordered-events";
export const SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT = "本人声明本候选中的最小适配器进入、自然 random(2) 分支结果、三条源驱动事件、142 个逐帧状态和 PNG 均来自同一个 Adobe Flash Player 会话，未注入 seed、强制分支、直接 seek、逐帧步进或事后补写；此声明不等同于运行时来源的独立密码学证明";
export const SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE = "本工具只验证具名真人声明、当前 source/spec/kit 哈希、自然分支语义、逐帧 PNG 和证据链，并生成待 human/owner 审核的候选；它不创建 canonical baseline/execution、RMSE、音频验收、human review、owner acceptance 或 strict completion。";
export const SOURCE_DRIVEN_ENVIRONMENT_STATEMENT = "本人确认本次 Adobe Flash 会话运行在独立、可丢弃且未复用的 macOS VM 快照或一次性登录账户中，使用真实独立 home 下会话前为空的 Flash profile，并在会话后重置或销毁";
export const SOURCE_DRIVEN_LAUNCH_STATEMENT = "本人确认由本人在已声明的隔离环境中，以已绑定的 sandbox 打开 kit 内只读最小适配器；候选准备工具没有启动 Adobe、注入分支或执行课程动作";

export const APPROVED_SOURCE_DRIVEN_RUNTIME = deepFreeze({
  runtimeId: "adobe-flash-player-projector",
  name: "Adobe Flash Player Projector",
  version: "32.0.0.414",
  executableSha256: "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30",
});

export const DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES = deepFreeze([
  {
    animationId: "course-g03-l06-ti-001",
    captureEligible: true,
    frameDomainId: "sprite-21",
    fixtureManifest: "work/adobe-course-host-fixtures/generated/course-g03-l06-ti-001/c247e930fe9620548bce4d04/fixture-manifest.json",
    fixtureManifestSha256: "96e3c94a5be940e0f783e93565efdb836d3864909650e72c123dc796a122c8a3",
    fixtureDigest: "c247e930fe9620548bce4d0423f30fa1bc820ad46f3c7e408d09f836781927fa",
    fixtureSpecSha256: "7066924bf538165d52361836d0ddce802b18b7033b81aaf843020beb2bb6996e",
    hostSha256: "7af9095c1997a8b0d45283ee19a9081ef205b4c2f695f23ce9a05b68db081feb",
    childRuntimePath: "lesson/TI/L6TI01.swf",
    childSha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
    upstreamSandboxSha256: "9ad3721e7432c9ae0717726f76c2e5fd666dc5855debd36285a6a2fd4e185b2b",
    specs: [
      {requirementId: "req:sprite-21:sound-0:en", outcome: 0, specFile: "migrations/course-g03-l06-ti-001/audit/trace-specs/req-sprite-21-sound-0-en.json"},
      {requirementId: "req:sprite-21:sound-1:en", outcome: 1, specFile: "migrations/course-g03-l06-ti-001/audit/trace-specs/req-sprite-21-sound-1-en.json"},
    ],
  },
  {
    animationId: "course-g04-l01-ir-001",
    captureEligible: false,
    captureBlocker: "The regenerated IR safe-adapter fixture now binds the exact same-lesson entry evidence with zero unresolved parent-value bindings, but its new content-addressed digest has not received the required named-human GUI sandbox smoke approval or a bound capture-session authorization.",
    frameDomainId: "sprite-58",
    fixtureManifest: "work/adobe-course-host-fixtures/generated/course-g04-l01-ir-001/1f1d928ba5f043f331fcdacc/fixture-manifest.json",
    fixtureManifestSha256: "24ec8a79a72d50fd3c04ea69ff7988272fd563548bda6b78d8ef0ad704c691d4",
    fixtureDigest: "1f1d928ba5f043f331fcdacc3be90afdd4a69c6e609371486fb1f2f4e3aa0277",
    fixtureSpecSha256: "e52034b981b12b889f56573b39d20e8f14e9dc8dc79be1c0b5271ee0fb317c1e",
    hostSha256: "be65de452b27d8c6fafe1176315949fe2c6fe8b6846640dde31e45836f84f776",
    childRuntimePath: "lesson/IR/L1RW01.swf",
    childSha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
    upstreamSandboxSha256: "c807d6c3950c32988514427eabfc0f91a3cd59bff5d49315cc3a212ec5aa3fb7",
    specs: [
      {requirementId: "req:sprite-58:sound-0:en", outcome: 0, specFile: "migrations/course-g04-l01-ir-001/audit/trace-specs/req-sprite-58-sound-0-en.json"},
      {requirementId: "req:sprite-58:sound-1:en", outcome: 1, specFile: "migrations/course-g04-l01-ir-001/audit/trace-specs/req-sprite-58-sound-1-en.json"},
    ],
  },
]);

export const SOURCE_DRIVEN_BRANCH_LEGACY_V1_MANIFEST_SHA256 = deepFreeze({
  "req:sprite-21:sound-0:en": "a39cf533fa9bee36953f1e392b2a997088a59b283310e043e7ca2844fa77f7ac",
  "req:sprite-21:sound-1:en": "248e5012bdf562e6944664c8d5f7de1c70c3b82a991c7e41d70491716ffe3031",
});

export const SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_MANIFEST_SHA256 = deepFreeze({
  "req:sprite-21:sound-0:en": "170621a97e68059986df5f6790ba06f9dc7f6704f711b9de6ce2023508147961",
  "req:sprite-21:sound-1:en": "f21fae9cbe16f2b356eebca94ec55ffdea1fc1d6ad2ae51ebef789d80883b4e6",
});

export const SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_TREE_SHA256 = deepFreeze({
  "req:sprite-21:sound-0:en": "abe50eb02e51e95b2528c274604348115ba3bfa1cbe0782e505d65350080c448",
  "req:sprite-21:sound-1:en": "c497f510e3a306514c2a01700e86ca2e7e71206518a84da62b688cfdeac6f0b4",
});

// These pins are copied from the newest immutable current-v2 archive records.
// They are compatibility identities, not newly inferred or regenerated evidence.
export const SOURCE_DRIVEN_BRANCH_CURRENT_V2_MANIFEST_SHA256 = deepFreeze({
  "req:sprite-21:sound-0:en": "cb7357564629d7c8a7ebd0aff5889657b1fb8773680273618ffb2029fc04ac4e",
  "req:sprite-21:sound-1:en": "9a8eb498489b2570ac0b2232f9f8b97fc682655d4b6f7c4c08f46ea11a24e851",
});

export const SOURCE_DRIVEN_BRANCH_CURRENT_V2_TREE_SHA256 = deepFreeze({
  "req:sprite-21:sound-0:en": "25ad7028d5f7838bf83b4ad50fa2d54f34ced5a7c70d0292552ae734e24e89b6",
  "req:sprite-21:sound-1:en": "9dae39eaf71f3e638f5306629385b801c8e401e9580c412ea411da6f28f30dfe",
});

export const SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT = deepFreeze({
  schemaVersion: 2,
  requiredCliInputs: [
    "spec", "kitManifest", "environmentIsolationReceipt", "launchReceipt", "toolchainReceipt", "sessionAttestation",
    "adapterEntryLog", "randomTrialLog", "operationLog", "sourceEventLog", "frameStateLog", "captureManifest", "frames",
  ],
  inputTemplatePaths: {
    environmentIsolationReceipt: "templates/environment-isolation-receipt.template.json",
    launchReceipt: "templates/adapter-launch-receipt.template.json",
    toolchainReceipt: "templates/runtime-toolchain-receipt.template.json",
    sessionAttestation: "templates/session-attestation.template.json",
    adapterEntryLog: "templates/adapter-entry-log.schema.template.jsonl",
    randomTrialLog: "templates/random-trial-log.schema.template.jsonl",
    operationLog: "templates/operation-log.schema.template.jsonl",
    sourceEventLog: "templates/source-driven-event-log.schema.template.jsonl",
    frameStateLog: "templates/frame-state-log.schema.template.jsonl",
    captureManifest: "templates/capture-manifest.template.json",
    frames: "frames",
  },
  evidenceTypes: {
    environmentIsolationReceipt: "named-human-disposable-flash-runtime-environment-receipt",
    launchReceipt: "named-human-source-driven-projector-launch-receipt",
    toolchainReceipt: "human-attested-adobe-runtime-toolchain-receipt",
    sessionAttestation: "named-human-source-driven-branch-capture-session-attestation",
    adapterEntryRecord: "attested-source-driven-adapter-entry",
    randomTrialRecord: "attested-source-driven-natural-random-trial",
    operationRecord: "attested-source-driven-passive-operation",
    sourceEventRecord: "attested-source-driven-event-observation",
    frameStateRecord: "attested-source-driven-natural-frame-state",
    captureManifest: "attested-source-driven-branch-capture-manifest",
  },
  counts: {
    adapterEntryRecords: 2,
    randomTrialRecordsPerAcceptedSession: 1,
    sourceEventRecords: 3,
    frameStateRecords: 142,
    operationRecords: 145,
    operatorDispatchRecords: 0,
  },
  fieldContracts: {
    namedHuman: ["kind", "fullName", "role", "organizationOrOwnerId", "contact"],
    environmentIsolationReceipt: [
      "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "isolationMode",
      "operatingSystem", "account", "profile", "preflight", "postflight", "operator",
      "startedAt", "endedAt", "signedAt", "statement", "receiptSha256",
    ],
    launchReceipt: [
      "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "captureKit",
      "environmentIsolation", "sandboxProfile", "runtime", "adapter", "launchProtocol", "projectorStart",
      "adapterOpen", "operator", "statement", "signedAt", "receiptSha256",
    ],
    toolchainReceipt: ["schemaVersion", "evidenceType", "runtime", "captureSessionBinding", "capturedAt", "identityArtifacts"],
    sessionAttestation: [
      "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "proofMode", "traceSpec", "traceSpecIndex",
      "sourceSwf", "captureKitManifest", "sandboxProfile", "environmentIsolation", "launchReceipt", "toolchainReceipt", "adapterEntry",
      "naturalRandomObservation", "adapterEntryLog", "randomTrialLog", "operationLog", "sourceEventLog", "frameStateLog", "captureManifest", "frameSet", "scheduleBinding",
      "masterEvidenceChain", "authority", "startedAt", "endedAt", "signedAt", "monotonicTimeOrigin", "operator", "unexpectedEvents", "statement", "notes", "attestationSha256",
    ],
    commonRecord: [
      "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "acceptedAttemptId",
      "traceSpecSha256", "traceSpecIndexSha256", "sourceSwfSha256", "captureKitManifestSha256", "sandboxProfileSha256",
      "environmentIsolationReceiptSha256", "launchReceiptSha256", "toolchainReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs", "operator",
    ],
    adapterEntryRecord: ["phase", "action", "sourceTarget", "observation", "operatorDispatch", "previousRecordSha256", "recordSha256"],
    randomTrialRecord: [
      "attemptId", "restartObserved", "randomCall", "observedOutcome", "naturallyObservedBranch", "selectedInstanceName", "selectedObjectId", "disposition",
      "identitySeedInjectedIntoAvm1", "seedInjected", "forcedBranch", "randomOverridden", "branchVariableWrittenByAdapter",
      "operatorDispatch", "acceptedTraceStarted", "previousRecordSha256", "recordSha256",
    ],
    sourceEventRecord: [
      "scheduledEventOrder", "scheduledEventSha256", "observedTrigger", "resolvedSourceTarget", "preState", "preStateSha256", "postState", "postStateSha256",
      "preStateObservationMethod", "postStateObservationMethod", "preScreenshotFrame", "postScreenshotFrame", "operatorDispatch",
      "causalPredecessorRecordSha256", "previousRecordSha256", "recordSha256",
    ],
    frameStateRecord: [
      "frameDomainId", "observedRootFrame", "observedLocalFrame", "naturallyObservedOutcome", "naturallyObservedBranch", "observedState", "observedStateSha256",
      "screenshotFile", "screenshotSha256", "precedingSourceEventRecordSha256", "previousRecordSha256", "recordSha256",
    ],
    operationRecord: ["operationKind", "observedFrame", "sourceEventOrder", "referencedRecordSha256", "operatorDispatch", "previousRecordSha256", "recordSha256"],
    captureManifest: [
      "schemaVersion", "evidenceType", "status", "animationId", "requirementId", "identity", "traceSpec", "traceSpecIndex", "sourceSwf", "captureKitManifest",
      "launchReceipt", "sessionId", "acceptedAttemptId", "stage", "fps", "frameNumbering", "frameCount", "adapterEntryLog", "randomTrialLog", "operationLog",
      "sourceEventLog", "frameStateLog", "frames", "orderedFrameSetSha256", "masterEvidenceChain", "authority", "strictAcceptanceEffect",
    ],
  },
  causalContract: {
    recordHashAlgorithm: "sha256-canonical-json-with-recordSha256-omitted-v1",
    masterBindingAlgorithm: "sha256-canonical-json-source-driven-master-evidence-chain-v1",
    adapterEntry: {
      firstPreviousRecordSha256: null,
      finalSequence: 2,
    },
    randomTrial: {
      exactlyOneNaturalAttemptPerAcceptedSession: true,
      acceptedRecordMustBeOnlyRecord: true,
      firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256",
    },
    sourceEvents: [
      {order: 1, frame: 1, causalPredecessorRecordSha256From: "randomTrialLog.finalRecordSha256"},
      {order: 2, frame: 5, causalPredecessorRecordSha256From: "frameStateLog.frame-0004.recordSha256"},
      {order: 3, frame: 142, causalPredecessorRecordSha256From: "frameStateLog.frame-0141.recordSha256"},
    ],
    frameStates: {
      precedingSourceEventRecordSha256AtFrames: {
        "1": "sourceEventLog.event-1.recordSha256",
        "5": "sourceEventLog.event-2.recordSha256",
        "142": "sourceEventLog.event-3.recordSha256",
      },
      precedingSourceEventRecordSha256Otherwise: null,
    },
    operations: {
      firstRecordPreviousRecordSha256From: "randomTrialLog.finalRecordSha256",
      everyRecordReferencesExactlyOneRawEventOrFrameRecord: true,
      sourceEventBeforeCorrespondingFrameStateAt: [1, 5, 142],
    },
    masterEvidenceChain: {
      rootHashFrom: "adapterEntryLog.sequence-1.recordSha256",
      finalHashFrom: "operationLog.sequence-145.recordSha256",
      intermediateHashBindings: [
        "adapterEntryLog.finalRecordSha256",
        "randomTrialLog.finalRecordSha256",
        "sourceEventLog.event-1.recordSha256",
        "frameStateLog.frame-0001.recordSha256",
        "frameStateLog.frame-0004.recordSha256",
        "sourceEventLog.event-2.recordSha256",
        "frameStateLog.frame-0005.recordSha256",
        "frameStateLog.frame-0141.recordSha256",
        "sourceEventLog.event-3.recordSha256",
        "frameStateLog.frame-0142.recordSha256",
      ],
      requiredIn: ["sessionAttestation", "captureManifest"],
    },
  },
  outputAuthority: {
    candidateOnly: true,
    status: "pending-candidate-only",
    candidateWriterModule: "scripts/prepare-source-driven-branch-candidate.mjs",
    canonicalBaselineWritten: false,
    canonicalExecutionEvidenceWritten: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    strictAcceptanceEffect: false,
  },
  runtimeLaunchAuthority: "named-human-input-receipt-only-preparer-never-launches-runtime",
});

export const SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256 = sha256(
  canonicalContractJson(SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT),
);

export function sourceDrivenBranchCandidateInputContractSha256(value = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT) {
  return sha256(canonicalContractJson(value));
}
