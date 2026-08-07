#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const OUTPUT_RELATIVE = "work/g4-l3-ts006-original-runtime-session-kits";
const REPORT_JSON = "reports/g4-l3-ts006-original-runtime-session-kit-readiness.json";
const REPORT_MARKDOWN = "reports/g4-l3-ts006-original-runtime-session-kit-readiness.md";
const INPUTS = Object.freeze({
  authorizationIntake: "work/g4-l3-ts006-original-runtime-authorization-intake/owner-authorization-intake.json",
  accountExceptionIntake: "work/g4-l3-ts006-original-runtime-authorization-intake/current-admin-account-exception-intake.json",
  roleDesignationIntake: "work/g4-l3-ts006-original-runtime-authorization-intake/single-person-role-designation-intake.json",
  scheduleCandidate: "reports/g4-l3-ts006-original-runtime-schedule-candidate.json",
  sessionProtocol: "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json",
  hostTreeManifest: `work/original-runtime-host-trees/${ANIMATION_ID}/root/staging-manifest.json`,
  runtimeEnvironment: "reports/g4-l3-original-runtime-environment-readiness.json",
  containmentReadiness: "reports/g4-l3-original-runtime-containment-readiness.json",
  capacityReadiness: "reports/g4-l3-capture-capacity-readiness.json",
  coverage: `migrations/${ANIMATION_ID}/evidence/full-frame-coverage.json`,
});
const LANGUAGES = Object.freeze(["en", "es"]);
const CONTROL_IDS = Object.freeze(["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"]);
const TEMPLATE_FILES = Object.freeze([
  "AUTHORIZATION.template.json",
  "PREFLIGHT.template.json",
  "LAUNCH_RECEIPT.template.json",
  "RUNTIME_OBSERVATION.template.json",
  "SESSION_ATTESTATION.template.json",
  "OPERATOR_CARD.md",
]);
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function absolute(root, relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `invalid project-relative path: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function bindRegularFile(root, relativePath, {json = true, allowHardLink = false} = {}) {
  const target = absolute(root, relativePath);
  const metadata = await lstat(target);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(target);
  invariant(allowHardLink || physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(target);
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...(json ? {value: JSON.parse(bytes)} : {}),
  };
}

function publicBinding(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function containmentMechanisms(hostTree, accountException) {
  const account = accountException.localExecutionContext;
  return [
    {
      controlId: "CR-01",
      candidate: "owner-approved current-account exception; process-level deny-all egress plus host network disable; pre/live/post no-egress proof",
      requiresLiveHumanVerification: true,
    },
    {
      controlId: "CR-02",
      candidate: `read-only 0444/0555 ${hostTree.summary.files}-file SHA-256 allowlisted lesson host tree`,
      technicallyPrepared: true,
      requiresExternalApprovalSignature: true,
    },
    {
      controlId: "CR-03",
      candidate: `current ${account.accountClass} account; one separate disposable HOME and CFFIXED_USER_HOME per language; deny access to the real Flash profile; empty preferences and SharedObject stores; discard each profile after evidence promotion`,
      requiresLiveHumanVerification: true,
      ownerAccountIsolationExceptionRequired: true,
    },
    {
      controlId: "CR-04",
      candidate: "one fresh Projector process per language; manual File > Open of the staged lesson shell; abort on any unexpected dialog or side effect",
      requiresNamedHumanOperator: true,
    },
    {
      controlId: "CR-05",
      candidate: "same-session host connection/request audit with pre-launch, live, and post-exit receipts proving no legacy request reached a server",
      requiresLiveHumanVerification: true,
    },
    {
      controlId: "CR-06",
      candidate: "deny-all legacy endpoint policy plus process/AppleEvent/browser/host-command monitoring; no telemetry, javascript URL, fscommand, or persistent bookmark allowlist",
      requiresLiveHumanVerification: true,
    },
    {
      controlId: "CR-07",
      candidate: "same-session free-space measurement must meet the current 1.20 multiplier plus 100 GiB reserve threshold",
      requiresLiveHumanVerification: true,
    },
    {
      controlId: "CR-08",
      candidate: "external signed owner, current-account isolation exception, containment approver, named operator, host, account, disposable profile, launch path, schedule, and stop-condition envelopes",
      requiresExternalTrustRoot: true,
    },
  ];
}

function validateInputs(inputs) {
  const authorization = inputs.authorizationIntake.value;
  invariant(authorization.evidenceType === "g4-l3-ts006-user-stated-original-runtime-authorization-intake"
    && authorization.taskThreadId === "019f97f7-513e-7572-9f91-9314236e97c6"
    && authorization.authorizationScopes?.length === 5
    && authorization.authorityBoundary?.userAuthorizationIntentRecorded === true
    && authorization.authorityBoundary?.cryptographicOwnerSignatureBound === false
    && authorization.authorityBoundary?.runtimeExecutionAuthorizedByThisIntakeAlone === false,
  "owner authorization intake identity or fail-closed boundary drifted");

  const accountException = inputs.accountExceptionIntake.value;
  invariant(accountException.evidenceType === "g4-l3-ts006-user-stated-current-admin-account-exception-intake"
    && accountException.taskThreadId === authorization.taskThreadId
    && accountException.decision?.doNotCreateAdditionalMacosAccounts === true
    && accountException.decision?.permitCurrentMacosAccountForEnEsCapture === true
    && accountException.decision?.preserveIndependentLanguageSessions === true
    && accountException.localExecutionContext?.accountIdentifier === "peter"
    && accountException.localExecutionContext?.accountClass === "current-macos-administrator"
    && accountException.localExecutionContext?.candidateIsolationMode === "same-account-separate-disposable-process-profiles"
    && accountException.localExecutionContext?.newAccountsCreated?.length === 0
    && accountException.requiredCompensatingControls?.length === 10
    && accountException.authorityBoundary?.userDecisionIntentRecorded === true
    && accountException.authorityBoundary?.cryptographicOwnerSignatureBound === false
    && accountException.authorityBoundary?.runtimeExecutionAuthorizedByThisIntakeAlone === false
    && accountException.authorityBoundary?.strictAcceptanceEffect === "none",
  "current-admin account exception intake or fail-closed boundary drifted");

  const roleDesignation = inputs.roleDesignationIntake.value;
  invariant(roleDesignation.evidenceType === "g4-l3-ts006-user-stated-single-person-role-designation-intake"
    && roleDesignation.taskThreadId === authorization.taskThreadId
    && roleDesignation.person?.displayName === "Dr. Peter Hu"
    && roleDesignation.person?.externalSubjectId === null
    && roleDesignation.person?.publicKeyFingerprintSha256 === null
    && roleDesignation.person?.externalSignatureEnvelope === null
    && roleDesignation.requestedAssignments?.length === 4
    && roleDesignation.roleCounts?.distinctNamedHumans === 1
    && roleDesignation.roleCounts?.distinctExternalSubjects === 0
    && roleDesignation.eligibility?.pendingCandidateRuntimeOperationEligibleAfterLiveContainmentPreflight === true
    && roleDesignation.eligibility?.independentVisualReviewSatisfied === false
    && roleDesignation.eligibility?.fourDistinctTrustSubjectsSatisfied === false
    && roleDesignation.eligibility?.productionTrustRootEligible === false
    && roleDesignation.eligibility?.strictAcceptanceEligible === false
    && roleDesignation.authorityBoundary?.cryptographicSignaturesBound === false
    && roleDesignation.authorityBoundary?.strictAcceptanceEffect === "none",
  "single-person role designation intake or independence boundary drifted");

  const schedule = inputs.scheduleCandidate.value;
  invariant(schedule.reportType === "g4-l3-ts006-original-runtime-schedule-candidate"
    && schedule.scope?.animationId === ANIMATION_ID
    && schedule.scope?.releaseId === RELEASE_ID
    && schedule.scheduleCandidate?.sessions?.map(({language}) => language).join("|") === "en|es"
    && schedule.scheduleCandidate?.controlApprovalsRecorded === 0
    && schedule.scheduleCandidate?.ownerApprovalsRecorded === 0
    && schedule.scheduleCandidate?.namedOperatorsRecorded === 0
    && schedule.scheduleCandidate?.runtimeSessionsExecuted === 0
    && schedule.executionGate?.originalRuntimeExecutionReady === false,
  "TS006 schedule candidate is missing, executed, or already promoted");

  const protocol = inputs.sessionProtocol.value;
  invariant(protocol.reportType === "g4-l3-ts006-original-runtime-session-protocol-draft"
    && protocol.scope?.animationId === ANIMATION_ID
    && protocol.scope?.runtimeSessionsExecuted === 0
    && protocol.proposedProtocol?.directSeekAllowed === false
    && protocol.proposedProtocol?.sameLessonHostNaturalEntryRequired === true
    && protocol.proposedProtocol?.steps?.map(({stepId}) => stepId).join("|") === "P00|P01|P02|P03|P04|P05|P06|P07|P08|P09",
  "TS006 natural-entry protocol is incomplete or promoted");

  const hostTree = inputs.hostTreeManifest.value;
  invariant(hostTree.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree"
    && hostTree.selectedCandidate?.animationId === ANIMATION_ID
    && hostTree.summary?.files === 657
    && hostTree.summary?.bytes === 35_469_789
    && hostTree.stagedRoot?.fileMode === "0444"
    && hostTree.stagedRoot?.directoryMode === "0555"
    && hostTree.acceptance?.authoritativeOriginalRuntimeAccepted === false,
  "TS006 read-only host tree is incomplete or promoted");
  const shell = hostTree.files?.find(({path: filePath}) => filePath === "HELP_COURSES/ELMGR4/L3/index_local.swf");
  invariant(shell?.bytes === 657421 && shell.sha256 === "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
    "TS006 host tree shell identity drifted");

  const runtime = inputs.runtimeEnvironment.value;
  invariant(runtime.reportType === "g4-l3-original-runtime-environment-readiness"
    && runtime.installedRuntimeCandidate?.runtimeId === "adobe-flash-player-projector"
    && runtime.installedRuntimeCandidate?.version === "32.0.0.414"
    && runtime.installedRuntimeCandidate?.executable?.sha256 === "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30"
    && runtime.installedRuntimeCandidate?.codeSignature?.strictVerification?.passed === true
    && runtime.summary?.runtimeSessionsExecuted === 0,
  "Flash Projector candidate identity or point-in-time signature readiness drifted");

  const containment = inputs.containmentReadiness.value;
  invariant(containment.reportType === "g4-l3-original-runtime-containment-readiness"
    && containment.containmentPlan?.controls?.map(({controlId}) => controlId).join("|") === CONTROL_IDS.join("|")
    && containment.summary?.runtimeSessionsExecuted === 0,
  "containment requirement scope drifted");

  const capacity = inputs.capacityReadiness.value;
  invariant(capacity.reportType === "g4-l3-capture-capacity-readiness"
    && capacity.capacityModel?.admission === "admit-full-lesson-capture-capacity"
    && capacity.capacityModel?.remainingEvidenceSafetyMultiplier === 1.2
    && capacity.capacityModel?.operationalReserveBytes === 100 * 1024 ** 3
    && Number.isSafeInteger(capacity.capacityModel?.minimumSafeFreeBytes),
  "capture capacity admission or reserve policy drifted");

  const coverage = inputs.coverage.value;
  invariant(coverage.schemaVersion === 2 && coverage.animationId === ANIMATION_ID
    && coverage.requirements?.length === 4
    && coverage.requirements.every((row) => row.status === "pending"
      && row.baselineAuthority === "unresolved"
      && row.baselineAuthorityRequirement === "original-runtime-natural-trace"
      && HASH.test(row.entryStateSha256)),
  "TS006 full-frame coverage is not four unresolved natural-trace requirements");

  return {authorization, accountException, roleDesignation, schedule, protocol, hostTree, shell, runtime, containment, capacity, coverage};
}

function blankAuthorization(language, session, mechanisms, accountException) {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-session-authorization-template",
    status: "blank-copy-out-and-sign-externally",
    animationId: ANIMATION_ID,
    language,
    protocolTraceCandidateId: session.protocolTraceCandidateId,
    manifestDigest: null,
    owner: {subjectId: null, fullName: null, role: null, decision: null, decidedAt: null, signatureEnvelope: null},
    containmentApprover: {subjectId: null, fullName: null, role: null, approvedControlIds: [], decidedAt: null, signatureEnvelope: null},
    operator: {subjectId: null, fullName: null, role: null, accountIdentifier: null, sessionId: null, signatureEnvelope: null},
    independentVisualReviewer: {subjectId: null, fullName: null, role: null, signatureEnvelope: null},
    releaseCustodian: {subjectId: null, fullName: null, role: null, signatureEnvelope: null},
    externalTrustRoot: {path: null, authoritySha256: null, signatureEnvelope: null},
    authorizedHost: {hostId: null, hostIdentitySha256: null, accountIdentifier: null, signatureEnvelope: null},
    accountIsolationDecision: {
      mode: accountException.localExecutionContext.candidateIsolationMode,
      candidateAccountIdentifier: accountException.localExecutionContext.accountIdentifier,
      additionalMacosAccountsRequired: false,
      disposableProfileRoot: null,
      exceptionSignatureEnvelope: null,
    },
    containmentMechanismCandidates: mechanisms,
    launchPath: null,
    launchCommand: null,
    stopConditionsAccepted: false,
    runtimeExecutionAuthorized: false,
  };
}

function blankPreflight(language, session, input) {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-live-preflight-template",
    status: "blank-not-observed",
    animationId: ANIMATION_ID,
    language,
    protocolTraceCandidateId: session.protocolTraceCandidateId,
    observedAt: null,
    operatorSubjectId: null,
    accountIdentifier: null,
    hostIdentitySha256: null,
    projectorExecutable: input.runtime.installedRuntimeCandidate.executable,
    projectorStrictSignatureReverified: false,
    readOnlyHostTree: {
      path: input.hostTree.stagedRoot.path,
      fileSetSha256: input.hostTree.fileSetSha256,
      manifestSha256: null,
      byteForByteVerified: false,
      shellByteForByteVerified: false,
    },
    network: {allServicesDisabled: false, denyAllRuleVerified: false, noEgressProbePassed: false, auditStarted: false},
    profile: {
      isolationMode: input.accountException.localExecutionContext.candidateIsolationMode,
      currentAdminAccountExceptionExternallySigned: false,
      additionalMacosAccountCreated: false,
      disposableProfileRoot: null,
      disposableHomeEnvironmentBound: false,
      realUserFlashProfileDenied: false,
      realUserFlashProfileAccessObserved: null,
      disposableBrowserOrFlashStatePresentBeforeLaunch: null,
      disposableSharedObjectStoreEmpty: false,
    },
    capacity: {
      availableBytes: null,
      minimumRequiredBytes: input.capacity.capacityModel.minimumSafeFreeBytes,
      operationalReserveBytes: input.capacity.capacityModel.operationalReserveBytes,
      remainingEvidenceSafetyMultiplier: input.capacity.capacityModel.remainingEvidenceSafetyMultiplier,
      passed: false,
    },
    approvedControlIds: [],
    allChecksPassed: false,
    signatureEnvelope: null,
  };
}

function blankLaunchReceipt(language, session, input) {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-launch-receipt-template",
    status: "blank-not-launched",
    animationId: ANIMATION_ID,
    language,
    sessionId: null,
    operatorSubjectId: null,
    accountIdentifier: null,
    disposableProfileRoot: null,
    homeEnvironmentSha256: null,
    projectorPid: null,
    projectorStartedAt: null,
    guiOpenAt: null,
    openedBy: null,
    commandLineSwfArgumentUsed: null,
    directSeekUsed: null,
    selectedHostPath: input.hostTree.stagedRoot.path + "/HELP_COURSES/ELMGR4/L3/index_local.swf",
    selectedHostSha256: input.shell.sha256,
    playerWindowObserved: false,
    unexpectedDialogObserved: null,
    aborted: null,
    abortReason: null,
    processExitAt: null,
    completeExitVerified: false,
    signatureEnvelope: null,
  };
}

function blankObservation(language, session) {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-session-observation-template",
    status: "blank-no-runtime-observation",
    animationId: ANIMATION_ID,
    language,
    sessionId: null,
    protocolTraceCandidateId: session.protocolTraceCandidateId,
    authoritativeTraceId: null,
    coverageRequirements: session.coverageRequirements,
    naturalEntryEvents: [],
    orderedStateHashChain: [],
    frameDomains: [],
    pngFrames: [],
    audioEvents: [],
    replayEvents: [],
    navigationEvents: [],
    requestAudit: [],
    unexpectedEffects: [],
    runtimeSessionExecuted: false,
    completeNaturalTraceObserved: false,
    signatureEnvelope: null,
  };
}

function blankAttestation(language, session) {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-session-attestation-template",
    status: "blank-not-attested",
    animationId: ANIMATION_ID,
    language,
    sessionId: null,
    protocolTraceCandidateId: session.protocolTraceCandidateId,
    kitManifestSha256: null,
    authorizationEnvelopeSha256: null,
    preflightSha256: null,
    launchReceiptSha256: null,
    runtimeObservationSha256: null,
    noEgressPostflightPassed: false,
    sharedObjectPostflightEmpty: false,
    processCompletelyExited: false,
    operatorSubjectId: null,
    signedAt: null,
    signatureEnvelope: null,
    authoritativeBaselineClaimed: false,
  };
}

function operatorCard(language, session, input) {
  const requirements = session.coverageRequirements.map((row) =>
    `- \`${row.requirementId}\`: domain \`${row.frameDomainId}\`, frames ${row.requiredRange.firstFrame}-${row.requiredRange.lastFrame}, trace \`${row.traceId}\`.`).join("\n");
  return `# G4 L3 TS006 ${language.toUpperCase()} Original-Runtime Session Kit\n\n`
    + `This immutable directory contains **blank templates only**. It does not authorize or launch Flash Player, and it is not runtime evidence. Copy completed records and all PNG/audio/request logs to the separately approved session evidence directory; do not edit this kit.\n\n`
    + `## Bound session\n\n- Animation: \`${ANIMATION_ID}\`\n- Language: \`${language}\`\n- Native stage: 800×600 at 12 FPS\n- Host: \`${input.hostTree.stagedRoot.path}/HELP_COURSES/ELMGR4/L3/index_local.swf\`\n- Direct seek: forbidden for primary evidence\n\n${requirements}\n\n`
    + `## Before any Projector launch\n\n`
    + `1. A real owner, containment approver, named operator, independent visual reviewer, and release custodian must be registered under an external owner-controlled trust root. Distinct-role rules still apply.\n`
    + `   The current user-stated designation names Dr. Peter Hu for all four assignments. That is sufficient only to identify the pending-candidate operator/Owner; it is not independent review and cannot satisfy the four-distinct-subject production trust root.\n`
    + `2. The owner has requested no additional macOS accounts. Copy and complete \`AUTHORIZATION.template.json\` outside this immutable directory; externally sign the current-account isolation exception and bind the exact host, named operator, approved CR-01–CR-08 mechanisms, disposable profile root, launch path, and stop conditions.\n`
    + `3. Copy and complete \`PREFLIGHT.template.json\` in the same session. Reverify Projector code signature/hash, the full read-only host tree, process and host no-egress controls, a new language-specific disposable HOME/CFFIXED_USER_HOME, denial of the real user Flash profile, an empty disposable SharedObject store, and at least ${input.capacity.capacityModel.minimumSafeFreeBytes} free bytes.\n`
    + `4. Abort if any field is absent, any hash differs, the disposable profile contains prior browser/Flash state, the real user Flash profile is accessed, an unexpected dialog appears, or any request/host effect escapes the deny policy.\n\n`
    + `## Human execution boundary\n\n`
    + `The named operator starts one fresh empty Adobe Flash Player Projector process and personally uses **File → Open File…** to select the exact staged \`index_local.swf\`. Do not pass an SWF on the command line, use Finder/LaunchServices, directly open L3TS06.swf, or use direct seek before a complete natural trace. Record the real process and GUI-open facts in a copied \`LAUNCH_RECEIPT.template.json\`.\n\n`
    + `Follow P00–P09 from the bound protocol. Capture every naturally reached 800×600 PNG losslessly, retain one-indexed root and nested domains separately, listen to and timestamp all audio, exercise Replay and Previous/Next, preserve the request/no-egress audit, and record the complete process exit.\n\n`
    + `Only after the real same-session observation may the named operator complete and externally sign a copied \`SESSION_ATTESTATION.template.json\`. Promotion remains fail-closed and separate.\n`;
}

