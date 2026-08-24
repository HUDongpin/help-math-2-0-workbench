#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {validateContract as validateV11Contract} from
  "./build-g4-l10-complete-migration-template-contract-v11.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v12.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v12.test.mjs";

const TARGET_SHA256 =
  "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510";
const V216_FINDINGS = Object.freeze([
  "P0 V215-REVIEW-SET-OWNERSHIP-AND-RECEIPT-REPLAY-UNBOUND",
  "P0 V215-PARSED-INPUT-SNAPSHOT-TOCTOU-UNBOUND",
  "P1 V215-CANONICAL-ABSOLUTE-ROOT-IDENTITY-UNBOUND",
  "P1 V215-ERROR-TAXONOMY-AND-FAILED-RECEIPT-PRESERVATION-DIVERGE",
]);

const EXPECTED_INPUTS = Object.freeze({
  v11Contract: {
    path: "reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.json",
    bytes: 265795,
    sha256: "2fbef8bdbc210b6a4d245f4515438d53039de0aeacc6ef8982711643d5909eba",
    mode: "0444",
  },
  v11Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.md",
    bytes: 1155,
    sha256: "0b42a1569c693bcc86f1b0c75027f37ee3f0d622d2490be3189cb09c7f33a968",
    mode: "0444",
  },
  v11Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v11.mjs",
    bytes: 21319,
    sha256: "47e7f7e1ca6be501247bcc4a06b855caec3b2cd1d2335de61583d80d5615aa4d",
    mode: "0644",
  },
  v11Test: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v11.test.mjs",
    bytes: 4227,
    sha256: "d59dd27b6b12b0059e5c18e88b547e91211b4d4b76046566881fb4af33c46be7",
    mode: "0644",
  },
  frozenTarget: {
    path: "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    bytes: 50310,
    sha256: TARGET_SHA256,
    mode: "0444",
  },
  reviewProtocolV215: {
    path: "docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md",
    bytes: 9873,
    sha256: "2f3161f93209b8ec5ba87d36cd11557fee8790087af60984ca9eefc9923caea7",
    mode: "0644",
  },
  deterministicVerifierV215: {
    path: "scripts/g4-l10-native-helper-v2_15-review-verifier.mjs",
    bytes: 37369,
    sha256: "99e6ec770a74e3a344ddd4138718bc8a04c5032314dc7402b1cd3b937d716b70",
    mode: "0644",
  },
  deterministicVerifierTestV215: {
    path: "scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs",
    bytes: 9301,
    sha256: "363783b17bcc04556e7121721f6115b8d87ed196a82e51537be3dd3733faf88b",
    mode: "0644",
  },
  reviewProtocolV216: {
    path: "docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md",
    bytes: 18042,
    sha256: "64077e18264236f10c77414f049c00b585a3d7258a9a3c324ec616c399695736",
    mode: "0644",
  },
  deterministicVerifierV216: {
    path: "scripts/g4-l10-native-helper-v2_16-review-verifier.mjs",
    bytes: 67368,
    sha256: "5ce0a5876ec86ffb9facef5c629c47634bcc43c1bb566a52bf319aee2e4b37a9",
    mode: "0644",
  },
  deterministicVerifierTestV216: {
    path: "scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs",
    bytes: 15783,
    sha256: "194f375333a7f9925349d39b3f268eb1c02297f16fde867389bae53b1376fd35",
    mode: "0644",
  },
  strictV214HistoryClosure: {
    path: "reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json",
    bytes: 6187,
    sha256: "67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1",
    mode: "0644",
  },
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalize(value[key])]));
  }
  return value;
}

function reportFingerprint(report) {
  const {reportFingerprintSha256: ignored, ...payload} = report;
  return sha256(Buffer.from(JSON.stringify(canonicalize(payload)), "utf8"));
}

function modeString(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs,
    stat.mode, stat.nlink].map(String).join(":");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, relativePath) {
  assert.ok(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath));
  const absolute = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, absolute));
  assert.ok(relative && !relative.startsWith("../") &&
    !path.isAbsolute(relative), `${relativePath} escapes the project root`);
  return absolute;
}

async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

async function readStable(root, label, expected) {
  const rootReal = await canonicalRoot(root);
  const absolute = resolveInside(root, expected.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${label} is not an ordinary non-symlink file`);
  const resolved = await realpath(absolute);
  assert.ok(resolved.startsWith(`${rootReal}${path.sep}`),
    `${label} resolves outside the project root`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${label} changed during the snapshot`);
  const descriptor = {
    path: expected.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
  };
  assert.deepEqual(descriptor, expected, `${label} descriptor drifted`);
  return {descriptor, bytes, statIdentity: statIdentity(after)};
}