function validateBlankTemplate(name, value) {
  invariant(value.status?.startsWith("blank-"), `${name} must remain blank`);
  invariant(value.signatureEnvelope === null || value.signatureEnvelope === undefined, `${name} signature must be empty`);
  if (name === "AUTHORIZATION.template.json") {
    invariant(value.owner?.fullName === null && value.operator?.fullName === null
      && value.independentVisualReviewer?.fullName === null && value.externalTrustRoot?.path === null
      && value.runtimeExecutionAuthorized === false && value.launchCommand === null,
    "authorization template was prefilled or executable");
  }
  if (name === "RUNTIME_OBSERVATION.template.json") {
    invariant(value.runtimeSessionExecuted === false && value.completeNaturalTraceObserved === false
      && value.pngFrames?.length === 0 && value.orderedStateHashChain?.length === 0,
    "runtime observation template contains execution evidence");
  }
}

function buildKit(language, input, inputBindings, generatorBinding) {
  const session = input.schedule.scheduleCandidate.sessions.find((candidate) => candidate.language === language);
  invariant(session && session.status === "technical-candidate-not-approved-not-executed"
    && session.coverageRequirements?.length === 2
    && session.eventScheduleAccepted === false
    && session.captureScheduleAccepted === false
    && session.naturalExecutionProved === false,
  `TS006 ${language} schedule candidate is not an empty two-requirement session`);
  const mechanisms = containmentMechanisms(input.hostTree, input.accountException);
  invariant(mechanisms.map(({controlId}) => controlId).join("|") === CONTROL_IDS.join("|"), "containment mechanism scope drifted");

  const templates = {
    "AUTHORIZATION.template.json": pretty(blankAuthorization(language, session, mechanisms, input.accountException)),
    "PREFLIGHT.template.json": pretty(blankPreflight(language, session, input)),
    "LAUNCH_RECEIPT.template.json": pretty(blankLaunchReceipt(language, session, input)),
    "RUNTIME_OBSERVATION.template.json": pretty(blankObservation(language, session)),
    "SESSION_ATTESTATION.template.json": pretty(blankAttestation(language, session)),
    "OPERATOR_CARD.md": operatorCard(language, session, input),
  };
  for (const [name, contents] of Object.entries(templates)) {
    if (name.endsWith(".json")) validateBlankTemplate(name, JSON.parse(contents));
  }
  const templateBindings = Object.fromEntries(Object.entries(templates).map(([name, contents]) => [name, {
    bytes: Buffer.byteLength(contents),
    sha256: sha256(contents),
    mode: "0444",
  }]));
  const manifestWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-original-runtime-empty-session-kit",
    generator: generatorBinding,
    animationId: ANIMATION_ID,
    releaseId: RELEASE_ID,
    language,
    status: "immutable-empty-template-awaiting-external-signatures-and-live-preflight",
    sourceBindings: inputBindings,
    sessionIdentity: {
      protocolTraceCandidateId: session.protocolTraceCandidateId,
      entryStateCandidateSha256: session.entryStateCandidateSha256,
      authoritativeTraceId: null,
      coverageRequirements: session.coverageRequirements,
      nativeStage: {width: 800, height: 600},
      fps: 12,
      directSeekPermitted: false,
      naturalHostEntryRequired: true,
    },
    runtime: {
      executable: input.runtime.installedRuntimeCandidate.executable,
      bundlePath: input.runtime.installedRuntimeCandidate.bundle.path,
      version: input.runtime.installedRuntimeCandidate.version,
      pointInTimeStrictSignaturePassed: true,
      reverifyImmediatelyBeforeSession: true,
    },
    runtimeHost: {
      root: input.hostTree.stagedRoot,
      manifestSha256: inputBindings.hostTreeManifest.sha256,
      fileSetSha256: input.hostTree.fileSetSha256,
      shell: {
        path: `${input.hostTree.stagedRoot.path}/HELP_COURSES/ELMGR4/L3/index_local.swf`,
        bytes: input.shell.bytes,
        sha256: input.shell.sha256,
        mode: "0444",
      },
    },
    containmentMechanismCandidates: mechanisms,
    accountIsolationCandidate: {
      mode: input.accountException.localExecutionContext.candidateIsolationMode,
      accountIdentifier: input.accountException.localExecutionContext.accountIdentifier,
      accountClass: input.accountException.localExecutionContext.accountClass,
      additionalMacosAccountsRequired: false,
      separateDisposableProfilesRequired: true,
      exceptionIntakeSha256: inputBindings.accountExceptionIntake.sha256,
    },
    humanRoleDesignationCandidate: {
      displayName: input.roleDesignation.person.displayName,
      requestedAssignments: input.roleDesignation.requestedAssignments,
      distinctNamedHumans: 1,
      externalSubjectId: null,
      publicKeyFingerprintSha256: null,
      cryptographicSignatureBound: false,
      pendingCandidateOperationEligibleAfterLiveContainmentPreflight: true,
      independentVisualReviewSatisfied: false,
      productionTrustRootEligible: false,
      strictAcceptanceEligible: false,
    },
    templateDocumentBindings: templateBindings,
    executionGate: {
      userAuthorizationIntentRecorded: true,
      currentAdminAccountExceptionIntentRecorded: true,
      externalTrustRootBound: false,
      ownerSignatureBound: false,
      containmentApprovalSignaturesBound: false,
      namedOperatorBound: false,
      independentVisualReviewerBound: false,
      releaseCustodianBound: false,
      freshMacosAccountBound: false,
      disposableProcessProfileBound: false,
      authorizedHostIdentityBound: false,
      liveCapacityPreflightPassed: false,
      noEgressVerified: false,
      emptySharedObjectStoreVerified: false,
      launchCommandPresent: false,
      runtimeSessionExecuted: false,
      originalRuntimeExecutionReady: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  const manifest = {
    ...manifestWithoutFingerprint,
    kitFingerprintSha256: sha256(Buffer.from(stable(manifestWithoutFingerprint))),
  };
  return {
    language,
    files: {...templates, "kit-manifest.json": pretty(manifest)},
    manifest,
  };
}

export function validateTs006SessionKitManifest(manifest, {allowSupersededAccountIsolationVersion = false} = {}) {
  invariant(manifest.schemaVersion === 1
    && manifest.evidenceType === "g4-l3-ts006-original-runtime-empty-session-kit"
    && manifest.animationId === ANIMATION_ID
    && LANGUAGES.includes(manifest.language)
    && manifest.status === "immutable-empty-template-awaiting-external-signatures-and-live-preflight",
  "TS006 session kit identity drifted");
  invariant(manifest.sessionIdentity?.coverageRequirements?.length === 2
    && manifest.sessionIdentity?.authoritativeTraceId === null
    && manifest.sessionIdentity?.directSeekPermitted === false
    && manifest.sessionIdentity?.naturalHostEntryRequired === true,
  "TS006 session kit capture identity drifted");
  invariant(manifest.containmentMechanismCandidates?.map(({controlId}) => controlId).join("|") === CONTROL_IDS.join("|"),
    "TS006 session kit containment scope drifted");
  const currentUnpromotedGate = Object.values(manifest.executionGate ?? {}).filter(Boolean).length === 2
    && manifest.executionGate.userAuthorizationIntentRecorded === true
    && manifest.executionGate.currentAdminAccountExceptionIntentRecorded === true
    && manifest.executionGate.originalRuntimeExecutionReady === false;
  const supersededUnpromotedGate = allowSupersededAccountIsolationVersion
    && manifest.accountIsolationCandidate === undefined
    && Object.values(manifest.executionGate ?? {}).filter(Boolean).length === 1
    && manifest.executionGate.userAuthorizationIntentRecorded === true
    && manifest.executionGate.originalRuntimeExecutionReady === false;
  invariant(currentUnpromotedGate || supersededUnpromotedGate,
  "TS006 session kit execution gate was promoted");
  invariant(Object.entries(manifest.acceptance ?? {}).every(([key, value]) => key === "acceptanceNeutral" ? value === true : value === false),
    "TS006 session kit acceptance was promoted");
  const {kitFingerprintSha256, ...withoutFingerprint} = manifest;
  invariant(HASH.test(kitFingerprintSha256)
    && kitFingerprintSha256 === sha256(Buffer.from(stable(withoutFingerprint))),
  "TS006 session kit fingerprint drifted");
  return manifest;
}

async function readInputs(root) {
  const entries = await Promise.all(Object.entries(INPUTS).map(async ([key, file]) => [key, await bindRegularFile(root, file)]));
  const bindings = Object.fromEntries(entries);
  const generatorBinding = await bindRegularFile(root, portable(path.relative(root, SCRIPT_PATH)), {json: false});
  const input = validateInputs(bindings);
  const hostFileRelative = `${input.hostTree.stagedRoot.path}/HELP_COURSES/ELMGR4/L3/index_local.swf`;
  const physicalShell = await bindRegularFile(root, hostFileRelative, {json: false});
  invariant(physicalShell.bytes === input.shell.bytes && physicalShell.sha256 === input.shell.sha256,
    "physical staged TS006 lesson shell differs from its read-only host-tree manifest");
  return {
    input,
    inputBindings: Object.fromEntries(Object.entries(bindings).map(([key, binding]) => [key, publicBinding(binding)])),
    generatorBinding: publicBinding(generatorBinding),
  };
}

export async function buildTs006SessionKitPlan({root = ROOT} = {}) {
  const current = await readInputs(root);
  const kits = LANGUAGES.map((language) => buildKit(language, current.input, current.inputBindings, current.generatorBinding));
  invariant(new Set(kits.flatMap(({manifest}) => manifest.sessionIdentity.coverageRequirements.map(({requirementId}) => requirementId))).size === 4,
    "TS006 EN/ES kits do not partition the four coverage requirements");
  return {...current, kits};
}

async function listTree(root) {
  const output = [];
  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const candidate = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `session kit contains symbolic link: ${relative}`);
      if (entry.isDirectory()) await visit(candidate, relative);
      else {
        invariant(entry.isFile(), `session kit contains non-file entry: ${relative}`);
        output.push(relative);
      }
    }
  }
  await visit(root);
  return output;
}

async function verifyKitTree(outputRoot, kits) {
  const expectedPaths = kits.flatMap(({language, files}) => Object.keys(files).map((name) => `${language}/${name}`)).sort();
  const actualPaths = (await listTree(outputRoot)).sort();
  invariant(stable(actualPaths) === stable(expectedPaths), "TS006 session kit tree contains missing or unexpected files");
  const manifests = [];
  for (const kit of kits) {
    const languageRoot = path.join(outputRoot, kit.language);
    const languageMetadata = await lstat(languageRoot);
    invariant(languageMetadata.isDirectory() && !languageMetadata.isSymbolicLink() && (languageMetadata.mode & 0o777) === 0o555,
      `${kit.language} session kit directory must be immutable 0555`);
    for (const [name, expected] of Object.entries(kit.files)) {
      const target = path.join(languageRoot, name);
      const metadata = await lstat(target);
      invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1 && (metadata.mode & 0o777) === 0o444,
        `${kit.language}/${name} must be an immutable 0444 regular file`);
      const bytes = await readFile(target);
      invariant(bytes.equals(Buffer.from(expected)), `${kit.language}/${name} is stale`);
    }
    const manifestBytes = await readFile(path.join(languageRoot, "kit-manifest.json"));
    const manifest = validateTs006SessionKitManifest(JSON.parse(manifestBytes));
    for (const [name, binding] of Object.entries(manifest.templateDocumentBindings)) {
      const bytes = await readFile(path.join(languageRoot, name));
      invariant(bytes.length === binding.bytes && sha256(bytes) === binding.sha256, `${kit.language}/${name} binding drifted`);
      if (name.endsWith(".json")) validateBlankTemplate(name, JSON.parse(bytes));
    }
    manifests.push({
      language: kit.language,
      path: portable(path.relative(ROOT, path.join(languageRoot, "kit-manifest.json"))),
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes),
      kitFingerprintSha256: manifest.kitFingerprintSha256,
    });
  }
  return manifests;
}