function parseJson(input, label) {
  try {
    return JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function assertV216Protocol(protocolText) {
  const required = [
    "Status: authored review-infrastructure successor awaiting a separate, current, user-authenticated authorization",
    "No HMG4RB4 or HMG4RB successor may be created.",
    "No reviewer task is created by authoring this successor.",
    "No Phase A or Phase B command is authorized by authoring or testing it.",
    "Every future v2.16 review requires a new user-authenticated instruction authorizing exactly three fresh, distinct, user-owned Codex tasks",
    "There is no same-review-set Phase B retry.",
    "The sixteen Grade 4 missing MP3s remain unresolved.",
    "Peter Hu's named original-runtime operator status remains inactive.",
    ...V216_FINDINGS,
  ];
  for (const marker of required) {
    assert.ok(protocolText.includes(marker),
      `v2.16 protocol marker missing: ${marker}`);
  }
}

function assertHistoryClosure(history) {
  assert.equal(history.artifactType,
    "g4-l10-native-helper-v2-14-strict-history-closure");
  assert.equal(history.status, "STRICT_BUT_NONQUALIFYING_CLOSED");
  assert.deepEqual(history.summary, {
    artifactCount: 17,
    targetCount: 1,
    activationReceiptCount: 4,
    failedBatchReceiptCount: 6,
    chunkPlanCount: 6,
    qualifyingReviewCount: 0,
  });
  assert.equal(history.failedHMG4RB4.length, 6);
  assert.equal(history.rules.newHMG4RB4BatchesAllowed, false);
  assert.equal(history.rules.historicalTaskOrOutputReuseAllowed, false);
  assert.equal(history.rules.implementationAuthority, false);
  assert.equal(history.rules.runtimeAuthority, false);
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const inputs = {};
  const records = [];
  for (const [key, expected] of Object.entries(EXPECTED_INPUTS)) {
    const record = await readStable(root, key, expected);
    inputs[key] = record;
    records.push(record);
  }
  const identities = {};
  for (const [key, relativePath] of Object.entries({
    generator: GENERATOR_PATH,
    test: TEST_PATH,
  })) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute, {bigint: true});
    const expected = {
      path: relativePath,
      bytes: Number(stat.size),
      sha256: sha256(await readFile(absolute)),
      mode: modeString(stat),
    };
    const record = await readStable(root, key, expected);
    identities[key] = record;
    records.push(record);
  }
  return {projectRoot: root, inputs, identities, records};
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const current = await lstat(resolveInside(snapshot.projectRoot,
      record.descriptor.path), {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.descriptor.path} changed after the snapshot`);
  }
}

function replaceOriginalRuntimeGate(gates) {
  return gates.map((gate) => {
    if (gate.id !== "original-runtime-baseline") return gate;
    return {
      ...gate,
      status: "BLOCKED-V216-INDEPENDENT-REVIEW-NOT-AUTHORIZED-NOT-STARTED",
      satisfied: false,
      current: {
        ...gate.current,
        activeReviewProtocol: "v2.16",
        v216AuthoringComplete: true,
        v216IndependentReviewAuthorized: false,
        v216ReviewSetManifestBound: false,
        v216FreshUserOwnedTaskCount: 0,
        v216PhaseAPreflightReceiptCount: 0,
        v216ReadyForFormalEvidenceReceiptCount: 0,
        v216PhaseBEvidenceReceiptCount: 0,
        v216HumanConclusionCount: 0,
        v216IndependentFindingCounts: {
          p0: null,
          p1: null,
          p2: null,
          disposition: "UNEVALUATED_NOT_ZERO",
        },
        v216SpecReviewQualified: false,
        productionHelperIndependentlyApproved: false,
        operatorActivated: false,
        operatorReady: false,
        freshCheckedLaunchReceiptForCurrentStart: false,
      },
      blocker: "V2.16 review infrastructure is authored but no new user-owned reviewer tasks, authenticated review-set manifest, Phase A receipts, Phase B evidence, or independent conclusions exist. P0/P1/P2 are UNEVALUATED, not zero. Production helper, operator activation, disposable-offline start, per-start launch receipt, and original-runtime authority remain closed.",
      acceptanceEffect: "none",
    };
  });
}

export function deriveContract(snapshot) {
  const v11 = parseJson(snapshot.inputs.v11Contract, "v11Contract");
  const history = parseJson(snapshot.inputs.strictV214HistoryClosure,
    "strictV214HistoryClosure");
  const protocolText = snapshot.inputs.reviewProtocolV216.bytes.toString("utf8");
  validateV11Contract(v11);
  assertV216Protocol(protocolText);
  assertHistoryClosure(history);

  const inputBindings = Object.fromEntries(Object.entries(snapshot.inputs)
    .map(([key, value]) => [key, value.descriptor]));
  const report = {
    ...v11,
    schemaVersion: 12,
    reportType: "g4-l10-complete-migration-template-contract-v12",
    evidenceDate: "2026-08-07",
    status: "fail-closed-template-not-stable",
    templateStable: false,
    successorOf: snapshot.inputs.v11Contract.descriptor,
    gates: replaceOriginalRuntimeGate(v11.gates),
    latestSecurityReviewBoundary: {
      protocolStatus: "authored-unreviewed-review-infrastructure-successor",
      activeProtocolVersion: "v2.16",
      target: snapshot.inputs.frozenTarget.descriptor,
      protocol: snapshot.inputs.reviewProtocolV216.descriptor,
      deterministicVerifier:
        snapshot.inputs.deterministicVerifierV216.descriptor,
      deterministicVerifierTest:
        snapshot.inputs.deterministicVerifierTestV216.descriptor,
      predecessorReviewInfrastructure: {
        protocol: snapshot.inputs.reviewProtocolV215.descriptor,
        deterministicVerifier:
          snapshot.inputs.deterministicVerifierV215.descriptor,
        deterministicVerifierTest:
          snapshot.inputs.deterministicVerifierTestV215.descriptor,
        disposition: "preserved-superseded-by-v2.16-authoring-no-review-result",
      },
      closedHistory:
        snapshot.inputs.strictV214HistoryClosure.descriptor,
      closedHistoryStatus: history.status,
      closedHistoryArtifactCount: history.summary.artifactCount,
      closedHistoryQualifyingReviewCount:
        history.summary.qualifyingReviewCount,
      v216AuthoringStatus:
        "AUTHORING_COMPLETE_INDEPENDENT_REVIEW_NOT_STARTED",
      addressedV215Findings: [...V216_FINDINGS],
      addressedFindingDesignClaimsIndependentlyReviewed: false,
      addressedFindingClosureClaim: false,
      requiredScopes: ["schema", "adversarial", "whole"],
      reviewSetManifestBound: false,
      reviewSetManifestCreationAuthorizedByThisArtifact: false,
      freshUserOwnedReviewerTaskCountBound: 0,
      phaseAPreflightReceiptCountBound: 0,
      readyForFormalEvidenceReceiptCountBound: 0,
      phaseBEvidenceReceiptCountBound: 0,
      reviewerHumanConclusionCountBound: 0,
      qualifyingReviewerConclusionCountBound: 0,
      independentFindingCounts: {
        p0: null,
        p1: null,
        p2: null,
        disposition: "UNEVALUATED_NOT_ZERO",
      },
      reviewerFindingUnionEvaluated: false,
      specReviewQualified: false,
      newHMG4RB4Allowed: false,
      hmg4rbSuccessorTokenExists: false,
      historicalTaskOutputReceiptCommandOrConclusionReuseAllowed: false,
      deterministicInputStructureReadyForFutureAuthorizedReviewerPreflight:
        true,
      userOwnedTaskCreationAuthorizedByThisArtifact: false,
      formalPhaseAOrPhaseBInvocationAuthorizedByThisArtifact: false,
      authenticatedReviewerExecutionPerformedByThisArtifact: false,
      productionHelperImplementationEligible: false,
      productionHelperImplementationAuthorized: false,
      productionHelperTestAuthorized: false,
      protectedInstallationAuthorized: false,
      helperExecutionAuthorized: false,
      originalRuntimeLaunchAuthorized: false,
      acceptanceEffect: "none",
    },
    downstreamTransactionBoundary: {
      ...v11.downstreamTransactionBoundary,
      decision: "DO_NOT_APPLY",
      durableAppliedReceiptPresent: false,
      applyAuthorized: false,
      nativeHelperV2SecurityDesign: {
        ...v11.downstreamTransactionBoundary.nativeHelperV2SecurityDesign,
        status:
          "v2.16-review-infrastructure-authored-unreviewed-no-implementation-or-runtime-authority",
        exactContractBound: true,
        exactContractSha256: TARGET_SHA256,
        reviewProtocolV216: snapshot.inputs.reviewProtocolV216.descriptor,
        deterministicVerifierV216:
          snapshot.inputs.deterministicVerifierV216.descriptor,
        deterministicVerifierTestV216:
          snapshot.inputs.deterministicVerifierTestV216.descriptor,
        freshUserOwnedReviewBatchAuthorized: false,
        reviewSetManifestBound: false,
        specReviewQualified: false,
        authenticatedPostReviewAuthorizationPresent: false,
        implementationSourceBound: false,
        helperBinaryBound: false,
        protectedInstallReceiptBound: false,
        p0ClosureEffect: false,
        originalRuntimeAuthority: false,
        productionHelperImplementationEligible: false,
        acceptanceEffect: "none",
        rule: "The exact v2.16 protocol, verifier, and focused test are authoring outputs only. No reviewer tasks, formal evidence, independent P0/P1/P2 conclusions, helper implementation, protected installation, helper execution, downstream transaction, or original-runtime launch is authorized.",
      },
    },
    operatorGateSuccessor: {
      ...v11.operatorGateSuccessor,
      status: "conditional-designation-recorded-v216-unreviewed-not-activated-not-operator-ready",
      decision: "DO_NOT_LAUNCH",
      currentSecurityGates: {
        ...v11.operatorGateSuccessor.currentSecurityGates,
        v216ReviewInfrastructureAuthored: true,
        v216IndependentReviewP0P1P2Zero: false,
        v216ReviewSetManifestBound: false,
        v216FreshUserOwnedReviewerTasksCreated: false,
        productionHelperIndependentReviewP0P1P2Zero: false,
        currentLaunchReceiptGeneratedAndChecked: false,
      },
      activationEligible: false,
      runtimeAuthority: false,
    },
    automationBoundary: {
      status:
        "HALT-BEFORE-V216-INDEPENDENT-REVIEW-PRODUCTION-HELPER-ORIGINAL-RUNTIME-AND-TRANSACTION",
      templateBatchAdmissionAllowed: false,
      remainingGrade4LessonBatchStartAllowed: false,
      wholeCourseIntegrationAllowed: false,
      safeReadOnlyActions: [
        "re-run this v12 contract with --check",
        "inspect the exact v2.16 protocol, verifier, focused test, and v12 bindings without invoking formal review modes",
        "preserve the frozen v7/v8 union and SHA-256-only Grade 4 runtime dependency plans",
        "continue acceptance-neutral L10 source-static audit work outside prohibited transactions",
        "after a separate current user authorization, create exactly three fresh user-owned v2.16 reviewer tasks in schema, adversarial, whole order",
      ],
      prohibitedActions: [
        "create any HMG4RB4 or HMG4RB successor",
        "create reviewer tasks or a review-set manifest from this artifact",
        "run v2.16 Phase A or Phase B from this artifact",
        "reuse any old task ID, output, receipt, command, or reviewer conclusion",
        "infer P0/P1/P2 zero or spec-review-qualified from authoring or focused tests",
        "implement or test a production helper",
        "perform protected installation or helper execution",
        "launch Adobe Animate, Projector, or another original runtime",
        "apply, recover, refresh, adopt, register, complete, integrate, promote, release, or publish",
        "treat Peter Hu's conditional designation as operator activation or launch authority",
        "treat Ruffle or current-JavaScript diagnostics as original-runtime evidence",
      ],
    },
    nextNamedHumanAction: {
      role: "Project owner / Peter Hu",
      conditionallyDesignated: true,
      currentlyAuthorized: false,
      operatorActivated: false,
      reviewTaskCreationAuthorizedByThisArtifact: false,
      reviewSetManifestBound: false,
      phaseAOrPhaseBAuthorizedByThisArtifact: false,
      requiresFreshCheckedLaunchReceiptForEveryStart: true,
      action: "If the owner chooses to continue security review, issue a separate current authorization for exactly three fresh user-owned v2.16 tasks in schema, adversarial, whole order. Only after task creation may a new authenticated review-set manifest be frozen and delivered. No current action permits a runtime start.",
      reason: "V2.16 authoring and focused tests are not independent review. P0/P1/P2 remain UNEVALUATED, spec-review-qualified is false, production helper and operator activation are closed, and the sixteen Grade 4 MP3 dependencies remain unresolved.",
      cannotBeAutomated: true,
    },
    authorityBoundary: {
      ...v11.authorityBoundary,
      readOnlyRecomputation: true,
      createsReviewSetManifest: false,
      createsReviewPreflightReceipt: false,
      createsReviewerEvidenceReceipt: false,
      createsReviewerConclusion: false,
      createsRuntimeEvidence: false,
      createsRenderer: false,
      mayCreateUserOwnedTask: false,
      mayRunPhaseAOrPhaseB: false,
      mayImplementOrTestProductionHelper: false,
      mayPerformProtectedInstallation: false,
      mayExecuteHelper: false,
      mayLaunchOriginalRuntime: false,
      mayApplyDownstreamTransaction: false,
      mayRecoverDownstreamTransaction: false,
      mayRefreshOrAdoptEvidence: false,
      mayRegisterRenderer: false,
      mayMarkAcceptanceOrCompletion: false,
      mayPromoteSource: false,
      mayIntegrateOrPublish: false,
    },
    inputBindings: {
      ...v11.inputBindings,
      v12SuccessorInputs: inputBindings,
    },
    builder: {
      generator: snapshot.identities.generator.descriptor,
      test: snapshot.identities.test.descriptor,
    },
  };
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 12);
  assert.equal(report.reportType,
    "g4-l10-complete-migration-template-contract-v12");
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured,
    0);
  const security = report.latestSecurityReviewBoundary;
  assert.equal(security.protocolStatus,
    "authored-unreviewed-review-infrastructure-successor");
  assert.equal(security.activeProtocolVersion, "v2.16");
  assert.equal(security.target.sha256, TARGET_SHA256);
  assert.deepEqual(security.addressedV215Findings, [...V216_FINDINGS]);
  assert.equal(security.addressedFindingDesignClaimsIndependentlyReviewed,
    false);
  assert.equal(security.addressedFindingClosureClaim, false);
  assert.deepEqual(security.requiredScopes,
    ["schema", "adversarial", "whole"]);
  assert.equal(security.reviewSetManifestBound, false);
  assert.equal(security.reviewSetManifestCreationAuthorizedByThisArtifact,
    false);
  assert.equal(security.freshUserOwnedReviewerTaskCountBound, 0);
  assert.equal(security.phaseAPreflightReceiptCountBound, 0);
  assert.equal(security.readyForFormalEvidenceReceiptCountBound, 0);
  assert.equal(security.phaseBEvidenceReceiptCountBound, 0);
  assert.equal(security.reviewerHumanConclusionCountBound, 0);
  assert.equal(security.qualifyingReviewerConclusionCountBound, 0);
  assert.deepEqual(security.independentFindingCounts, {
    p0: null,
    p1: null,
    p2: null,
    disposition: "UNEVALUATED_NOT_ZERO",
  });
  assert.equal(security.reviewerFindingUnionEvaluated, false);
  assert.equal(security.specReviewQualified, false);
  assert.equal(security.newHMG4RB4Allowed, false);
  assert.equal(security.hmg4rbSuccessorTokenExists, false);
  assert.equal(security.userOwnedTaskCreationAuthorizedByThisArtifact, false);
  assert.equal(security.formalPhaseAOrPhaseBInvocationAuthorizedByThisArtifact,
    false);
  assert.equal(security.productionHelperImplementationEligible, false);
  assert.equal(security.productionHelperImplementationAuthorized, false);
  assert.equal(security.productionHelperTestAuthorized, false);
  assert.equal(security.protectedInstallationAuthorized, false);
  assert.equal(security.helperExecutionAuthorized, false);
  assert.equal(security.originalRuntimeLaunchAuthorized, false);
  const runtimeGate = report.gates.find((gate) =>
    gate.id === "original-runtime-baseline");
  assert.equal(runtimeGate.status,
    "BLOCKED-V216-INDEPENDENT-REVIEW-NOT-AUTHORIZED-NOT-STARTED");
  assert.equal(runtimeGate.current.v216FreshUserOwnedTaskCount, 0);
  assert.deepEqual(runtimeGate.current.v216IndependentFindingCounts,
    security.independentFindingCounts);
  assert.equal(report.operatorGateSuccessor.operator.name, "Peter Hu");
  assert.equal(report.operatorGateSuccessor.operator.activated, false);
  assert.equal(report.operatorGateSuccessor.activationEligible, false);
  assert.equal(report.operatorGateSuccessor.runtimeAuthority, false);
  assert.equal(report.authorityBoundary.mayCreateUserOwnedTask, false);
  assert.equal(report.authorityBoundary.mayRunPhaseAOrPhaseB, false);
  assert.equal(report.authorityBoundary.mayImplementOrTestProductionHelper,
    false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.equal(report.downstreamTransactionBoundary
    .nativeHelperV2SecurityDesign.specReviewQualified, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  const security = report.latestSecurityReviewBoundary;
  return `# Grade 4 Lesson 10 complete migration template contract v12\n\n` +
    `Status: **${report.status}**. Template stable: **${report.templateStable}**.\n\n` +
    `V12 validates and preserves the exact v11 contract, then binds the ` +
    `v2.16 review protocol, deterministic verifier, and focused test as ` +
    `authored but independently unreviewed infrastructure. It preserves the ` +
    `frozen v2.14 target, the v2.15 antecedent, and the strict nonqualifying ` +
    `history closure without creating a new review batch.\n\n` +
    `## Security review boundary\n\n` +
    `- Active authored protocol: **${security.activeProtocolVersion}**; ` +
    `status: **${security.v216AuthoringStatus}**.\n` +
    `- Required future scopes: **${security.requiredScopes.join(", ")}**.\n` +
    `- Review-set/task/Phase A/READY/Phase B/human conclusion counts: ` +
    `**${Number(security.reviewSetManifestBound)}/` +
    `${security.freshUserOwnedReviewerTaskCountBound}/` +
    `${security.phaseAPreflightReceiptCountBound}/` +
    `${security.readyForFormalEvidenceReceiptCountBound}/` +
    `${security.phaseBEvidenceReceiptCountBound}/` +
    `${security.reviewerHumanConclusionCountBound}**.\n` +
    `- Independent P0/P1/P2: **UNEVALUATED — not zero**.\n` +
    `- New HMG4RB4 allowed: **${security.newHMG4RB4Allowed}**; ` +
    `spec-review-qualified: **${security.specReviewQualified}**.\n\n` +
    `## Retained migration gate\n\n` +
    `Lesson 10 remains 47 members with ` +
    `${report.currentFormalState.requirements.naturalScheduleReady}/` +
    `${report.currentFormalState.requirements.total} natural schedules ready ` +
    `and ${report.currentFormalState.frameObligations.authoritativeCaptured}/` +
    `${report.currentFormalState.frameObligations.total} authoritative runtime ` +
    `frames captured. Grade 4 still has 16 SHA-unresolved MP3 dependencies. ` +
    `This artifact creates no reviewer task, review-set manifest, Phase A or ` +
    `Phase B receipt, reviewer conclusion, helper implementation/test, ` +
    `protected installation, helper execution, original-runtime launch, ` +
    `specification adoption, renderer, comparison, review, acceptance, ` +
    `promotion, integration, release, or publication authority.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function outputState(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

function resultFor(disposition, report) {
  return {
    disposition,
    status: report.status,
    reportFingerprintSha256: report.reportFingerprintSha256,
    templateStable: false,
    activeReviewProtocol: "v2.16-unreviewed",
    reviewSetManifestBound: false,
    freshUserOwnedReviewerTaskCountBound: 0,
    phaseAPreflightReceiptCountBound: 0,
    phaseBEvidenceReceiptCountBound: 0,
    reviewerConclusionCountBound: 0,
    independentFindingDisposition: "UNEVALUATED_NOT_ZERO",
    specReviewQualified: false,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    productionHelperAuthorized: false,
    acceptanceEffect: false,
  };
}

export async function checkContract(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expectedContent] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.equal(modeString(stat), "0444", `${relativePath} mode changed`);
    const observed = await readFile(absolute);
    assert.equal(observed.length, Buffer.byteLength(expectedContent),
      `${relativePath} byte count changed`);
    assert.equal(sha256(observed), sha256(Buffer.from(expectedContent)),
      `${relativePath} SHA-256 changed`);
  }
  if (options.skipInputCheck !== true) await assertSnapshotUnchanged(bundle.snapshot);
  return resultFor("checked", bundle.report);
}

export async function publishNoClobber(bundle, options = {}) {
  const root = await canonicalRoot(options.outputRoot ??
    bundle.snapshot.projectRoot);
  const jsonState = await outputState(root, REPORT_JSON);
  const markdownState = await outputState(root, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkContract(bundle, root, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkContract(bundle);
  return resultFor("dry-run", bundle.report);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