async function verifyArchivedEmptyTemplate(root) {
  const paths = await listTree(root);
  invariant(paths.every((file) => /^(en|es)\/(kit-manifest\.json|AUTHORIZATION\.template\.json|PREFLIGHT\.template\.json|LAUNCH_RECEIPT\.template\.json|RUNTIME_OBSERVATION\.template\.json|SESSION_ATTESTATION\.template\.json|OPERATOR_CARD\.md)$/u.test(file)),
    "refusing to refresh a session-kit tree containing non-template session artifacts");
  for (const language of LANGUAGES) {
    const manifestPath = path.join(root, language, "kit-manifest.json");
    const manifest = validateTs006SessionKitManifest(JSON.parse(await readFile(manifestPath)), {
      allowSupersededAccountIsolationVersion: true,
    });
    for (const [name, binding] of Object.entries(manifest.templateDocumentBindings)) {
      const bytes = await readFile(path.join(root, language, name));
      invariant(bytes.length === binding.bytes && sha256(bytes) === binding.sha256,
        `refusing to refresh modified template ${language}/${name}`);
      if (name.endsWith(".json")) validateBlankTemplate(name, JSON.parse(bytes));
    }
  }
}

async function writeTemporaryTree(projectRoot, kits) {
  const workRoot = absolute(projectRoot, "work");
  await mkdir(workRoot, {recursive: true});
  const workReal = await realpath(workRoot);
  const projectReal = await realpath(projectRoot);
  invariant(workReal.startsWith(`${projectReal}${path.sep}`), "work root escapes project root");
  const temporary = await mkdtemp(path.join(workRoot, ".g4-l3-ts006-session-kits-"));
  for (const kit of kits) {
    const languageRoot = path.join(temporary, kit.language);
    await mkdir(languageRoot, {mode: 0o755});
    for (const [name, contents] of Object.entries(kit.files)) {
      const target = path.join(languageRoot, name);
      await writeFile(target, contents, {flag: "wx", mode: 0o600});
      await chmod(target, 0o444);
    }
    await chmod(languageRoot, 0o555);
  }
  return temporary;
}

function buildReport(plan, manifestBindings) {
  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-original-runtime-session-kit-readiness",
    generator: plan.generatorBinding,
    sourceBindings: plan.inputBindings,
    scope: {
      releaseId: RELEASE_ID,
      animationId: ANIMATION_ID,
      languages: [...LANGUAGES],
      sessionKits: 2,
      coverageRequirements: 4,
      nativeStage: {width: 800, height: 600},
      fps: 12,
    },
    kitManifests: manifestBindings,
    readiness: {
      userAuthorizationIntentRecorded: true,
      currentAdminAccountExceptionIntentRecorded: true,
      immutableEmptySessionKitsPrepared: true,
      readOnlyHostTreePrepared: true,
      projectorCandidateHashBound: true,
      containmentMechanismCandidatesSpecified: 8,
      namedOwnerIdentityBound: false,
      userStatedOwnerNameRecorded: true,
      externalOwnerSignatureBound: false,
      externalTrustRootBound: false,
      namedOperatorsBound: 0,
      userStatedOperatorNameRecorded: true,
      requestedRoleAssignments: 4,
      distinctNamedHumansRecorded: 1,
      independentRoleSeparationSatisfied: false,
      freshMacosAccountsBound: 0,
      additionalMacosAccountsRequired: 0,
      disposableProcessProfilesBound: 0,
      independentVisualReviewerBound: false,
      releaseCustodianBound: false,
      livePreflightsPassed: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinesEstablished: 0,
      originalRuntimeExecutionReady: false,
      state: "kits-prepared-single-person-pending-candidate-path-awaiting-signatures-independent-roles-and-live-preflight",
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  return {
    ...reportWithoutFingerprint,
    reportFingerprintSha256: sha256(Buffer.from(stable(reportWithoutFingerprint))),
  };
}

export function validateTs006SessionKitReadiness(report) {
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-ts006-original-runtime-session-kit-readiness"
    && report.scope?.animationId === ANIMATION_ID
    && report.scope?.sessionKits === 2
    && report.scope?.coverageRequirements === 4
    && report.kitManifests?.map(({language}) => language).join("|") === "en|es",
  "TS006 session-kit readiness scope drifted");
  invariant(report.readiness?.userAuthorizationIntentRecorded === true
    && report.readiness?.currentAdminAccountExceptionIntentRecorded === true
    && report.readiness?.userStatedOwnerNameRecorded === true
    && report.readiness?.userStatedOperatorNameRecorded === true
    && report.readiness?.requestedRoleAssignments === 4
    && report.readiness?.distinctNamedHumansRecorded === 1
    && report.readiness?.independentRoleSeparationSatisfied === false
    && report.readiness?.immutableEmptySessionKitsPrepared === true
    && report.readiness?.namedOperatorsBound === 0
    && report.readiness?.freshMacosAccountsBound === 0
    && report.readiness?.additionalMacosAccountsRequired === 0
    && report.readiness?.disposableProcessProfilesBound === 0
    && report.readiness?.runtimeSessionsExecuted === 0
    && report.readiness?.originalRuntimeExecutionReady === false,
  "TS006 session-kit readiness was improperly promoted");
  invariant(Object.entries(report.acceptance ?? {}).every(([key, value]) => key === "acceptanceNeutral" ? value === true : value === false),
    "TS006 session-kit readiness acceptance was promoted");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(HASH.test(reportFingerprintSha256)
    && reportFingerprintSha256 === sha256(Buffer.from(stable(withoutFingerprint))),
  "TS006 session-kit readiness fingerprint drifted");
  return report;
}

export function renderMarkdown(report) {
  validateTs006SessionKitReadiness(report);
  const rows = report.kitManifests.map((item) =>
    `| ${item.language} | \`${item.path}\` | \`${item.sha256}\` | empty / immutable / not executed |`).join("\n");
  return `# G4 L3 TS006 Original-Runtime Session Kit Readiness\n\n`
    + `The user supplied an authorization statement and then explicitly requested use of the current administrator account without creating additional macOS accounts. This report records both intents separately from the still-missing external identities and cryptographic signatures.\n\n`
    + `## Prepared kits\n\n| Language | Manifest | SHA-256 | State |\n|---|---|---|---|\n${rows}\n\n`
    + `Both kits bind the four TS006 natural-trace requirements, the 657-file read-only host tree, Adobe Flash Player Projector 32.0.0.414, the P00–P09 protocol, eight containment mechanism candidates, and blank authorization/preflight/launch/observation/attestation templates. They contain no launch command and launch nothing.\n\n`
    + `## Account-isolation decision\n\nNo new macOS account is required or created. EN and ES remain separate sessions under the current administrator account, each requiring a new disposable process profile with independent HOME/CFFIXED_USER_HOME, empty Flash/SharedObject state, denial of the real user Flash profile, and complete postflight disposal. This owner-requested exception does not waive any other containment or acceptance gate.\n\n`
    + `## Human-role designation\n\nDr. Peter Hu is user-designated for the EN/ES operator, registry authority, visual reviewer, Owner/authorized representative, and release-custodian assignments. This records one named human and zero externally signed subjects. It supports only the pending-candidate operator/Owner path after live containment preflight; self-review is not independent review, and one person cannot satisfy the production trust root's four-distinct-subject invariant.\n\n`
    + `## Remaining live gate\n\nNamed owner identity, external owner signature for the account-isolation exception, external trust root, named EN/ES operators, two verified disposable process profiles, an authorized host identity, independent visual reviewer, release custodian, live no-egress/SharedObject/capacity preflights, and same-session signatures remain required. Original-runtime execution readiness is **false**.\n\n`
    + `## Acceptance boundary\n\nNo runtime session, baseline, audio review, visual review, owner acceptance, strict completion, or publication is established.\n`;
}

async function atomicWrite(filePath, contents) {
  const parent = path.dirname(filePath);
  await mkdir(parent, {recursive: true});
  const parentReal = await realpath(parent);
  const rootReal = await realpath(ROOT);
  invariant(parentReal.startsWith(`${rootReal}${path.sep}`), "report output parent escapes project root");
  const metadata = await lstat(filePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || (metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1), "report output must be a regular non-linked file");
  const temporary = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporary, contents, {flag: "wx"});
  await rename(temporary, filePath);
}

export async function prepareTs006SessionKits({root = ROOT, check = false, refreshEmptyTemplates = false} = {}) {
  invariant(!(check && refreshEmptyTemplates), "--check and --refresh-empty-templates are mutually exclusive");
  const plan = await buildTs006SessionKitPlan({root});
  const outputRoot = absolute(root, OUTPUT_RELATIVE);
  const existing = await lstat(outputRoot).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  let archived = null;
  let changed = 0;
  if (existing) {
    invariant(existing.isDirectory() && !existing.isSymbolicLink(), "TS006 session-kit output root must be a real directory");
    try {
      const manifestBindings = await verifyKitTree(outputRoot, plan.kits);
      const report = validateTs006SessionKitReadiness(buildReport(plan, manifestBindings));
      const json = pretty(report);
      const markdown = renderMarkdown(report);
      if (check) {
        invariant(await readFile(absolute(root, REPORT_JSON), "utf8") === json, `${REPORT_JSON} is stale`);
        invariant(await readFile(absolute(root, REPORT_MARKDOWN), "utf8") === markdown, `${REPORT_MARKDOWN} is stale`);
      } else {
        await atomicWrite(absolute(root, REPORT_JSON), json);
        await atomicWrite(absolute(root, REPORT_MARKDOWN), markdown);
      }
      return {action: check ? "verified" : "current", changed, archived, report};
    } catch (error) {
      if (!refreshEmptyTemplates) throw error;
      await verifyArchivedEmptyTemplate(outputRoot);
      const archiveDigest = sha256(Buffer.from((await Promise.all(LANGUAGES.map((language) =>
        readFile(path.join(outputRoot, language, "kit-manifest.json"))))).map((bytes) => sha256(bytes)).join("\n")));
      archived = `${outputRoot}.superseded-${archiveDigest.slice(0, 16)}`;
      invariant(!(await lstat(archived).catch((failure) => failure.code === "ENOENT" ? null : Promise.reject(failure))),
        "refusing to overwrite a preserved superseded session-kit tree");
      await rename(outputRoot, archived);
    }
  } else invariant(!check, "TS006 session kits are missing");

  const temporary = await writeTemporaryTree(root, plan.kits);
  try {
    await rename(temporary, outputRoot);
    changed = 2;
  } catch (error) {
    if (archived) await rename(archived, outputRoot).catch(() => {});
    throw error;
  }
  const manifestBindings = await verifyKitTree(outputRoot, plan.kits);
  const report = validateTs006SessionKitReadiness(buildReport(plan, manifestBindings));
  await atomicWrite(absolute(root, REPORT_JSON), pretty(report));
  await atomicWrite(absolute(root, REPORT_MARKDOWN), renderMarkdown(report));
  return {action: archived ? "refreshed" : "written", changed, archived: archived ? portable(path.relative(root, archived)) : null, report};
}

export function parseArguments(argv) {
  const options = {check: false, refreshEmptyTemplates: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--refresh-empty-templates") options.refreshEmptyTemplates = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.check && options.refreshEmptyTemplates), "--check and --refresh-empty-templates are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/prepare-g4-l3-ts006-original-runtime-session-kits.mjs [--check | --refresh-empty-templates]",
    "",
    "Creates only immutable, ignored EN/ES empty session templates and an acceptance-neutral readiness report.",
    "It never creates accounts, launches Projector, fills a human identity, signs, captures, promotes, or publishes.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await prepareTs006SessionKits(options);
  process.stdout.write(`${result.action}: 2 immutable TS006 EN/ES empty session kits; 4 requirements; 0 signatures; 0 runtime sessions; acceptance effect none.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
